import sharp from "sharp";
import { createHash } from "node:crypto";
import { z } from "zod";
import {
  checkAiRateLimit,
  checkImageBan,
  recordImageAndCheckBan,
} from "../../../lib/ai-rate-limit";
import { createGeminiModel } from "../../../lib/gemini";
import { formatShoeAnalysis } from "../../../lib/shoe-analysis";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_REQUEST_BYTES = 4_300_000;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_BASE64_LENGTH = 4 * Math.ceil(MAX_IMAGE_BYTES / 3);

const scanRequestSchema = z
  .object({
    imageBase64: z.string().min(1).max(MAX_IMAGE_BASE64_LENGTH).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  })
  .strict();

async function readBoundedJson(request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { error: "The uploaded photo is too large. Choose a photo under 3 MB.", status: 413 };
  }

  const reader = request.body?.getReader();
  if (!reader) return { error: "A JSON request body is required.", status: 400 };

  const chunks = [];
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      byteLength += value.byteLength;
      if (byteLength > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { error: "The uploaded photo is too large. Choose a photo under 3 MB.", status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { error: "The request body could not be read. Please try again.", status: 400 };
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { body: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)) };
  } catch {
    return { error: "The request body must contain valid JSON.", status: 400 };
  }
}

function hasExpectedImageSignature(bytes, mimeType) {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  return (
    mimeType === "image/webp" &&
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  );
}

export async function POST(request) {
  let imageBan;
  try {
    imageBan = await checkImageBan(request);
  } catch (error) {
    console.error("AI image-ban check failed:", error?.name ?? "UnknownError");
    return Response.json(
      { error: "Shoe evaluation is temporarily unavailable. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (imageBan.banned) {
    return Response.json(
      {
        error: `Image uploads from this network are paused. Please try again in ${Math.ceil(imageBan.retryAfterSeconds / 60)} minute(s).`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(imageBan.retryAfterSeconds),
          "Cache-Control": "private, no-store",
        },
      },
    );
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json({ error: "Send the photo as a JSON request." }, { status: 415 });
  }

  const bodyResult = await readBoundedJson(request);
  if (bodyResult.error) {
    return Response.json({ error: bodyResult.error }, { status: bodyResult.status });
  }

  const parsedBody = scanRequestSchema.safeParse(bodyResult.body);
  if (!parsedBody.success) {
    return Response.json(
      { error: "Choose a JPEG, PNG, or WebP photo under 3 MB." },
      { status: 400 },
    );
  }

  let rateLimit;
  try {
    rateLimit = await checkAiRateLimit(request);
  } catch (error) {
    console.error("AI rate limiter unavailable:", error?.name ?? "UnknownError");
    return Response.json(
      { error: "Shoe evaluation is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  if (!rateLimit.allowed) {
    return Response.json(
      { error: "You've reached the photo-evaluation limit. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const imageBytes = Buffer.from(parsedBody.data.imageBase64, "base64");
  if (
    imageBytes.length === 0 ||
    imageBytes.length > MAX_IMAGE_BYTES ||
    !hasExpectedImageSignature(imageBytes, parsedBody.data.mimeType)
  ) {
    return Response.json(
      { error: "That file is not a supported shoe photo. Choose a JPEG, PNG, or WebP image." },
      { status: 400 },
    );
  }

  let sanitizedImage;
  try {
    const image = sharp(imageBytes, { limitInputPixels: 12_000_000, failOn: "error" });
    const metadata = await image.metadata();
    const expectedFormat = {
      "image/jpeg": "jpeg",
      "image/png": "png",
      "image/webp": "webp",
    }[parsedBody.data.mimeType];

    if (metadata.format !== expectedFormat || !metadata.width || !metadata.height) {
      return Response.json({ error: "The uploaded file is not a valid supported image." }, { status: 400 });
    }

    sanitizedImage = await image
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return Response.json(
      { error: "The photo could not be processed. Please choose another image." },
      { status: 400 },
    );
  }

  const imageFingerprint = createHash("sha256").update(sanitizedImage).digest("hex");
  try {
    imageBan = await recordImageAndCheckBan(request, imageFingerprint);
  } catch (error) {
    console.error("AI repeated-image protection failed:", error?.name ?? "UnknownError");
    return Response.json(
      { error: "Shoe evaluation is temporarily unavailable. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (imageBan.banned) {
    return Response.json(
      {
        error: `This image has been submitted too many times. Image uploads from this network are paused for ${Math.ceil(imageBan.retryAfterSeconds / 60)} minute(s).`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(imageBan.retryAfterSeconds),
          "Cache-Control": "private, no-store",
        },
      },
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "Shoe evaluation is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const model = createGeminiModel();
    const result = await model.generateContent(
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: sanitizedImage.toString("base64"),
                  mimeType: "image/jpeg",
                },
              },
              {
                text: `Determine whether this image clearly shows a piece of footwear, then identify it if it does. Footwear includes shoes, sneakers, boots, sandals, slippers, cleats, and other items worn on the feet. Clothing, socks, people, animals, objects, empty scenes, and images where footwear cannot be seen are not footwear. Return only a JSON object with exactly these fields: "isFootwear" (boolean), "brand", "model", "conditionGrade", "conditionDetails", and "notable". For non-footwear, set "isFootwear" to false, set brand and model to "Not applicable", set conditionGrade to "unable to assess", and use empty strings for conditionDetails and notable.

Rules:
- Do not claim an image is footwear if the footwear itself is not visibly present. Be conservative when unclear.
- Use the brand's and model's correctly capitalized names. Do not guess; use "Unable to identify from this photo" when the image does not support a confident identification.
- Set "conditionGrade" to exactly one of: "new", "excellent", "good", "fair", "heavily worn", or "unable to assess". Choose the grade supported by visible wear; never infer condition from brand or model.
- Write "conditionDetails" as a short descriptive phrase about visible wear, without a sentence or final period. Use an empty string if there are no details or condition cannot be assessed.
- Write "notable" as one concise, grammatical sentence about visible details, or an empty string if there are none.
- Do not include markdown, estimates, prices, or any text outside the JSON object.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 256,
        },
      },
      { timeout: 20_000 },
    );
    const analysis = formatShoeAnalysis(result?.response?.text?.() ?? "");
    return Response.json(analysis, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Shoe evaluation failed:", error?.name ?? "UnknownError");
    return Response.json(
      { error: "The shoe evaluation could not be completed. Please try again." },
      { status: 502, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

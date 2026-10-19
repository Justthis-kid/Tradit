import { createGeminiModel } from "../../../lib/gemini";

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function cleanText(value, maxLength, { sentence = false, fallback } = {}) {
  if (typeof value !== "string") return fallback;

  let text = value.replace(/\s+/g, " ").trim().replace(/^["'`]+|["'`]+$/g, "");
  if (!text) return fallback;

  text = text.slice(0, maxLength).trim();
  text = text.charAt(0).toLocaleUpperCase() + text.slice(1);

  if (sentence && !/[.!?]$/.test(text)) {
    text += ".";
  }

  return text;
}

const conditionDescriptions = {
  new: "The shoe appears to be new",
  excellent: "The shoe appears to be in excellent condition",
  good: "The shoe appears to be in good condition",
  fair: "The shoe appears to be in fair condition",
  "heavily worn": "The shoe appears to be heavily worn",
  "unable to assess": "The shoe's condition could not be assessed from this photo",
};

function parseAnalysis(text) {
  const jsonText = text.trim().replace(/^```(?:json)?\s*|\s*```$/gi, "");
  const analysis = JSON.parse(jsonText);
  const conditionGrade =
    typeof analysis.conditionGrade === "string"
      ? analysis.conditionGrade.trim().toLowerCase()
      : "unable to assess";
  const conditionStart =
    conditionDescriptions[conditionGrade] ?? conditionDescriptions["unable to assess"];
  const cleanedConditionDetails = cleanText(analysis.conditionDetails, 180)
    ?.replace(/^with\s+/i, "")
    .replace(/[.!?]+$/, "");
  const conditionDetails = cleanedConditionDetails
    ? cleanedConditionDetails.charAt(0).toLocaleLowerCase() + cleanedConditionDetails.slice(1)
    : "";

  return {
    brand: cleanText(analysis.brand, 80, {
      fallback: "Unable to identify from this photo",
    }),
    model: cleanText(analysis.model, 100, {
      fallback: "Unable to identify from this photo",
    }),
    condition: `${conditionStart}${conditionDetails && conditionGrade !== "unable to assess" ? `, with ${conditionDetails}` : ""}.`,
    notable: cleanText(analysis.notable, 300, { sentence: true, fallback: null }),
  };
}

function getTrendingScore(analysis) {
  const text = `${analysis.brand} ${analysis.model} ${analysis.condition} ${analysis.notable ?? ""}`
    .toLowerCase();
  const trendBoosters = [
    "rare",
    "limited",
    "collab",
    "exclusive",
    "trending",
    "popular",
    "viral",
    "hype",
    "retro",
    "vintage",
    "iconic",
  ];
  let score = 30;

  for (const keyword of trendBoosters) {
    if (text.includes(keyword)) score += 8;
  }

  if (/\b(new|excellent|mint)\b/.test(text)) score += 6;
  if (/\b(worn|heavily used)\b/.test(text)) score -= 8;

  return Math.max(0, Math.min(100, score));
}

function getConditionMultiplier(condition) {
  const text = condition.toLowerCase();

  if (/\b(new|excellent|mint)\b/.test(text)) return 0.35;
  if (/\bgood\b/.test(text)) return 0.25;
  if (/\bfair\b/.test(text)) return 0.18;
  if (/\b(worn|heavily used)\b/.test(text)) return 0.1;
  return 0.15;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body ?? {};
    const referencePrice = Number(body?.referencePrice ?? 0);

    if (typeof imageBase64 !== "string" || !imageBase64.trim()) {
      return Response.json({ error: "A shoe photo is required." }, { status: 400 });
    }

    if (!supportedImageTypes.has(mimeType)) {
      return Response.json(
        { error: "Use a JPEG, PNG, or WebP shoe photo." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(referencePrice) || referencePrice <= 0) {
      return Response.json({ error: "A valid reference price is required." }, { status: 400 });
    }

    const model = createGeminiModel();
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            {
              text: `Identify the single shoe shown in this photo. Return only a JSON object with exactly these string fields: "brand", "model", "conditionGrade", "conditionDetails", and "notable".

Rules:
- Use the brand's and model's correctly capitalized names. Do not guess; use "Unable to identify from this photo" when the image does not support a confident identification.
- Set "conditionGrade" to exactly one of: "new", "excellent", "good", "fair", "heavily worn", or "unable to assess". Choose the grade supported by visible wear; never infer condition from brand or model.
- Write "conditionDetails" as a short descriptive phrase about visible wear (for example, "light creasing near the toe and mild outsole wear"), without a sentence or a final period. Use an empty string if there are no details or condition cannot be assessed.
- Write "notable" as one concise, grammatical sentence about visible details, or an empty string if there are none.
- Do not include markdown, estimates, or any text outside the JSON object.`,
            },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json" },
    });
    const aiText = result?.response?.text?.() ?? "";

    let analysis;
    try {
      analysis = parseAnalysis(aiText);
    } catch {
      return Response.json(
        { error: "The shoe details could not be read. Please try a clearer photo." },
        { status: 502 },
      );
    }

    const trendingScore = getTrendingScore(analysis);
    const trendMultiplier = 0.5 + trendingScore / 100;
    const estimatedOffer = referencePrice * getConditionMultiplier(analysis.condition) * trendMultiplier;
    const returnValue = Math.round(Math.min(estimatedOffer, referencePrice * 0.5) * 100) / 100;

    return Response.json({ ...analysis, trendingScore, returnValue });
  } catch (error) {
    console.error("Shoe evaluation failed:", error);
    return Response.json(
      { error: "The shoe evaluation could not be completed. Please try again." },
      { status: 500 },
    );
  }
}

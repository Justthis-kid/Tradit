import { createGeminiModel } from "@/lib/gemini";

export async function POST(req) {
  try {
    const body = await req.json();
    const imageBase64 = body?.imageBase64;

    if (!imageBase64) {
      return Response.json(
        { error: "Missing imageBase64 field in request body" },
        { status: 400 }
      );
    }

    const model = createGeminiModel();

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      },
      "Analyze this shoe image. Return a short JSON object with keys: brand, model, condition, wearLevel, notableFeatures. If unknown, use null for that field."
    ]);

    const aiText = result?.response?.text?.() ?? "";

    let parsed = null;
    try {
      parsed = JSON.parse(aiText);
    } catch {
      return Response.json({ scanText: aiText });
    }

    return Response.json({ scan: parsed });
  } catch (err) {
    return Response.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

// app/api/scan/route.js
import { createGeminiModel } from "../../../lib/gemini";

/**
 * Heuristic parser: tries to extract keywords from AI text.
 * Also computes a trending score 0-100 based on keywords.
 */
function analyzeTextForMetadata(text) {
  const lower = (text || "").toLowerCase();
  const metadata = {
    brand: null,
    model: null,
    condition: null,
    trendingScore: 30 // baseline
  };

  // Brand/model heuristics (very simple)
  // Look for common separators like ":" or "brand" words
  const brandMatch = lower.match(/brand[:\s]*([a-z0-9\- ]{2,40})/i);
  if (brandMatch) metadata.brand = brandMatch[1].trim();

  const modelMatch = lower.match(/model[:\s]*([a-z0-9\- ]{2,60})/i);
  if (modelMatch) metadata.model = modelMatch[1].trim();

  // Condition heuristics
  if (lower.includes("new") || lower.includes("brand new") || lower.includes("deadstock")) metadata.condition = "New";
  else if (lower.includes("excellent") || lower.includes("mint")) metadata.condition = "Excellent";
  else if (lower.includes("good") || lower.includes("lightly used")) metadata.condition = "Good";
  else if (lower.includes("fair") || lower.includes("used")) metadata.condition = "Fair";
  else if (lower.includes("worn") || lower.includes("heavily used")) metadata.condition = "Worn";

  // Trend keywords
  const trendBoosters = ["rare","limited","collab","exclusive","trending","popular","viral","hype","retro","vintage","iconic"];
  for (const kw of trendBoosters) {
    if (lower.includes(kw)) metadata.trendingScore += 8;
  }

  // Condition affects trend: new/excellent slightly higher
  if (metadata.condition === "New" || metadata.condition === "Excellent") metadata.trendingScore += 6;
  if (metadata.condition === "Worn") metadata.trendingScore -= 8;

  // Clamp
  metadata.trendingScore = Math.max(0, Math.min(100, metadata.trendingScore));
  return metadata;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const imageBase64 = body?.imageBase64;
    const referencePrice = Number(body?.referencePrice ?? 0);

    if (!imageBase64) {
      return Response.json({ error: "Missing imageBase64 field in request body" }, { status: 400 });
    }

    const model = createGeminiModel();

    // Ask Gemini to analyze the shoe and return a short JSON-like text
    const prompt = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      },
      `You are an expert sneaker appraiser. Analyze the shoe image and return a short plain-text description including brand, model, condition, and any notable features. Use short sentences.`
    ];

    const result = await model.generateContent(prompt);
    const aiText = result?.response?.text?.() ?? "";

    // Try to parse JSON if model returned JSON
    let parsed = null;
    try {
      parsed = JSON.parse(aiText);
    } catch {
      parsed = null;
    }

    // If parsed JSON exists and has fields, use them; otherwise heuristically parse aiText
    const metaFromAI = parsed ?? analyzeTextForMetadata(aiText);

    // Compute trending score if not present
    const trendingScore = metaFromAI.trendingScore ?? analyzeTextForMetadata(aiText).trendingScore;

    // Compute return value: baseOffer = referencePrice * factor
    // Factor derived from condition and trendingScore
    // Condition multiplier
    let conditionMultiplier = 0.15; // default 15% of price
    const cond = (metaFromAI.condition || "").toLowerCase();
    if (cond.includes("new") || cond.includes("excellent")) conditionMultiplier = 0.35;
    else if (cond.includes("good")) conditionMultiplier = 0.25;
    else if (cond.includes("fair")) conditionMultiplier = 0.18;
    else if (cond.includes("worn")) conditionMultiplier = 0.10;

    // Trend multiplier: scale trendingScore 0-100 to 0.5 -> 1.5 multiplier
    const trendMultiplier = 0.5 + (trendingScore / 100) * 1.0; // between 0.5 and 1.5

    let offer = referencePrice * conditionMultiplier * trendMultiplier;

    // Cap offer at 50% of referencePrice
    const cap = referencePrice * 0.5;
    if (offer > cap) offer = cap;

    // Round to 2 decimals
    offer = Math.round(offer * 100) / 100;

    const response = {
      brand: metaFromAI.brand ?? null,
      model: metaFromAI.model ?? null,
      condition: metaFromAI.condition ?? null,
      notable: parsed?.notable ?? null,
      trendingScore,
      returnValue: offer,
      rawText: aiText
    };

    return Response.json(response);
  } catch (err) {
    return Response.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

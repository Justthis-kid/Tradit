import { z } from "zod";

const analysisSchema = z
  .object({
    isFootwear: z.boolean(),
    brand: z.string().trim().min(1).max(80),
    model: z.string().trim().min(1).max(100),
    conditionGrade: z.enum([
      "new",
      "excellent",
      "good",
      "fair",
      "heavily worn",
      "unable to assess",
    ]),
    conditionDetails: z.string().max(180),
    notable: z.string().max(300),
  })
  .strict();

const conditionDescriptions = {
  new: "The shoe appears to be new",
  excellent: "The shoe appears to be in excellent condition",
  good: "The shoe appears to be in good condition",
  fair: "The shoe appears to be in fair condition",
  "heavily worn": "The shoe appears to be heavily worn",
  "unable to assess": "The shoe's condition could not be assessed from this photo",
};

export function formatShoeAnalysis(text) {
  const jsonText = text.trim().replace(/^```(?:json)?\s*|\s*```$/gi, "");
  const analysis = analysisSchema.parse(JSON.parse(jsonText));
  if (!analysis.isFootwear) {
    return {
      isFootwear: false,
      message:
        "This image doesn't appear to show footwear. Please upload a clear photo of a shoe, boot, sandal, slipper, or other footwear.",
    };
  }

  const brand = analysis.brand.replace(/\s+/g, " ").replace(/^["'`]+|["'`]+$/g, "");
  const model = analysis.model.replace(/\s+/g, " ").replace(/^["'`]+|["'`]+$/g, "");
  const details = analysis.conditionDetails
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^with\s+/i, "")
    .replace(/[.!?]+$/, "");
  const conditionDetails = details
    ? `, with ${details.charAt(0).toLocaleLowerCase()}${details.slice(1)}`
    : "";
  const notable = analysis.notable.replace(/\s+/g, " ").trim();

  return {
    isFootwear: true,
    brand: brand.charAt(0).toLocaleUpperCase() + brand.slice(1),
    model: model.charAt(0).toLocaleUpperCase() + model.slice(1),
    condition: `${conditionDescriptions[analysis.conditionGrade]}${analysis.conditionGrade === "unable to assess" ? "" : conditionDetails}.`,
    notable: notable
      ? `${notable.charAt(0).toLocaleUpperCase()}${notable.slice(1).replace(/[.!?]+$/, "")}.`
      : null,
  };
}

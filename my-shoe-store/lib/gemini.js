import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * createGeminiModel
 * - Throws a clear error if GEMINI_API_KEY is missing.
 * - Returns a configured Gemini generative model instance.
 */
export function createGeminiModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Add it to .env.local and Vercel env vars.");
  }

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client.getGenerativeModel({ model: "gemini-2.0-flash" });
}

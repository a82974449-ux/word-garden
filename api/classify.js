import { callGemini } from "./_gemini.js";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  try {
    const { word, arabic } = req.body || {};
    if (!word) {
      res.status(400).json({ error: "missing_word" });
      return;
    }
    const needsTranslation = !arabic;
    const prompt = `Classify the CEFR level (one of exactly: A1, A2, B1, B2, C1, C2) of the English word "${word}" using standard vocabulary frequency and difficulty guidelines. Also suggest one single emoji that best represents its meaning.${
      needsTranslation ? " Also provide a short, accurate Modern Standard Arabic translation of this word." : ""
    }
Respond with ONLY a raw JSON object and nothing else (no markdown fences, no explanation), in exactly this shape:
{"level": "B1", "emoji": "🌱"${needsTranslation ? ', "arabic": "..."' : ""}}`;
    const clean = await callGemini(prompt, 200);
    const parsed = JSON.parse(clean);
    const level = LEVELS.includes(parsed.level) ? parsed.level : "B1";
    res.status(200).json({
      level,
      emoji: parsed.emoji || "🌿",
      arabic: arabic || parsed.arabic || "",
    });
  } catch (e) {
    res.status(500).json({ error: "classify_failed", detail: String((e && e.message) || e) });
  }
}

import { callGemini } from "./_gemini.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  try {
    const { word, arabic, level } = req.body || {};
    if (!word) {
      res.status(400).json({ error: "missing_word" });
      return;
    }
    const prompt = `For the English word "${word}" (Arabic translation: "${arabic || ""}", CEFR level ${level || "B1"}), provide:
1) A simple IPA phonetic transcription of the word.
2) An approximate pronunciation written using Arabic letters (for an Arabic-speaking learner who cannot read IPA).
3) A short, simple definition in English.
4) One natural example sentence in English using the word.
5) An Arabic translation of that definition.
6) An Arabic translation of that example sentence.
Respond with ONLY a raw JSON object (no markdown fences, no explanation), in exactly this shape:
{"phonetic_ipa":"...","phonetic_ar":"...","definition_en":"...","definition_ar":"...","example_en":"...","example_ar":"..."}`;
    const clean = await callGemini(prompt, 450);
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: "enrich_failed", detail: String((e && e.message) || e) });
  }
}

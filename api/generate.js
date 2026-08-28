import { callGemini } from "./_gemini.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  try {
    const { level, existing } = req.body || {};
    if (!level) {
      res.status(400).json({ error: "missing_level" });
      return;
    }
    const existingList = Array.isArray(existing) ? existing : [];
    const excludeCsv = existingList.slice(-80).join(", ") || "none";
    const prompt = `Generate 8 new, distinct English vocabulary words suitable for CEFR level ${level}, that are NOT in this list: ${excludeCsv}.
For each word provide a short, accurate Modern Standard Arabic translation, and one single emoji that best represents its meaning.
Respond with ONLY a raw JSON array (no markdown fences, no explanation), in exactly this shape:
[{"en":"word","ar":"ترجمة","emoji":"🌱"}]`;
    const clean = await callGemini(prompt, 700);
    const parsed = JSON.parse(clean);
    const lowerExisting = new Set(existingList.map((w) => String(w).toLowerCase()));
    const fresh = (Array.isArray(parsed) ? parsed : []).filter(
      (w) => w && w.en && w.ar && !lowerExisting.has(String(w.en).toLowerCase())
    );
    res.status(200).json(fresh);
  } catch (e) {
    res.status(500).json({ error: "generate_failed", detail: String((e && e.message) || e) });
  }
}

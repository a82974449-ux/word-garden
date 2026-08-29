// Shared helper used by the serverless functions in this folder.
// GEMINI_API_KEY lives only in Vercel's environment variables — it is
// never sent to the browser, unlike the Firebase config in src/firebase.js.
export async function callGemini(prompt, maxOutputTokens) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: Math.max(maxOutputTokens, 500),
        thinkingConfig: { thinkingLevel: "MINIMAL" },
      },
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    const err = new Error("gemini_http_" + response.status + ": " + errText);
    err.status = response.status;
    throw err;
  }
  const data = await response.json();
  const text =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;
  const clean = (text || "").replace(/```json|```/g, "").trim();
  const firstBrace = clean.indexOf("{");
  const firstBracket = clean.indexOf("[");
  let start = -1;
  if (firstBrace === -1) start = firstBracket;
  else if (firstBracket === -1) start = firstBrace;
  else start = Math.min(firstBrace, firstBracket);
  if (start === -1) return clean;
  const isArray = clean[start] === "[";
  const endChar = isArray ? "]" : "}";
  const end = clean.lastIndexOf(endChar);
  if (end === -1 || end < start) return clean;
  return clean.slice(start, end + 1);
}

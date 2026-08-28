// Shared helper used by the serverless functions in this folder.
// GEMINI_API_KEY lives only in Vercel's environment variables — it is
// never sent to the browser, unlike the Firebase config in src/firebase.js.
export async function callGemini(prompt, maxOutputTokens) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens, temperature: 0.7 },
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
  return (text || "").replace(/```json|```/g, "").trim();
}

// /api/generate-crm.js
// Vercel serverless function (Node.js runtime).
// Drží API klíč v tajnosti na serveru a přeposílá požadavek na Google Gemini API.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemPrompt, userPrompt } = req.body || {};

  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: 'Chybí systemPrompt nebo userPrompt.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server není nakonfigurován (chybí GEMINI_API_KEY).' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${errText}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Neznámá chyba serveru.' });
  }
}

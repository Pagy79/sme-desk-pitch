// /api/generate-crm.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemPrompt, userPrompt } = req.body || {};

  if (!userPrompt) {
    return res.status(400).json({ error: 'Chybí userPrompt.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server není nakonfigurován (chybí GEMINI_API_KEY).' });
  }

  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash'];
  let lastError = null;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ]
  };

  if (systemPrompt) {
    payload.system_instruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        return res.status(200).json({ text });
      }

      lastError = await response.text();
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ error: `Gemini API error: ${lastError}` });
}

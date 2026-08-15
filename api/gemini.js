export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured in Vercel.' });
    }

    try {
        const { userPrompt, engineState } = req.body || {};

        const promptWithContext = `
You are an expert Digital Logic CAD Assistant for student Roll No: CO26BTECH11021.

CURRENT WORKSPACE CAD CONTEXT:
- Logic Expression: ${engineState?.expression || 'N/A'}
- Minimal SOP: ${engineState?.sop || 'N/A'}
- Generated Verilog:
${engineState?.verilog || 'N/A'}

USER QUESTION:
${userPrompt || 'Explain the current circuit state.'}

Keep your explanation clear, technically accurate, and concise.
        `.trim();

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: promptWithContext }]
                    }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return res.status(500).json({ error: data.error.message || 'Error from Google Gemini API.' });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            return res.status(500).json({ error: 'No text returned from Gemini API.' });
        }

        return res.status(200).json({ reply });
    } catch (err) {
        console.error("Handler Exception:", err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

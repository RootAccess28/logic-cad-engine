export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment variables.' });
    }

    try {
        const { userPrompt, engineState } = req.body || {};

        const systemPrompt = `
You are an expert Digital Logic Assistant built into a Digital Logic CAD Engine web application.
Student Roll No: CO26BTECH11021.

Current CAD Engine Application State:
- Logic Expression: ${engineState?.expression || 'N/A'}
- Minimal SOP: ${engineState?.sop || 'N/A'}
- Generated Verilog:
${engineState?.verilog || 'N/A'}

Your Goal:
1. Explain Boolean minimization steps (K-Maps, Quine-McCluskey).
2. Troubleshoot circuit syntax or hardware mapping (2-input NAND, NOR, XOR).
3. Answer digital electronics theory questions concisely and clearly.
        `.trim();

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: userPrompt || 'Hello' }]
                    }
                ],
                generationConfig: {
                    temperature: 0.3
                }
            })
        });

        const data = await geminiRes.json();

        if (data.error) {
            console.error("Gemini API returned error:", data.error);
            return res.status(500).json({ error: data.error.message || 'Error from Gemini API.' });
        }

        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
            return res.status(500).json({ error: 'No text returned from model.' });
        }

        return res.status(200).json({ reply: candidateText });
    } catch (err) {
        console.error("Serverless Function Error:", err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

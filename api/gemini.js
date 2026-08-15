import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userPrompt, engineState } = req.body || {};

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
        }

        const promptText = `
Workspace Context:
- Logic Expression: ${engineState?.expression || 'N/A'}
- Minimal SOP: ${engineState?.sop || 'N/A'}
- Verilog: ${engineState?.verilog || 'N/A'}

User Query: ${userPrompt}
        `.trim();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
            config: {
                systemInstruction: "You are an expert digital logic design assistant. Keep explanations concise, scannable, and helpful."
            }
        });

        // Safe extraction across SDK variations
        const outputText = response.text || 
                           response.candidates?.[0]?.content?.parts?.[0]?.text || 
                           (typeof response === 'string' ? response : null);

        if (!outputText) {
            return res.status(500).json({ error: 'Model generated an empty response.' });
        }

        return res.status(200).json({ reply: outputText });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: error.message || 'Error processing request.' });
    }
}

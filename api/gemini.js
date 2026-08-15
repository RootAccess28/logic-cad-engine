import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userPrompt, engineState } = req.body || {};

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not set in Vercel Environment Variables.' });
        }

        const systemInstruction = `
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
            3. Answer digital electronics theory questions concisely.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3
            }
        });

        return res.status(200).json({ reply: response.text });
    } catch (error) {
        console.error("Gemini Serverless Error:", error);
        return res.status(500).json({ error: error.message || 'Gemini API request failed.' });
    }
}
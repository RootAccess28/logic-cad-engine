import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/gemini', async (req, res) => {
    try {
        const { userPrompt, engineState } = req.body;

        const systemInstruction = `
            You are an expert Digital Logic Assistant built into a Digital Logic CAD Engine web application.
            NITIN      CO26BTECH11021
            VAIBHAV    CO26BTECH11031
            MAYANK     CO26BTECH11016
            SHIVANSI   CO26BTECH11027
            ANUSHKA    CO26BTECH11030
                        
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
            model: 'gemini-3.5-flash',
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3
            }
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to communicate with Gemini API." });
    }
});

// Fallback to index.html for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});
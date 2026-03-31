import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIRROR_PATH = path.join(process.cwd(), 'database', 'mirror.json');

const readMirror = () => {
    try {
        if (!fs.existsSync(MIRROR_PATH)) return { settings: { geminiApiKey: "" } };
        return JSON.parse(fs.readFileSync(MIRROR_PATH, 'utf-8'));
    } catch (e) { return { settings: { geminiApiKey: "" } }; }
};

// Auto-discover the first available model that supports generateContent
async function getAvailableModel(apiKey: string): Promise<string | null> {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        if (!data.models) return null;
        // Find first model that supports generateContent, prefer flash/pro
        const preferred = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
        for (const pref of preferred) {
            const found = data.models.find((m: any) => 
                m.name.includes(pref) && 
                m.supportedGenerationMethods?.includes('generateContent')
            );
            if (found) return found.name.replace('models/', '');
        }
        // Fallback: first model that supports generateContent
        const fallback = data.models.find((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent')
        );
        return fallback ? fallback.name.replace('models/', '') : null;
    } catch (e) {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const { prompt, days, hours } = await req.json();
        const data = readMirror();
        const apiKey = data.settings?.geminiApiKey || data.settings?.aiApiKey;

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API Key Missing. Please set it in Aura Settings." }, { status: 401 });
        }

        // Step 1: Auto-discover available model
        const modelName = await getAvailableModel(apiKey);
        if (!modelName) {
            return NextResponse.json({ error: "No Gemini model available for your API key. Please verify the key at aistudio.google.com." }, { status: 500 });
        }

        const systemPrompt = `You are the Aura Mastery Architect. Generate a professional, execution-focused learning roadmap.
CONSTRAINTS:
- TOTAL DAYS: ${days} days.
- HOURS PER DAY: ${hours} hours.
- STRUCTURE: Each day MUST follow the 40/40/20 split (Learning/Practice/Debugging).
- OUTCOMES: Every day MUST end with "Outcome: After this day, you should be able to..."
- MVP PROJECTS: Inject small, practical projects every 2-3 days.
- ADVANCED TOPICS: Move complex topics (Closures, Decorators) to an "Optional Mastery" node at the end.

OUTPUT FORMAT:
Return ONLY a raw JSON array (no markdown, no code blocks). Each item:
{ "id": "d<number>", "title": "Day X [<Xh> Focus]: <Topics> | Outcome: <capability>", "status": "todo", "timeSpentSeconds": 0, "createdAt": "<ISO date>" }`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nCurriculum to organize: ${prompt}` }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
                })
            }
        );

        const aiResult = await response.json();
        if (aiResult.error) {
            return NextResponse.json({ error: `[Model: ${modelName}] ${aiResult.error.message}` }, { status: 500 });
        }
        
        const content = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // Strip any accidental markdown code fences
        const cleaned = content.replace(/```json|```/gi, '').trim();
        const roadmap = JSON.parse(cleaned);

        return NextResponse.json(roadmap);
    } catch (e) {
        return NextResponse.json({ error: "Aura Gemini Bridge: " + (e as Error).message }, { status: 500 });
    }
}

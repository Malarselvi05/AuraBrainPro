import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIRROR_PATH = path.join(process.cwd(), 'database', 'mirror.json');

const readMirror = () => {
    try {
        if (!fs.existsSync(MIRROR_PATH)) return { settings: { aiApiKey: "" } };
        return JSON.parse(fs.readFileSync(MIRROR_PATH, 'utf-8'));
    } catch (e) { return { settings: { aiApiKey: "" } }; }
};

export async function POST(req: Request) {
    try {
        const { prompt, days, hours } = await req.json();
        const data = readMirror();
        const apiKey = data.settings?.aiApiKey;

        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API Key Missing. Please set it in Aura Settings (Cog icon)." }, { status: 401 });
        }

        // --- THE MASTER AURA ARCHITECT SYSTEM PROMPT ---
        const systemMessage = `
            You are the Aura Mastery Architect. Your task is to generate a professional, execution-focused learning roadmap.
            CONSTRAINTS:
            - TOTAL DAYS: ${days} days.
            - HOURS PER DAY: ${hours} hours.
            - STRUCTURE: Each day must use a 40/40/20 split (Learning/Practice/Debugging).
            - OUTCOMES: Every day must end with: "Outcome: After this day, you should be able to..."
            - MVP PROJECTS: Inject small, practical projects every 2-3 days.
            - ADVANCED TOPICS: Move complex topics (Closures, Decorators) to an "Optional Mastery" node at the end.
            
            OUTPUT FORMAT:
            Provide a JSON array of subtasks. Each subtask must have:
            { "id": "unique_id", "title": "Day X [Xh Focus]: (Topics) | Outcome: X", "status": "todo", "timeSpentSeconds": 0, "createdAt": "ISO_DATE" }
            Return ONLY the valid JSON array. No extra text.
        `;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemMessage },
                    { role: "user", content: `Organize this curriculum: ${prompt}` }
                ],
                temperature: 0.7
            })
        });

        const aiResult = await response.json();
        if (aiResult.error) return NextResponse.json({ error: aiResult.error.message }, { status: 500 });
        
        const content = aiResult.choices[0].message.content;
        // Strip code block markers if present
        const cleaned = content.replace(/```json|```/g, '').trim();
        const roadmap = JSON.parse(cleaned);

        return NextResponse.json(roadmap);
    } catch (e) {
        return NextResponse.json({ error: "Aura AI Bridge Failure: " + (e as Error).message }, { status: 500 });
    }
}

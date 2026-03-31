import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIRROR_PATH = path.join(process.cwd(), 'database', 'mirror.json');

const readMirror = () => {
  try {
    if (!fs.existsSync(MIRROR_PATH)) return { tasks: [], quotes: [] };
    const content = fs.readFileSync(MIRROR_PATH, 'utf8');
    return JSON.parse(content || '{"tasks":[], "quotes":[]}');
  } catch (e) {
    return { tasks: [], quotes: [] };
  }
};

const writeMirror = (data: any) => {
  fs.writeFileSync(MIRROR_PATH, JSON.stringify(data, null, 2));
};

export async function POST(req: Request) {
  try {
    const { text, author, taskId, taskTitle } = await req.json();
    
    if (!text) return NextResponse.json({ error: 'Wisdom empty' }, { status: 400 });

    const data = readMirror();
    if (!data.quotes) data.quotes = [];

    // Contextual Alchemist Logic: If there's a task, "weave" the quote into it
    let finalWisdom = text;
    if (taskTitle) {
      const templates = [
        `Target: ${taskTitle}. Wisdom: ${text}`,
        `Fueling "${taskTitle}" with: ${text}`,
        `Mastery over ${taskTitle} requires: ${text}`
      ];
      finalWisdom = templates[Math.floor(Math.random() * templates.length)];
    }

    const newQuote = {
      id: `quote-${Date.now()}`,
      text: finalWisdom,
      originalText: text,
      author: author || 'Guardian',
      taskId: taskId || null,
      createdAt: new Date().toISOString()
    };

    data.quotes.push(newQuote);
    writeMirror(data);

    return NextResponse.json(newQuote);
  } catch (error) {
    return NextResponse.json({ error: 'Wisdom persistence failure' }, { status: 500 });
  }
}

export async function GET() {
  const data = readMirror();
  return NextResponse.json(data.quotes || []);
}

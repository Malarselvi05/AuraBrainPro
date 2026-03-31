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
    const { story, taskId, taskTitle } = await req.json();
    
    if (!story) return NextResponse.json({ error: 'Story empty' }, { status: 400 });

    const data = readMirror();
    if (!data.stories) data.stories = [];

    const newStory = {
      id: `story-${Date.now()}`,
      content: story,
      taskId: taskId || null,
      taskTitle: taskTitle || null,
      createdAt: new Date().toISOString()
    };

    data.stories.push(newStory);
    writeMirror(data);

    return NextResponse.json(newStory);
  } catch (error) {
    return NextResponse.json({ error: 'Story persistence failure' }, { status: 500 });
  }
}

export async function GET() {
  const data = readMirror();
  return NextResponse.json(data.stories || []);
}

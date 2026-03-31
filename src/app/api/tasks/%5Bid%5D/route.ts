import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIRROR_PATH = path.join(process.cwd(), 'database', 'mirror.json');

function readMirror() {
  try {
    if (!fs.existsSync(MIRROR_PATH)) return { tasks: [], quotes: [], notes: [] };
    return JSON.parse(fs.readFileSync(MIRROR_PATH, 'utf-8'));
  } catch (e) { return { tasks: [], quotes: [], notes: [] }; }
}

function writeMirror(data: any) {
  try {
    fs.writeFileSync(MIRROR_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (e) { return false; }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = readMirror();

    // HYBRID SEARCH: Try finding by ID first, then by Title if ID fails (Bridges old/new tasks)
    let taskIndex = data.tasks.findIndex((t: any) => t.id === id);
    
    if (taskIndex === -1 && body.title) {
        taskIndex = data.tasks.findIndex((t: any) => t.title.toLowerCase() === body.title.toLowerCase());
    }

    if (taskIndex === -1) {
      // Fallback: If still not found, let's create a stub so work is NOT lost
      const stubTask = {
        id: id || `task-${Date.now()}`,
        title: body.title || 'Untitled Mission',
        description: body.description || '',
        status: body.status || 'todo',
        resources: body.resources || '[]',
        timeSpentSeconds: body.timeSpentSeconds || 0,
        createdAt: new Date().toISOString(),
        completedAt: body.status === 'completed' ? new Date().toISOString() : null
      };
      data.tasks.push(stubTask);
      taskIndex = data.tasks.length - 1;
    } else {
        // Update existing with hybrid merge
        data.tasks[taskIndex] = {
          ...data.tasks[taskIndex],
          ...body,
          completedAt: body.status === 'completed' ? new Date().toISOString() : data.tasks[taskIndex].completedAt
        };
    }

    writeMirror(data);
    return NextResponse.json(data.tasks[taskIndex]);
  } catch (error: any) {
    console.error("Mirror Patch Error:", error);
    return NextResponse.json({ error: `Mirror Logic Issue: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = readMirror();
    data.tasks = data.tasks.filter((t: any) => t.id !== id);
    writeMirror(data);
    return NextResponse.json({ message: 'Mission Erased' });
  } catch (error) {
    return NextResponse.json({ error: 'Erase Command Failed' }, { status: 500 });
  }
}

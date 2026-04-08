import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIRROR_PATH = path.join(process.cwd(), 'database', 'mirror.json');

function readMirror() {
  try {
    if (!fs.existsSync(MIRROR_PATH)) {
      const initial = { 
        tasks: [], 
        archivedTasks: [], 
        quotes: [], 
        stories: [],
        notes: [],
        auraPoints: 0,
        totalStars: 0,
        settings: { // AI Agent Hub v12.0
            aiApiKey: "",
            geminiApiKey: "",
            preferredModel: "gemini",
            agentEnabled: false
        },
        stats: {
          identityStatement: "I am a person who focuses daily, no matter what.",
          dailyFocusLogs: {}
        }
      };
      fs.writeFileSync(MIRROR_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = JSON.parse(fs.readFileSync(MIRROR_PATH, 'utf-8'));
    if (!data.settings) data.settings = { aiApiKey: "", preferredModel: "gemini-1.5-pro", agentEnabled: false };
    if (!data.stats) data.stats = { identityStatement: "I am a person who focuses daily, no matter what.", dailyFocusLogs: {} };
    return data;
  } catch (e) { return { tasks: [], quotes: [], settings: { aiApiKey: "", preferredModel: "gemini-1.5-pro", agentEnabled: false } }; }
}

function writeMirror(data: any) {
  try {
    fs.writeFileSync(MIRROR_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (e) { return false; }
}

export async function GET() {
  try {
    const data = readMirror();
    const tasks = data.tasks || [];
    const stories = data.stories || [];
    const quotes = data.quotes || [];

    // HYDRATION: Link each task with its synthesized story
    const hydratedTasks = tasks.map((task: any) => {
      const story = stories.find((s: any) => s.id === task.storyId);
      return { ...task, story: story || null };
    });

    const activeTasks = hydratedTasks.filter((t: any) => !t.archived);
    const archivedTasks = hydratedTasks.filter((t: any) => t.archived);

    const sortedTasks = activeTasks.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ 
      tasks: sortedTasks, 
      archivedTasks: archivedTasks,
      quotes: quotes,
      settings: data.settings,
      stats: data.stats,
      auraPoints: data.auraPoints || 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Registry Recovery Active' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, storyId, resources, id, timeSpentSeconds, isSyncOnly, subtasks, focusSessionSeconds, stats, auraPoints: bodyAuraPoints, archived } = body;
    const data = readMirror();
    if (!data.stats) data.stats = { identityStatement: "I am a person who focuses daily, no matter what.", dailyFocusLogs: {} };

    // SOLID-PATH SYNC: If this is an effort update (from Focus Hub)
    if (isSyncOnly && id) {
        let taskIndex = data.tasks.findIndex((t: any) => t.id === id);
        if (taskIndex === -1 && title) {
            taskIndex = data.tasks.findIndex((t: any) => t.title.toLowerCase() === title.toLowerCase());
        }

        if (taskIndex !== -1) {
            if (timeSpentSeconds !== undefined) data.tasks[taskIndex].timeSpentSeconds = timeSpentSeconds;
            if (body.status) data.tasks[taskIndex].status = body.status;
            if (subtasks) data.tasks[taskIndex].subtasks = subtasks; 
            if (bodyAuraPoints !== undefined) data.auraPoints = bodyAuraPoints;
            if (archived !== undefined) data.tasks[taskIndex].archived = archived;
            
            if (focusSessionSeconds) {
                const today = new Date().toISOString().split('T')[0];
                if (!data.stats.dailyFocusLogs[today]) data.stats.dailyFocusLogs[today] = 0;
                data.stats.dailyFocusLogs[today] += focusSessionSeconds;
            }

            writeMirror(data);
            return NextResponse.json({ ...data.tasks[taskIndex], auraPoints: data.auraPoints });
        }
    }

    if (isSyncOnly && stats) {
        data.stats = { ...data.stats, ...stats };
        writeMirror(data);
        return NextResponse.json(data.stats);
    }

    // SETTINGS ONLY PATH: Secure AI Agent Settings (v12.1)
    if (isSyncOnly && body.settings) {
        data.settings = body.settings;
        writeMirror(data);
        return NextResponse.json(data.settings);
    }

    // Standard POST: New Mission creation
    const newTask = {
      id: `task-${Date.now()}`,
      title: title || 'Untitled Mission',
      description: description || '',
      status: 'todo',
      storyId: storyId || null,
      resources: resources || '[]',
      subtasks: [], // Chrono-Vault: Initialize sub-node tree
      timeSpentSeconds: 0,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    data.tasks.push(newTask);
    writeMirror(data);

    return NextResponse.json(newTask);
  } catch (error: any) {
    return NextResponse.json({ error: 'Registry Failure' }, { status: 500 });
  }
}

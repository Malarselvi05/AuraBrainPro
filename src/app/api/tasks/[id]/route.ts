import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIRROR_PATH = path.join(process.cwd(), 'database', 'mirror.json');

const readMirror = () => {
    try {
        if (!fs.existsSync(MIRROR_PATH)) return { tasks: [], quotes: [], stories: [] };
        return JSON.parse(fs.readFileSync(MIRROR_PATH, 'utf-8'));
    } catch (e) { return { tasks: [], quotes: [], stories: [] }; }
};

const writeMirror = (data: any) => {
    fs.writeFileSync(MIRROR_PATH, JSON.stringify(data, null, 2));
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<any> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const data = readMirror();
        const taskIndex = data.tasks.findIndex((t: any) => t.id === id);

        if (taskIndex !== -1) {
            // Update only the provided fields (like storyId or status)
            data.tasks[taskIndex] = { 
                ...data.tasks[taskIndex], 
                ...body,
                updatedAt: new Date().toISOString()
            };
            
            writeMirror(data);
            return NextResponse.json(data.tasks[taskIndex]);
        }
        
        return NextResponse.json({ error: 'Mission Node not found' }, { status: 404 });
    } catch (e) {
        return NextResponse.json({ error: 'Registry Synchronization Failure' }, { status: 500 });
    }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<any> }) {
    const { id } = await params;
    try {
        const data = readMirror();
        const taskIndex = data.tasks.findIndex((t: any) => t.id === id);

        if (taskIndex !== -1) {
            const deleted = data.tasks.splice(taskIndex, 1);
            writeMirror(data);
            return NextResponse.json({ success: true, deleted: deleted[0] });
        }
        
        return NextResponse.json({ error: 'Mission Node not found' }, { status: 404 });
    } catch (e) {
        return NextResponse.json({ error: 'Registry Synchronization Failure' }, { status: 500 });
    }
}

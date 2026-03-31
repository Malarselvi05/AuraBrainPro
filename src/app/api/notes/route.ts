import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2 // Deterministic: last 2 notes for context
    });
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    const note = await prisma.note.create({
      data: {
        content,
        createdAt: new Date(),
      }
    });
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

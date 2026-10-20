import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp-client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') as any) || 'all';

    const { tasks, count, trace } = await mcpClient.getTasks(status);

    return NextResponse.json({
      tasks,
      count,
      trace,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch tasks', details: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, title, priority, due } = body;

    if (action === 'complete') {
      const { result, isError, trace } = await mcpClient.callTool('complete_task', { id, title });
      return NextResponse.json({ result, isError, trace });
    }

    if (action === 'create') {
      const { result, isError, trace } = await mcpClient.callTool('create_task', { title, priority, due });
      return NextResponse.json({ result, isError, trace });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to execute task action', details: err.message }, { status: 500 });
  }
}

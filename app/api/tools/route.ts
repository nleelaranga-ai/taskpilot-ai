import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp-client';

export async function GET() {
  try {
    const { tools, trace } = await mcpClient.listTools();
    return NextResponse.json({
      tools,
      count: tools.length,
      trace,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to discover tools', details: err.message }, { status: 500 });
  }
}

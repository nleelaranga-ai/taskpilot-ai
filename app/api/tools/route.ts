import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { tools, trace } = await mcpClient.listTools();
    if (!trace.ok) {
      const error = trace.response.error;
      const details =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'MCP tools/list request failed.';
      return NextResponse.json(
        { error: 'Failed to discover tools', details, trace },
        { status: 502 }
      );
    }

    return NextResponse.json({
      tools,
      count: tools.length,
      trace,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: 'Failed to discover tools',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp-client';

export async function GET() {
  try {
    const { serverInfo, protocolVersion, trace: initTrace } = await mcpClient.initialize();
    const { tools, trace: listTrace } = await mcpClient.listTools();

    return NextResponse.json({
      protocolVersion,
      transport: 'Streamable HTTP (JSON-RPC 2.0)',
      serverInfo,
      discoveredTools: tools.map((t) => t.name),
      traces: [initTrace, listTrace],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch trace status', details: err.message },
      { status: 500 }
    );
  }
}

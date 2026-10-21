import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp-client';

export const dynamic = 'force-dynamic';

const MCP_PORT = process.env.MCP_PORT || '3333';
const MCP_HOST = process.env.MCP_HOST || '127.0.0.1';

export async function GET() {
  try {
    const mcpUrlStr = process.env.TASKPILOT_MCP_URL || process.env.MCP_SERVER_URL || `http://${MCP_HOST}:${MCP_PORT}/mcp`;
    let healthUrl: string;
    try {
      const url = new URL(mcpUrlStr);
      url.pathname = '/health';
      healthUrl = url.toString();
    } catch {
      healthUrl = `http://${MCP_HOST}:${MCP_PORT}/health`;
    }

    const res = await fetch(healthUrl, { method: 'GET' });
    const mcpHealth = await res.json();

    const { serverInfo, protocolVersion, trace } = await mcpClient.initialize();

    return NextResponse.json({
      status: 'ok',
      web: { status: 'healthy', app: 'TaskPilot AI' },
      mcp: {
        status: mcpHealth.status,
        serverInfo,
        protocolVersion,
      },
      trace,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        web: { status: 'healthy' },
        mcp: { status: 'unreachable', error: err.message },
      },
      { status: 503 }
    );
  }
}

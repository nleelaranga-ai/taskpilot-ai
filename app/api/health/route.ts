import { NextResponse } from 'next/server';
import { getMcpServerUrl, mcpClient } from '@/lib/mcp-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = new URL(getMcpServerUrl());
    url.pathname = '/health';
    const healthUrl = url.toString();
    const res = await fetch(healthUrl, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`MCP health endpoint returned HTTP ${res.status}. Check TASKPILOT_MCP_URL.`);
    }

    if (!res.headers.get('content-type')?.includes('application/json')) {
      throw new Error('MCP health endpoint did not return JSON. Check that TASKPILOT_MCP_URL points to the MCP service.');
    }

    const mcpHealth = await res.json();
    if (mcpHealth.status !== 'ok') {
      throw new Error('MCP health endpoint reported an unhealthy server.');
    }

    const { serverInfo, protocolVersion, trace } = await mcpClient.initialize();
    if (!trace.ok) {
      const error = trace.response.error;
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'MCP initialization failed.';
      throw new Error(message);
    }

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
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: 'degraded',
        web: { status: 'healthy' },
        mcp: {
          status: 'unreachable',
          error: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 503 }
    );
  }
}

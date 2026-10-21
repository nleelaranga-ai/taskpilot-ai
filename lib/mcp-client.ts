import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { McpToolSchema, Task, TraceItem } from './types';

const DEFAULT_MCP_SERVER_URL = 'http://127.0.0.1:3333/mcp';
const PROTOCOL_VERSION = '2025-11-25';

let rpcCounter = 1;

export function normalizeMcpServerUrl(value: string): string {
  const trimmedValue = value.trim();
  const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('MCP server URL must use HTTP or HTTPS.');
  }

  if (url.pathname === '/') {
    url.pathname = '/mcp';
  }

  return url.toString();
}

export function getMcpServerUrl(): string {
  const configuredUrl = process.env.TASKPILOT_MCP_URL || process.env.MCP_SERVER_URL;
  const isHosted = Boolean(process.env.VERCEL || process.env.RENDER);

  if (!configuredUrl && isHosted) {
    throw new Error('Set TASKPILOT_MCP_URL to the MCP service URL ending in /mcp for hosted deployments.');
  }

  const serverUrl = normalizeMcpServerUrl(configuredUrl || DEFAULT_MCP_SERVER_URL);
  const hostedAppName = process.env.VERCEL_URL || process.env.RENDER_EXTERNAL_HOSTNAME;
  if (hostedAppName) {
    const appHost = new URL(`https://${hostedAppName}`).hostname;
    if (new URL(serverUrl).hostname === appHost) {
      throw new Error('TASKPILOT_MCP_URL points to the web app. Set it to the separate MCP service URL ending in /mcp.');
    }
  }

  return serverUrl;
}

export function getMcpErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/<(?:!doctype html|html)\b/i.test(message) && /\b405\b|method not allowed/i.test(message)) {
    return 'The MCP endpoint returned a Next.js 405 HTML page. TASKPILOT_MCP_URL must point to the MCP server, not the web app, and end in /mcp.';
  }

  return message;
}

export class TaskPilotMcpClient {
  private serverUrl?: string;

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl ? normalizeMcpServerUrl(serverUrl) : undefined;
  }

  /**
   * Helper to create a connected Client with StreamableHTTPClientTransport
   */
  private async createConnectedClient(): Promise<{
    client: Client;
    transport: StreamableHTTPClientTransport;
  }> {
    const origin = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const transport = new StreamableHTTPClientTransport(new URL(this.serverUrl || getMcpServerUrl()), {
      requestInit: {
        headers: {
          'Origin': origin,
        },
      },
    });

    const client = new Client(
      {
        name: 'taskpilot-web-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    return { client, transport };
  }

  /**
   * Performs initialize negotiation using official StreamableHTTPClientTransport
   */
  async initialize(): Promise<{
    serverInfo: any;
    protocolVersion: string;
    trace: TraceItem;
  }> {
    const id = rpcCounter++;
    const startTime = Date.now();
    let serverInfo: any = {};
    let ok = false;
    let responseData: any = null;

    try {
      const { client, transport } = await this.createConnectedClient();
      serverInfo = client.getServerVersion() || { name: 'taskpilot-mcp-server', version: '1.0.0' };
      ok = true;
      responseData = {
        protocolVersion: PROTOCOL_VERSION,
        serverInfo,
        capabilities: client.getServerCapabilities(),
      };
      await transport.close();
    } catch (err: unknown) {
      responseData = { error: { message: getMcpErrorMessage(err) } };
      ok = false;
    }

    const elapsedMs = Date.now() - startTime;
    const trace: TraceItem = {
      id: `trace-${Date.now()}-${id}`,
      step: 'initialize',
      method: 'initialize',
      request: {
        protocolVersion: PROTOCOL_VERSION,
        clientInfo: { name: 'taskpilot-web-client', version: '1.0.0' },
      },
      response: responseData,
      ms: elapsedMs,
      ok,
      timestamp: new Date().toISOString(),
      protocolVersion: PROTOCOL_VERSION,
    };

    return { serverInfo, protocolVersion: PROTOCOL_VERSION, trace };
  }

  /**
   * Discovers tools from the MCP server at runtime via tools/list
   */
  async listTools(): Promise<{
    tools: McpToolSchema[];
    trace: TraceItem;
  }> {
    const id = rpcCounter++;
    const startTime = Date.now();
    let tools: McpToolSchema[] = [];
    let ok = false;
    let responseData: any = null;

    try {
      const { client, transport } = await this.createConnectedClient();
      const listResult = await client.listTools();
      tools = (listResult.tools as any) || [];
      ok = true;
      responseData = { tools, count: tools.length };
      await transport.close();
    } catch (err: unknown) {
      responseData = { error: { message: getMcpErrorMessage(err) } };
      ok = false;
    }

    const elapsedMs = Date.now() - startTime;
    const trace: TraceItem = {
      id: `trace-${Date.now()}-${id}`,
      step: 'tools/list',
      method: 'tools/list',
      request: {},
      response: responseData,
      ms: elapsedMs,
      ok,
      timestamp: new Date().toISOString(),
      protocolVersion: PROTOCOL_VERSION,
    };

    return { tools, trace };
  }

  /**
   * Executes a tool call on the MCP server via StreamableHTTPClientTransport
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<{
    result: any;
    isError: boolean;
    trace: TraceItem;
  }> {
    const id = rpcCounter++;
    const startTime = Date.now();
    let resultPayload: any = null;
    let isError = false;
    let ok = false;

    try {
      const { client, transport } = await this.createConnectedClient();
      const callResult: any = await client.callTool({
        name,
        arguments: args,
      });

      isError = Boolean(callResult.isError);
      ok = !isError;

      if (callResult.structuredContent) {
        resultPayload = callResult.structuredContent;
      } else if (callResult.content?.[0]?.text) {
        try {
          resultPayload = JSON.parse(callResult.content[0].text);
        } catch {
          resultPayload = callResult.content[0].text;
        }
      } else {
        resultPayload = callResult;
      }

      await transport.close();
    } catch (err: unknown) {
      resultPayload = { isError: true, message: getMcpErrorMessage(err) };
      isError = true;
      ok = false;
    }

    const elapsedMs = Date.now() - startTime;
    const trace: TraceItem = {
      id: `trace-${Date.now()}-${id}`,
      step: `tools/call:${name}`,
      method: 'tools/call',
      request: { name, arguments: args },
      response: resultPayload,
      ms: elapsedMs,
      ok,
      timestamp: new Date().toISOString(),
      protocolVersion: PROTOCOL_VERSION,
    };

    return { result: resultPayload, isError, trace };
  }

  /**
   * Helper to fetch current tasks via MCP list_tasks tool
   */
  async getTasks(status: 'open' | 'done' | 'all' = 'all'): Promise<{
    tasks: Task[];
    count: number;
    trace: TraceItem;
  }> {
    const { result, trace } = await this.callTool('list_tasks', { status });
    const tasks: Task[] = result?.tasks || [];
    const count: number = result?.count ?? tasks.length;
    return { tasks, count, trace };
  }
}

export const mcpClient = new TaskPilotMcpClient();

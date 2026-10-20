import { McpToolSchema, Task, TraceItem } from './types';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3333/mcp';
const PROTOCOL_VERSION = '2025-11-25';

let rpcCounter = 1;

export class TaskPilotMcpClient {
  private serverUrl: string;

  constructor(serverUrl: string = MCP_SERVER_URL) {
    this.serverUrl = serverUrl;
  }

  /**
   * Sends a low-level JSON-RPC 2.0 POST request over Streamable HTTP.
   */
  async sendJsonRpc(method: string, params: Record<string, unknown> = {}, stepName?: string): Promise<{
    data: any;
    trace: TraceItem;
  }> {
    const id = rpcCounter++;
    const requestPayload = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    const startTime = Date.now();
    let responseData: any = null;
    let ok = false;

    try {
      const res = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Origin': 'http://localhost:3000',
        },
        body: JSON.stringify(requestPayload),
      });

      const text = await res.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = { rawText: text };
      }

      ok = res.ok && !responseData.error;
    } catch (err: any) {
      responseData = {
        error: {
          code: -32000,
          message: err.message || 'Connection to MCP server failed',
        },
      };
      ok = false;
    }

    const elapsedMs = Date.now() - startTime;

    const trace: TraceItem = {
      id: `trace-${Date.now()}-${id}`,
      step: stepName || method,
      method,
      request: requestPayload,
      response: responseData,
      ms: elapsedMs,
      ok,
      timestamp: new Date().toISOString(),
      protocolVersion: PROTOCOL_VERSION,
    };

    return { data: responseData, trace };
  }

  /**
   * Initializes session and protocol negotiation (spec 2025-11-25)
   */
  async initialize(): Promise<{
    serverInfo: any;
    protocolVersion: string;
    trace: TraceItem;
  }> {
    const { data, trace } = await this.sendJsonRpc('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: 'taskpilot-web-client',
        version: '1.0.0',
      },
    }, 'initialize');

    return {
      serverInfo: data?.result?.serverInfo || {},
      protocolVersion: data?.result?.protocolVersion || PROTOCOL_VERSION,
      trace,
    };
  }

  /**
   * Discovers tools from the MCP server at runtime
   */
  async listTools(): Promise<{
    tools: McpToolSchema[];
    trace: TraceItem;
  }> {
    const { data, trace } = await this.sendJsonRpc('tools/list', {}, 'tools/list');
    const tools: McpToolSchema[] = data?.result?.tools || [];
    return { tools, trace };
  }

  /**
   * Executes a tool call on the MCP server
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<{
    result: any;
    isError: boolean;
    trace: TraceItem;
  }> {
    const { data, trace } = await this.sendJsonRpc('tools/call', {
      name,
      arguments: args,
    }, `tools/call:${name}`);

    const result = data?.result;
    const isError = Boolean(result?.isError || data?.error);

    let parsedContent: any = null;
    if (result?.structuredContent) {
      parsedContent = result.structuredContent;
    } else if (result?.content?.[0]?.text) {
      try {
        parsedContent = JSON.parse(result.content[0].text);
      } catch {
        parsedContent = result.content[0].text;
      }
    }

    return {
      result: parsedContent || result,
      isError,
      trace,
    };
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

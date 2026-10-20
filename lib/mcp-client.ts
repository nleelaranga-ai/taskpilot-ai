import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
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
   * Helper to create a connected Client with StreamableHTTPClientTransport
   */
  private async createConnectedClient(): Promise<{
    client: Client;
    transport: StreamableHTTPClientTransport;
  }> {
    const transport = new StreamableHTTPClientTransport(new URL(this.serverUrl), {
      requestInit: {
        headers: {
          'Origin': 'http://localhost:3000',
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
    } catch (err: any) {
      responseData = { error: { message: err.message } };
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
    } catch (err: any) {
      responseData = { error: { message: err.message } };
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
    } catch (err: any) {
      resultPayload = { isError: true, message: err.message };
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

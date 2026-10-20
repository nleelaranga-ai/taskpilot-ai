import http from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { listTasks, createTask, completeTask } from './db.mjs';

const PORT = parseInt(process.env.MCP_PORT || '3333', 10);
const HOST = process.env.MCP_HOST || '127.0.0.1';

// Allowed origins for DNS rebinding & drive-by browser protection
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3333',
  'http://127.0.0.1:3333',
]);

/**
 * Creates and configures a fresh McpServer instance with TaskPilot tools.
 */
export function createServerInstance() {
  const server = new McpServer({
    name: 'taskpilot-mcp-server',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
  });

  // 1. list_tasks tool (read-only)
  server.registerTool('list_tasks', {
    title: 'List Tasks',
    description: 'List tasks from the SQLite database filtered by status (open, done, all).',
    inputSchema: z.object({
      status: z.enum(['open', 'done', 'all']).default('open').describe('Filter tasks by status: open, done, or all'),
    }),
    outputSchema: z.object({
      tasks: z.array(z.any()),
      count: z.number(),
    }),
    annotations: {
      readOnlyHint: true,
    },
  }, async (args) => {
    const status = args?.status || 'open';
    const result = listTasks(status);
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result,
    };
  });

  // 2. create_task tool (non-idempotent)
  server.registerTool('create_task', {
    title: 'Create Task',
    description: 'Create a new task in the database with title, priority (low, medium, high), and optional due date (YYYY-MM-DD).',
    inputSchema: z.object({
      title: z.string().min(1, 'Title cannot be empty').max(200, 'Title cannot exceed 200 characters').describe('Task title'),
      priority: z.enum(['low', 'medium', 'high']).default('medium').describe('Task priority level (low, medium, high)'),
      due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD format').optional().nullable().describe('Optional due date in YYYY-MM-DD format'),
    }),
    outputSchema: z.object({
      task: z.any(),
    }),
    annotations: {
      idempotentHint: false,
    },
  }, async (args) => {
    const result = createTask({
      title: args.title,
      priority: args.priority || 'medium',
      due: args.due || null,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result,
    };
  });

  // 3. complete_task tool (idempotent hint, domain disambiguation)
  server.registerTool('complete_task', {
    title: 'Complete Task',
    description: 'Mark a task as completed by task ID or title substring.',
    inputSchema: z.object({
      id: z.number().int().positive().optional().nullable().describe('Task ID to mark completed'),
      title: z.string().min(1).optional().nullable().describe('Title or substring of task to complete'),
    }),
    outputSchema: z.object({
      task: z.any().optional(),
      isError: z.boolean().optional(),
      alreadyDone: z.boolean().optional(),
      ambiguous: z.boolean().optional(),
      candidates: z.array(z.any()).optional(),
      message: z.string().optional(),
    }),
    annotations: {
      idempotentHint: true,
    },
  }, async (args) => {
    const result = completeTask({
      id: args.id,
      title: args.title,
    });
    return {
      isError: result.isError === true,
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result,
    };
  });

  return server;
}

/**
 * Validates request Origin header to protect against DNS rebinding.
 */
function isOriginAllowed(origin) {
  if (!origin) return true; // Server-to-server or curl requests
  return ALLOWED_ORIGINS.has(origin);
}

const httpServer = http.createServer(async (req, res) => {
  const origin = req.headers['origin'];
  if (origin && !isOriginAllowed(origin)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Origin not allowed' }));
    return;
  }

  // Common CORS headers for allowed origins
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, Accept');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  // Health endpoint
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      server: 'taskpilot-mcp-server',
      version: '1.0.0',
      protocolVersion: '2025-11-25',
      uptime: process.uptime(),
    }));
    return;
  }

  // Rejection of GET on /mcp as specified in Section 4.1
  if (url.pathname === '/mcp') {
    if (req.method === 'GET') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Method Not Allowed',
        message: 'GET /mcp is not allowed. Use POST /mcp for Streamable HTTP JSON-RPC calls.',
      }));
      return;
    }

    if (req.method === 'POST') {
      // Read body
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const rawBody = Buffer.concat(chunks).toString('utf-8');
          let parsedBody = null;
          if (rawBody.trim().length > 0) {
            parsedBody = JSON.parse(rawBody);
          }

          // Stateless mode: fresh server and transport per POST request
          const server = createServerInstance();
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true,
          });

          await server.connect(transport);
          await transport.handleRequest(req, res, parsedBody);
        } catch (err) {
          console.error('[MCP Server Error]', err);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32603, message: 'Internal server error', data: err.message },
              id: null,
            }));
          }
        }
      });
      return;
    }
  }

  // Not found for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Start listening if run directly
if (process.argv[1] && process.argv[1].endsWith('server.mjs')) {
  httpServer.listen(PORT, HOST, () => {
    console.log(`[TaskPilot MCP Server] Listening on http://${HOST}:${PORT}`);
    console.log(`[TaskPilot MCP Server] Protocol version: 2025-11-25 (Streamable HTTP)`);
    console.log(`[TaskPilot MCP Server] Endpoints: POST /mcp (stateless), GET /health`);
  });
}

export { httpServer, PORT, HOST };

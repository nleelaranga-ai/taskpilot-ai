import { spawn } from "node:child_process";

// 1. Next.js gets Render's assigned $PORT (or 3000 locally)
// 2. The internal MCP server is pinned to 127.0.0.1:3333 so ports never collide
const mcpPort = "3333";
const mcpHost = "127.0.0.1";
const webPort = process.env.PORT || "3000";

console.log(`[TaskPilot Unified Runner] Booting Streamable HTTP MCP server on ${mcpHost}:${mcpPort}...`);
const mcp = spawn(process.execPath, ["mcp-server/server.mjs"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: mcpPort,
    MCP_PORT: mcpPort,
    MCP_HOST: mcpHost,
  },
});

console.log(`[TaskPilot Unified Runner] Booting Next.js Web Frontend on port ${webPort}...`);
const web = spawn("npx", ["next", "start", "-p", webPort], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    PORT: webPort,
    TASKPILOT_MCP_URL: process.env.TASKPILOT_MCP_URL || `http://${mcpHost}:${mcpPort}/mcp`,
  },
});

const stop = (code) => {
  console.log(`[TaskPilot Unified Runner] Shutting down services (code: ${code})...`);
  try { mcp.kill(); } catch {}
  try { web.kill(); } catch {}
  process.exit(code ?? 0);
};

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
mcp.on("exit", (code) => {
  console.log(`[TaskPilot Unified Runner] MCP server exited (${code})`);
  stop(code);
});
web.on("exit", (code) => {
  console.log(`[TaskPilot Unified Runner] Next.js exited (${code})`);
  stop(code);
});

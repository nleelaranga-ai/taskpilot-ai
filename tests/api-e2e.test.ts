import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { httpServer, PORT, HOST } from '../mcp-server/server.mjs';
import { closeDb, getDb } from '../mcp-server/db.mjs';
import { getMcpErrorMessage, getMcpServerUrl, mcpClient, normalizeMcpServerUrl } from '../lib/mcp-client';

const TEST_DB = path.join(process.cwd(), 'data', 'test-api-e2e.db');
process.env.TASKPILOT_DB = TEST_DB;

if (fs.existsSync(TEST_DB)) {
  fs.unlinkSync(TEST_DB);
}

async function runApiE2eTests() {
  console.log('🧪 [API & Transport Test Suite] Testing StreamableHTTPClientTransport Integration...');

  assert.strictEqual(
    normalizeMcpServerUrl('taskpilot-mcp-server.onrender.com'),
    'https://taskpilot-mcp-server.onrender.com/mcp'
  );
  assert.strictEqual(
    normalizeMcpServerUrl('http://127.0.0.1:3334/mcp'),
    'http://127.0.0.1:3334/mcp'
  );
  assert.match(
    getMcpErrorMessage(new Error('Streamable HTTP error: 405 Method Not Allowed <!DOCTYPE html><html></html>')),
    /TASKPILOT_MCP_URL must point to the MCP server/
  );
  const savedEnvironment = {
    TASKPILOT_MCP_URL: process.env.TASKPILOT_MCP_URL,
    MCP_SERVER_URL: process.env.MCP_SERVER_URL,
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL,
    RENDER: process.env.RENDER,
    RENDER_EXTERNAL_HOSTNAME: process.env.RENDER_EXTERNAL_HOSTNAME,
  };
  try {
    process.env.TASKPILOT_MCP_URL = 'https://taskpilot-web.vercel.app/mcp';
    process.env.VERCEL = '1';
    process.env.VERCEL_URL = 'taskpilot-web.vercel.app';
    assert.throws(getMcpServerUrl, /points to the web app/);
    delete process.env.TASKPILOT_MCP_URL;
    delete process.env.MCP_SERVER_URL;
    assert.throws(getMcpServerUrl, /Set TASKPILOT_MCP_URL/);
  } finally {
    for (const [key, value] of Object.entries(savedEnvironment)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
  console.log('✅ 0. MCP endpoint URLs and frontend-405 diagnostics are normalized');

  await new Promise((resolve) => httpServer.listen(PORT, HOST, resolve));

  try {
    // 1. Initialize via StreamableHTTPClientTransport
    const { serverInfo, protocolVersion, trace: initTrace } = await mcpClient.initialize();
    assert.strictEqual(protocolVersion, '2025-11-25');
    assert.strictEqual(initTrace.ok, true);
    assert.strictEqual(initTrace.step, 'initialize');
    console.log('✅ 1. StreamableHTTPClientTransport successfully initialized protocol 2025-11-25');

    // 2. Discover tools via StreamableHTTPClientTransport
    const { tools, trace: listTrace } = await mcpClient.listTools();
    assert.strictEqual(tools.length, 3);
    assert.strictEqual(listTrace.ok, true);
    const toolNames = tools.map((t) => t.name).sort();
    assert.deepStrictEqual(toolNames, ['complete_task', 'create_task', 'list_tasks']);
    console.log('✅ 2. StreamableHTTPClientTransport discovered 3 MCP tools');

    // 3. Create task via StreamableHTTPClientTransport
    const { result: createResult, isError: createErr, trace: createTrace } = await mcpClient.callTool(
      'create_task',
      {
        title: 'Review video submission checklist',
        priority: 'high',
        due: '2026-10-23',
      }
    );
    assert.strictEqual(createErr, false);
    assert.strictEqual(createTrace.ok, true);
    assert.strictEqual(createResult.task.title, 'Review video submission checklist');
    const createdId = createResult.task.id;
    console.log(`✅ 3. StreamableHTTPClientTransport executed create_task (ID #${createdId})`);

    // 4. Query tasks via getTasks helper
    const { tasks, count, trace: getTrace } = await mcpClient.getTasks('all');
    assert.strictEqual(getTrace.ok, true);
    assert.strictEqual(count >= 1, true);
    const found = tasks.find((t) => t.id === createdId);
    assert.ok(found);
    assert.strictEqual(found.status, 'open');
    console.log('✅ 4. getTasks verified task presence in active task list');

    // 5. Complete task via StreamableHTTPClientTransport
    const { result: completeResult, isError: completeErr, trace: completeTrace } = await mcpClient.callTool(
      'complete_task',
      { id: createdId }
    );
    assert.strictEqual(completeErr, false);
    assert.strictEqual(completeTrace.ok, true);
    assert.strictEqual(completeResult.task.status, 'done');
    console.log('✅ 5. StreamableHTTPClientTransport completed task successfully');

    console.log('\n🎉 ALL StreamableHTTPClientTransport TESTS PASSED CLEANLY!\n');
  } finally {
    await new Promise((resolve) => httpServer.close(resolve));
    closeDb();
    if (fs.existsSync(TEST_DB)) {
      try { fs.unlinkSync(TEST_DB); } catch {}
    }
  }
}

runApiE2eTests().catch((err) => {
  console.error('❌ API E2E Test failed:', err);
  process.exit(1);
});

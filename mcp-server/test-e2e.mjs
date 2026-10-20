import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { httpServer, PORT, HOST } from './server.mjs';
import { clearTasks, getDb, closeDb } from './db.mjs';

const TEST_DB = path.join(process.cwd(), 'data', 'test-taskpilot.db');
process.env.TASKPILOT_DB = TEST_DB;

// Ensure test DB directory exists and clean test file
if (fs.existsSync(TEST_DB)) {
  fs.unlinkSync(TEST_DB);
}

const SERVER_URL = `http://${HOST}:${PORT}`;

async function sendJsonRpc(method, params = {}, id = 1) {
  const payload = {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };

  const res = await fetch(`${SERVER_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, rawText: text };
  }
}

async function runTests() {
  console.log('🧪 [MCP Test Suite] Starting MCP Server End-to-End Tests...');

  // Start HTTP server for tests
  await new Promise((resolve) => httpServer.listen(PORT, HOST, resolve));
  console.log(`✅ [MCP Test Suite] Server listening at ${SERVER_URL}`);

  try {
    // Test 1: GET /health returns 200 and protocol 2025-11-25
    {
      const res = await fetch(`${SERVER_URL}/health`);
      assert.strictEqual(res.status, 200, 'Health endpoint must return 200');
      const health = await res.json();
      assert.strictEqual(health.status, 'ok');
      assert.strictEqual(health.protocolVersion, '2025-11-25');
      console.log('✅ Test 1 Passed: GET /health returns 200 with protocolVersion 2025-11-25');
    }

    // Test 2: GET /mcp returns 405 Method Not Allowed
    {
      const res = await fetch(`${SERVER_URL}/mcp`);
      assert.strictEqual(res.status, 405, 'GET /mcp must return 405');
      console.log('✅ Test 2 Passed: GET /mcp returns 405 Method Not Allowed');
    }

    // Test 3: Disallowed Origin returns 403 Forbidden
    {
      const res = await fetch(`${SERVER_URL}/mcp`, {
        method: 'POST',
        headers: {
          'Origin': 'http://malicious-site.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
      });
      assert.strictEqual(res.status, 403, 'Unknown origin should return 403');
      console.log('✅ Test 3 Passed: DNS rebinding protection rejects unauthorized origins');
    }

    // Test 4: MCP initialize negotiates protocol 2025-11-25
    {
      const res = await sendJsonRpc('initialize', {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      }, 1);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.jsonrpc, '2.0');
      assert.strictEqual(res.data.result?.protocolVersion, '2025-11-25', 'Should negotiate 2025-11-25 protocol');
      assert.strictEqual(res.data.result?.serverInfo?.name, 'taskpilot-mcp-server');
      console.log('✅ Test 4 Passed: Raw initialize negotiates 2025-11-25 protocol');
    }

    // Test 5: tools/list returns the 3 required tools with schemas & annotations
    {
      const res = await sendJsonRpc('tools/list', {}, 2);
      assert.strictEqual(res.status, 200);
      const tools = res.data.result?.tools || [];
      const toolNames = tools.map((t) => t.name).sort();
      assert.deepStrictEqual(toolNames, ['complete_task', 'create_task', 'list_tasks']);

      const listTool = tools.find((t) => t.name === 'list_tasks');
      assert.strictEqual(listTool.annotations?.readOnlyHint, true, 'list_tasks should have readOnlyHint: true');

      const completeTool = tools.find((t) => t.name === 'complete_task');
      assert.strictEqual(completeTool.annotations?.idempotentHint, true, 'complete_task should have idempotentHint: true');
      console.log('✅ Test 5 Passed: tools/list discovers 3 tools with proper annotations');
    }

    // Test 6: tools/call create_task
    let createdTaskId;
    {
      const res = await sendJsonRpc('tools/call', {
        name: 'create_task',
        arguments: {
          title: 'Submit Devpost video demo',
          priority: 'high',
          due: '2026-10-23',
        },
      }, 3);

      assert.strictEqual(res.status, 200);
      const content = JSON.parse(res.data.result.content[0].text);
      assert.strictEqual(content.task.title, 'Submit Devpost video demo');
      assert.strictEqual(content.task.priority, 'high');
      assert.strictEqual(content.task.due, '2026-10-23');
      assert.strictEqual(content.task.status, 'open');
      createdTaskId = content.task.id;
      console.log(`✅ Test 6 Passed: create_task successfully created task #${createdTaskId}`);
    }

    // Test 7: tools/call list_tasks
    {
      const res = await sendJsonRpc('tools/call', {
        name: 'list_tasks',
        arguments: { status: 'open' },
      }, 4);

      assert.strictEqual(res.status, 200);
      const content = JSON.parse(res.data.result.content[0].text);
      assert.strictEqual(content.count >= 1, true);
      const found = content.tasks.find((t) => t.id === createdTaskId);
      assert.ok(found, 'Created task should be present in open tasks list');
      console.log('✅ Test 7 Passed: list_tasks returned active tasks list');
    }

    // Test 8: tools/call complete_task
    {
      const res = await sendJsonRpc('tools/call', {
        name: 'complete_task',
        arguments: { title: 'Devpost' },
      }, 5);

      assert.strictEqual(res.status, 200);
      const content = JSON.parse(res.data.result.content[0].text);
      assert.strictEqual(content.task.id, createdTaskId);
      assert.strictEqual(content.task.status, 'done');
      assert.ok(content.task.completed_at, 'completed_at timestamp should be set');
      console.log('✅ Test 8 Passed: complete_task completed task by substring match');
    }

    // Test 9: tools/call complete_task double-complete error
    {
      const res = await sendJsonRpc('tools/call', {
        name: 'complete_task',
        arguments: { id: createdTaskId },
      }, 6);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.result.isError, true, 'isError flag should be true');
      const content = JSON.parse(res.data.result.content[0].text);
      assert.strictEqual(content.alreadyDone, true);
      console.log('✅ Test 9 Passed: double-complete gracefully returned alreadyDone error');
    }

    // Test 10: schema rejection on invalid input
    {
      const res = await sendJsonRpc('tools/call', {
        name: 'create_task',
        arguments: {
          title: '', // empty title violates min(1)
        },
      }, 7);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.result.isError, true, 'Validation error should set isError: true');
      console.log('✅ Test 10 Passed: Schema rejection handles invalid arguments gracefully');
    }

    // Test 11: Persistence across DB reconnect
    {
      closeDb();
      const freshDb = getDb(TEST_DB);
      const task = freshDb.prepare('SELECT * FROM tasks WHERE id = ?').get(createdTaskId);
      assert.ok(task, 'Task must persist in SQLite file');
      assert.strictEqual(task.status, 'done', 'Status must remain done');
      console.log('✅ Test 11 Passed: Persistence verified in SQLite file across restarts');
    }

    console.log('\n🎉 ALL 11 MCP END-TO-END TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    await new Promise((resolve) => httpServer.close(resolve));
    closeDb();
    if (fs.existsSync(TEST_DB)) {
      try { fs.unlinkSync(TEST_DB); } catch {}
    }
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

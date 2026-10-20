import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { httpServer, PORT, HOST } from '../mcp-server/server.mjs';
import { getDb, closeDb, listTasks, createTask, completeTask } from '../mcp-server/db.mjs';
import { mcpClient } from '../lib/mcp-client';

const VERIFY_DB = path.join(process.cwd(), 'data', 'test-consistency.db');
process.env.TASKPILOT_DB = VERIFY_DB;

if (fs.existsSync(VERIFY_DB)) {
  fs.unlinkSync(VERIFY_DB);
}

async function runDataConsistencyVerification() {
  console.log('🧪 [Data Consistency Verification] Testing end-to-end task consistency flow...');

  await new Promise((resolve) => httpServer.listen(PORT, HOST, resolve));

  try {
    // 1. Initial State: Should be 0 tasks
    const initialList = listTasks('all');
    assert.strictEqual(initialList.count, 0, 'Initial task count must be 0');
    console.log('✅ 1. Initial state verified: 0 tasks in fresh database');

    // 2. Create Task via MCP Client
    const title = 'Phase 6 Consistency Verification Task';
    const createRes = await mcpClient.callTool('create_task', {
      title,
      priority: 'high',
      due: '2026-10-23',
    });

    assert.strictEqual(createRes.isError, false);
    assert.strictEqual(createRes.result.task.title, title);
    assert.strictEqual(createRes.result.task.status, 'open');
    const createdId = createRes.result.task.id;
    console.log(`✅ 2. Created task #${createdId} through MCP client over Streamable HTTP`);

    // 3. Confirm Real SQLite Database contains the task in 'open' status
    const db = getDb(VERIFY_DB);
    const dbRow = db.prepare('SELECT * FROM tasks WHERE id = ?').get(createdId);
    assert.ok(dbRow, 'Task must exist in real SQLite file');
    assert.strictEqual(dbRow.status, 'open', 'Database status must be open');
    console.log('✅ 3. Verified task in real SQLite database with status=open');

    // 4. Query Open Tasks via MCP getTasks
    const { tasks: openTasks } = await mcpClient.getTasks('open');
    const foundOpen = openTasks.find((t) => t.id === createdId);
    assert.ok(foundOpen, 'Task must appear in open tasks list');
    assert.strictEqual(foundOpen.status, 'open');
    console.log('✅ 4. Verified task appears in open-task list via MCP list_tasks');

    // 5. Complete the Task via MCP complete_task
    const completeRes = await mcpClient.callTool('complete_task', { id: createdId });
    assert.strictEqual(completeRes.isError, false);
    assert.strictEqual(completeRes.result.task.status, 'done');
    console.log(`✅ 5. Completed task #${createdId} via MCP complete_task`);

    // 6. Confirm it appears in completed list and NOT in open list
    const { tasks: updatedOpen } = await mcpClient.getTasks('open');
    const stillInOpen = updatedOpen.some((t) => t.id === createdId);
    assert.strictEqual(stillInOpen, false, 'Completed task must not appear in open list');

    const { tasks: doneTasks } = await mcpClient.getTasks('done');
    const foundDone = doneTasks.find((t) => t.id === createdId);
    assert.ok(foundDone, 'Completed task must appear in done tasks list');
    assert.strictEqual(foundDone.status, 'done');
    assert.ok(foundDone.completed_at, 'completed_at timestamp must be set');
    console.log('✅ 6. Confirmed task moved to completed list and absent from open list');

    // 7. Verify Data Survives Reconnect / Restart
    closeDb();
    const freshDb = getDb(VERIFY_DB);
    const persisted = freshDb.prepare('SELECT * FROM tasks WHERE id = ?').get(createdId);
    assert.ok(persisted, 'Task must persist across restart');
    assert.strictEqual(persisted.status, 'done', 'Status must remain done');
    console.log('✅ 7. Persistence and consistency verified across restarts with zero mock data');

    console.log('\n🎉 ALL PHASE 6 DATA CONSISTENCY CHECKS PASSED WITH 100% SUCCESS!\n');
  } finally {
    await new Promise((resolve) => httpServer.close(resolve));
    closeDb();
    if (fs.existsSync(VERIFY_DB)) {
      try { fs.unlinkSync(VERIFY_DB); } catch {}
    }
  }
}

runDataConsistencyVerification().catch((err) => {
  console.error('❌ Data consistency test failed:', err);
  process.exit(1);
});

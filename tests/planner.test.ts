import assert from 'node:assert';
import { planWithRules } from '../lib/planner/rules';

console.log('🧪 [Planner Test Suite] Running table-driven utterance tests...');

const today = new Date().toISOString().split('T')[0];
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = tomorrowDate.toISOString().split('T')[0];

const testCases = [
  {
    name: 'Create task with priority and tomorrow due date',
    utterance: 'Remind me to submit the Devpost form tomorrow, high priority',
    expectedTool: 'create_task',
    validate: (call) => {
      assert.strictEqual(call.arguments.priority, 'high');
      assert.strictEqual(call.arguments.due, tomorrow);
      assert.ok(call.arguments.title.toLowerCase().includes('devpost'));
    },
  },
  {
    name: 'Create task with urgent priority and today',
    utterance: 'Add task fix critical login bug today urgent',
    expectedTool: 'create_task',
    validate: (call) => {
      assert.strictEqual(call.arguments.priority, 'high');
      assert.strictEqual(call.arguments.due, today);
      assert.ok(call.arguments.title.toLowerCase().includes('login bug'));
    },
  },
  {
    name: 'Create simple task with default medium priority',
    utterance: 'Put review pull request on my list',
    expectedTool: 'create_task',
    validate: (call) => {
      assert.strictEqual(call.arguments.priority, 'medium');
      assert.ok(call.arguments.title.toLowerCase().includes('review pull request'));
    },
  },
  {
    name: 'Create task with low priority',
    utterance: 'Create task water the plants low priority',
    expectedTool: 'create_task',
    validate: (call) => {
      assert.strictEqual(call.arguments.priority, 'low');
      assert.ok(call.arguments.title.toLowerCase().includes('water the plants'));
    },
  },
  {
    name: 'Query open tasks',
    utterance: "What's on my list?",
    expectedTool: 'list_tasks',
    validate: (call) => {
      assert.strictEqual(call.arguments.status, 'open');
    },
  },
  {
    name: 'Query completed tasks',
    utterance: 'Show completed tasks',
    expectedTool: 'list_tasks',
    validate: (call) => {
      assert.strictEqual(call.arguments.status, 'done');
    },
  },
  {
    name: 'Complete task by numeric ID',
    utterance: 'Complete task #4',
    expectedTool: 'complete_task',
    validate: (call) => {
      assert.strictEqual(call.arguments.id, 4);
    },
  },
  {
    name: 'Complete task by substring',
    utterance: 'Done with report',
    expectedTool: 'complete_task',
    validate: (call) => {
      assert.strictEqual(call.arguments.title, 'report');
    },
  },
  {
    name: 'Agentic multi-step day planner flow',
    utterance: 'Plan my day',
    expectedTool: 'create_task',
    validateMulti: (calls) => {
      assert.strictEqual(calls.length, 4, 'Plan my day should generate 4 tool calls');
      assert.strictEqual(calls[0].name, 'create_task');
      assert.strictEqual(calls[1].name, 'create_task');
      assert.strictEqual(calls[2].name, 'create_task');
      assert.strictEqual(calls[3].name, 'list_tasks');
    },
  },
  {
    name: 'Disambiguation resolution with context',
    utterance: 'The second one',
    context: {
      lastAmbiguousCandidates: [
        { id: 10, title: 'Write quarterly report' },
        { id: 14, title: 'Review annual financial report' },
      ],
    },
    expectedTool: 'complete_task',
    validate: (call) => {
      assert.strictEqual(call.arguments.id, 14, 'Should resolve to candidate 2 ID (14)');
    },
  },
];

let passed = 0;
for (const tc of testCases) {
  const result = planWithRules(tc.utterance, tc.context);
  assert.ok(result.toolCalls && result.toolCalls.length > 0, `No tool calls generated for: ${tc.name}`);

  if (tc.validateMulti) {
    tc.validateMulti(result.toolCalls);
  } else {
    assert.strictEqual(result.toolCalls[0].name, tc.expectedTool, `Expected ${tc.expectedTool} for: ${tc.name}`);
    tc.validate(result.toolCalls[0]);
  }

  passed++;
  console.log(`✅ Passed: ${tc.name}`);
}

console.log(`\n🎉 All ${passed} planner unit tests passed successfully!\n`);

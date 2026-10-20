import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp-client';
import { generatePlan, formatAssistantReply } from '@/lib/planner';
import { TraceItem } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const utterance = body.utterance?.trim();
    const context = body.context || {};

    if (!utterance) {
      return NextResponse.json({ error: 'Utterance is required' }, { status: 400 });
    }

    const traces: TraceItem[] = [];

    // Step 1: Runtime Tool Discovery via real MCP tools/list
    const { tools, trace: listToolsTrace } = await mcpClient.listTools();
    traces.push(listToolsTrace);

    // Step 2: Generate tool-calling plan using discovered tools
    const { plan, plannerType } = await generatePlan(utterance, tools, context);

    // Step 3: Execute tool calls against MCP server
    const toolResults: Array<{ name: string; result: any; isError: boolean }> = [];

    for (const call of plan.toolCalls) {
      const { result, isError, trace: callTrace } = await mcpClient.callTool(call.name, call.arguments);
      toolResults.push({ name: call.name, result, isError });
      traces.push(callTrace);
    }

    // Step 4: Refresh tasks state via MCP
    const { tasks, trace: getTasksTrace } = await mcpClient.getTasks('all');
    traces.push(getTasksTrace);

    // Step 5: Synthesize spoken response
    const { reply, ambiguousCandidates } = formatAssistantReply(utterance, plan, toolResults, tasks);

    return NextResponse.json({
      reply,
      planner: plannerType,
      toolCallsCount: plan.toolCalls.length,
      tasks,
      trace: traces,
      ambiguousCandidates,
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json(
      {
        error: 'Failed to process utterance',
        details: err.message,
      },
      { status: 500 }
    );
  }
}

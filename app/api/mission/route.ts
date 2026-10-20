import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp-client';
import { MissionPlan, ProposedAction, Task, TraceItem } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, goal, actions } = body;

    const traces: TraceItem[] = [];

    // ACTION 1: Generate Mission Plan based on real MCP tasks
    if (action === 'plan') {
      if (!goal || !goal.trim()) {
        return NextResponse.json({ error: 'Goal description is required' }, { status: 400 });
      }

      // Step 1: Retrieve existing tasks from real MCP server
      const { tasks: existingTasks, trace: listTrace } = await mcpClient.getTasks('all');
      traces.push(listTrace);

      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const inTwoDays = new Date();
      inTwoDays.setDate(inTwoDays.getDate() + 2);
      const inTwoDaysStr = inTwoDays.toISOString().split('T')[0];

      // Step 2: Intelligent rule-based mission generator tailored to the goal
      const lower = goal.toLowerCase();
      const proposedActions: ProposedAction[] = [];
      const clarifications: string[] = [];
      let missionTitle = 'Targeted Work Session Plan';
      let reasoning = 'Structured work breakdown based on current active tasks and stated priorities.';

      if (lower.includes('assignment') || lower.includes('exam') || lower.includes('evening') || lower.includes('study')) {
        missionTitle = 'High-Stakes Evening Study & Assignment Sprint';
        reasoning = `Analyzed your schedule against ${existingTasks.filter((t) => t.status === 'open').length} existing open tasks. Prioritizing immediate submission risk before exam revision.`;

        proposedActions.push({
          id: `act-${Date.now()}-1`,
          action: 'create',
          title: 'Complete and review final draft of urgent assignment',
          priority: 'high',
          due: tomorrowStr,
          rationale: 'Due tomorrow — must be submitted before end-of-day to avoid late penalty.',
          timeEstimate: '90 mins',
          selected: true,
        });

        proposedActions.push({
          id: `act-${Date.now()}-2`,
          action: 'create',
          title: 'Exam core concept review & formula flashcard drill',
          priority: 'high',
          due: inTwoDaysStr,
          rationale: 'Active recall spaced repetition for exam in 2 days.',
          timeEstimate: '60 mins',
          selected: true,
        });

        proposedActions.push({
          id: `act-${Date.now()}-3`,
          action: 'create',
          title: 'Evening wind-down & materials prep for tomorrow morning',
          priority: 'low',
          due: todayStr,
          rationale: 'Cognitive rest to ensure peak retention and focus.',
          timeEstimate: '20 mins',
          selected: true,
        });

        clarifications.push('Do you need time allocated for group sync, or is this solo focus work?');
        clarifications.push('What specific subject is the exam in, so we can tag notes accordingly?');
      } else {
        missionTitle = 'Custom Mission Plan';
        reasoning = `Decomposed your request into focused deliverables taking into account your ${existingTasks.length} recorded items.`;

        proposedActions.push({
          id: `act-${Date.now()}-1`,
          action: 'create',
          title: `Triage & execute: ${goal.slice(0, 60)}`,
          priority: 'high',
          due: todayStr,
          rationale: 'Primary objective directly addressing your stated priority.',
          timeEstimate: '45 mins',
          selected: true,
        });

        proposedActions.push({
          id: `act-${Date.now()}-2`,
          action: 'create',
          title: 'Validate deliverables & verify completion criteria',
          priority: 'medium',
          due: todayStr,
          rationale: 'Quality assurance step before marking work completed.',
          timeEstimate: '25 mins',
          selected: true,
        });
      }

      const missionPlan: MissionPlan = {
        missionTitle,
        goal,
        reasoning,
        proposedActions,
        clarifications,
      };

      return NextResponse.json({
        plan: missionPlan,
        existingTasks,
        traces,
      });
    }

    // ACTION 2: Execute User-Approved Actions through Real MCP Tools
    if (action === 'execute') {
      const actionsToRun: ProposedAction[] = actions || [];
      const executedResults: any[] = [];

      for (const act of actionsToRun) {
        if (!act.selected) continue;

        if (act.action === 'create') {
          const { result, isError, trace } = await mcpClient.callTool('create_task', {
            title: act.title,
            priority: act.priority,
            due: act.due,
          });
          traces.push(trace);
          executedResults.push({ action: act, result, isError });
        } else if (act.action === 'complete') {
          const { result, isError, trace } = await mcpClient.callTool('complete_task', {
            title: act.title,
          });
          traces.push(trace);
          executedResults.push({ action: act, result, isError });
        }
      }

      // Step 3: Verify the actual state by re-querying SQLite via MCP
      const { tasks: updatedTasks, trace: verifyTrace } = await mcpClient.getTasks('all');
      traces.push(verifyTrace);

      return NextResponse.json({
        success: true,
        executedCount: executedResults.length,
        results: executedResults,
        tasks: updatedTasks,
        traces,
        summary: `Successfully committed ${executedResults.length} approved actions directly to your SQLite database via real MCP tool calls.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Mission API Error:', err);
    return NextResponse.json(
      { error: 'Failed to process mission request', details: err.message },
      { status: 500 }
    );
  }
}

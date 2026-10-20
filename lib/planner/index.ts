import { McpToolSchema, PlanResult, Task } from '../types';
import { isBedrockConfigured, planWithBedrock } from './bedrock';
import { planWithRules } from './rules';

export async function generatePlan(
  utterance: string,
  tools: McpToolSchema[],
  context?: Record<string, any>
): Promise<{ plan: PlanResult; plannerType: 'rule-based' | 'bedrock' }> {
  if (isBedrockConfigured()) {
    const { result, usedBedrock } = await planWithBedrock(utterance, tools, context);
    return {
      plan: result,
      plannerType: usedBedrock ? 'bedrock' : 'rule-based',
    };
  }

  return {
    plan: planWithRules(utterance, context),
    plannerType: 'rule-based',
  };
}

/**
 * Synthesizes a natural, concise Alexa+ style spoken response based on tool results.
 */
export function formatAssistantReply(
  utterance: string,
  plan: PlanResult,
  toolResults: Array<{ name: string; result: any; isError: boolean }>,
  allTasks: Task[]
): { reply: string; ambiguousCandidates?: Task[] } {
  if (plan.replyTemplate) {
    return { reply: plan.replyTemplate };
  }

  let ambiguousCandidates: Task[] | undefined = undefined;

  // Process all tool results
  const replies: string[] = [];

  for (const { name, result, isError } of toolResults) {
    if (name === 'create_task') {
      if (isError) {
        replies.push(`I couldn't create that task: ${result?.message || 'Invalid parameters'}.`);
      } else if (result?.task) {
        const task: Task = result.task;
        const dueText = task.due ? `, due ${task.due}` : '';
        replies.push(`Added "${task.title}", ${task.priority} priority${dueText}.`);
      }
    } else if (name === 'complete_task') {
      if (result?.ambiguous && result?.candidates) {
        ambiguousCandidates = result.candidates;
        const names = result.candidates.map((c: Task, idx: number) => `(${idx + 1}) #${c.id} "${c.title}"`).join(', ');
        replies.push(`I found ${result.candidates.length} tasks matching that: ${names}. Which one did you mean?`);
      } else if (result?.alreadyDone) {
        replies.push(`Task "${result.task?.title || 'item'}" was already marked as completed.`);
      } else if (isError) {
        replies.push(result?.message || 'I could not find or complete that task.');
      } else if (result?.task) {
        replies.push(`Completed task #${result.task.id}: "${result.task.title}". Nice job!`);
      }
    } else if (name === 'list_tasks') {
      const openCount = allTasks.filter((t) => t.status === 'open').length;
      if (openCount === 0) {
        replies.push('You have no open tasks on your board. You are all caught up!');
      } else if (openCount === 1) {
        const t = allTasks.find((item) => item.status === 'open');
        replies.push(`You have 1 open task: "${t?.title}", ${t?.priority} priority.`);
      } else {
        const topTasks = allTasks
          .filter((t) => t.status === 'open')
          .slice(0, 3)
          .map((t) => `"${t.title}" (${t.priority} priority)`)
          .join(', ');
        replies.push(`You have ${openCount} open tasks. Next up: ${topTasks}.`);
      }
    }
  }

  if (replies.length > 0) {
    return { reply: replies.join(' '), ambiguousCandidates };
  }

  return {
    reply: `I have updated your tasks. You currently have ${allTasks.filter((t) => t.status === 'open').length} open items.`,
  };
}

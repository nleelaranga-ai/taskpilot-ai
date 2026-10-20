import { PlanResult, ToolCall } from '../types';

/**
 * Normalizes an utterance for pattern matching
 */
function cleanText(text: string): string {
  return text.toLowerCase().trim().replace(/[.,!?;:]+$/, '');
}

/**
 * Computes date string (YYYY-MM-DD) based on relative phrases
 */
function extractDueDate(text: string): { due: string | null; cleanedText: string } {
  const lower = text.toLowerCase();
  const now = new Date();
  
  // Format helper: YYYY-MM-DD
  const formatIso = (d: Date) => d.toISOString().split('T')[0];

  // Specific ISO date match (e.g. 2026-10-23)
  const isoMatch = lower.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (isoMatch) {
    const due = isoMatch[1];
    const cleanedText = text.replace(new RegExp(`\\b${due}\\b`, 'i'), '').trim();
    return { due, cleanedText };
  }

  // "today"
  if (/\b(today|by tonight)\b/i.test(lower)) {
    const cleanedText = text.replace(/\b(today|by tonight|due today|for today)\b/gi, '').trim();
    return { due: formatIso(now), cleanedText };
  }

  // "tomorrow"
  if (/\b(tomorrow)\b/i.test(lower)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const cleanedText = text.replace(/\b(by tomorrow|due tomorrow|tomorrow|for tomorrow)\b/gi, '').trim();
    return { due: formatIso(tomorrow), cleanedText };
  }

  // "in X days"
  const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/i);
  if (inDaysMatch) {
    const count = parseInt(inDaysMatch[1], 10);
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + count);
    const cleanedText = text.replace(inDaysMatch[0], '').trim();
    return { due: formatIso(targetDate), cleanedText };
  }

  // Weekdays: Monday through Sunday
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayRegex = /\b(?:by|on|next)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const dayMatch = lower.match(dayRegex);
  if (dayMatch) {
    const targetDayIndex = daysOfWeek.indexOf(dayMatch[1].toLowerCase());
    if (targetDayIndex !== -1) {
      const currentDayIndex = now.getDay();
      let daysAhead = targetDayIndex - currentDayIndex;
      if (daysAhead <= 0) {
        daysAhead += 7; // Next occurrence
      }
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysAhead);
      const cleanedText = text.replace(dayMatch[0], '').trim();
      return { due: formatIso(targetDate), cleanedText };
    }
  }

  return { due: null, cleanedText: text };
}

/**
 * Extracts priority keywords (high, medium, low)
 */
function extractPriority(text: string): { priority: 'low' | 'medium' | 'high'; cleanedText: string } {
  const lower = text.toLowerCase();

  if (/\b(high priority|urgent|critical|important|top priority|high)\b/i.test(lower)) {
    const cleanedText = text.replace(/\b(high priority|urgent|critical|important|top priority|high)\b/gi, '').trim();
    return { priority: 'high', cleanedText };
  }

  if (/\b(low priority|minor|low)\b/i.test(lower)) {
    const cleanedText = text.replace(/\b(low priority|minor|low)\b/gi, '').trim();
    return { priority: 'low', cleanedText };
  }

  if (/\b(medium priority|normal priority|medium)\b/i.test(lower)) {
    const cleanedText = text.replace(/\b(medium priority|normal priority|medium)\b/gi, '').trim();
    return { priority: 'medium', cleanedText };
  }

  return { priority: 'medium', cleanedText: text };
}

/**
 * Main Rule-based Planner
 */
export function planWithRules(utterance: string, context?: Record<string, any>): PlanResult {
  const cleaned = cleanText(utterance);
  const now = new Date();
  const formatIso = (d: Date) => d.toISOString().split('T')[0];

  // 1. Agentic Flow: "Plan my day" / "Plan my Thursday" / "Organize my tasks"
  if (/\b(plan (my )?(day|today|schedule|morning|afternoon|thursday|friday|monday|tuesday|wednesday|weekend))\b/i.test(cleaned) ||
      /\b(organize (my )?(day|tasks|schedule))\b/i.test(cleaned)) {
    const today = formatIso(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const toolCalls: ToolCall[] = [
      {
        name: 'create_task',
        arguments: {
          title: 'Review project priorities & triage blockers',
          priority: 'high',
          due: today,
        },
      },
      {
        name: 'create_task',
        arguments: {
          title: 'Deep focus: build & verify core deliverables',
          priority: 'high',
          due: today,
        },
      },
      {
        name: 'create_task',
        arguments: {
          title: 'Daily wrap-up: document progress & verify tests',
          priority: 'medium',
          due: today,
        },
      },
      {
        name: 'list_tasks',
        arguments: {
          status: 'open',
        },
      },
    ];

    return {
      thought: 'Agentic flow triggered: creating structured daily plan with 3 prioritized tasks and refreshing board.',
      toolCalls,
      replyTemplate: 'I have structured your day with 3 key priority tasks: morning triage, core deep focus work, and evening wrap-up. Your board is updated.',
    };
  }

  // 2. Disambiguation answer from previous context (e.g. "the first one", "the second one", "#2", "2")
  if (context?.lastAmbiguousCandidates && Array.isArray(context.lastAmbiguousCandidates)) {
    const candidates = context.lastAmbiguousCandidates;
    let selectedId: number | null = null;

    if (/\b(first|1st|option 1|the first one|number 1|#1)\b/i.test(cleaned) && candidates[0]) {
      selectedId = candidates[0].id;
    } else if (/\b(second|2nd|option 2|the second one|number 2|#2)\b/i.test(cleaned) && candidates[1]) {
      selectedId = candidates[1].id;
    } else if (/\b(third|3rd|option 3|the third one|number 3|#3)\b/i.test(cleaned) && candidates[2]) {
      selectedId = candidates[2].id;
    } else {
      const numMatch = cleaned.match(/\b(?:id|task|#)?\s*(\d+)\b/i);
      if (numMatch) {
        selectedId = parseInt(numMatch[1], 10);
      }
    }

    if (selectedId) {
      return {
        thought: `Disambiguation follow-up resolved to task ID #${selectedId}`,
        toolCalls: [
          {
            name: 'complete_task',
            arguments: { id: selectedId },
          },
        ],
      };
    }
  }

  // 3. Querying tasks: "What's on my list?", "Show my tasks", "What's left?", "Show completed tasks"
  if (/\b(what('s| is) on my list|what do i (have to|need to) do|what('s| is) left|show (?:my |all |open |completed |done )?tasks|list (?:my |all |open |completed |done )?tasks|show todo|show open tasks|show done tasks)\b/i.test(cleaned)) {
    const isDoneQuery = /\b(done|completed|finished)\b/i.test(cleaned);
    const status = isDoneQuery ? 'done' : 'open';

    return {
      thought: `Querying tasks with status: ${status}`,
      toolCalls: [
        {
          name: 'list_tasks',
          arguments: { status },
        },
      ],
    };
  }

  // 4. Completing a task: "Done with X", "Complete task X", "Finish X", "Check off X"
  const completePattern = /\b(done with|complete task|complete|finished with|finished|finish|check off|mark done)\b\s*(.*)/i;
  const completeMatch = cleaned.match(completePattern);
  if (completeMatch) {
    const rawTarget = completeMatch[2].trim();
    // Check if target is numeric id (e.g. "task 2", "#2", "2")
    const idMatch = rawTarget.match(/^(?:task\s*|#)?(\d+)$/i);
    if (idMatch) {
      return {
        thought: `Completing task by numeric ID #${idMatch[1]}`,
        toolCalls: [
          {
            name: 'complete_task',
            arguments: { id: parseInt(idMatch[1], 10) },
          },
        ],
      };
    }

    // Clean up filler words from target title
    let title = rawTarget
      .replace(/^(the|my|a|an)\s+/i, '')
      .replace(/\s+(task|item)$/i, '')
      .trim();

    if (title.length > 0) {
      return {
        thought: `Completing task by title substring "${title}"`,
        toolCalls: [
          {
            name: 'complete_task',
            arguments: { title },
          },
        ],
      };
    }
  }

  // 5. Creating a task: "Remind me to...", "Add task...", "Create...", "Need to...", "Put ... on my list"
  const createPattern = /\b(remind me to|add task|create task|add|create|put|new task|need to|schedule|make a task to|remember to)\b\s*(.*)/i;
  const createMatch = cleaned.match(createPattern);

  if (createMatch) {
    let remainder = createMatch[2];

    // Extract due date first
    const { due, cleanedText: textWithoutDue } = extractDueDate(remainder);
    remainder = textWithoutDue;

    // Extract priority
    const { priority, cleanedText: textWithoutPriority } = extractPriority(remainder);
    remainder = textWithoutPriority;

    // Clean up phrases like "on my list", "to my tasks", "with", leading "to "
    remainder = remainder
      .replace(/\b(on my list|in my tasks|to my list|to the list|with|as)\b/gi, '')
      .replace(/^to\s+/i, '')
      .replace(/^(a|an)\s+/i, '')
      .trim();

    if (remainder.length > 0) {
      return {
        thought: `Creating task "${remainder}" with priority=${priority}, due=${due || 'none'}`,
        toolCalls: [
          {
            name: 'create_task',
            arguments: {
              title: remainder,
              priority,
              due: due || null,
            },
          },
        ],
      };
    }
  }

  // Fallback: If utterance contains priority or due date, treat as task creation
  const { due, cleanedText: textNoDue } = extractDueDate(cleaned);
  const { priority, cleanedText: textNoPriority } = extractPriority(textNoDue);
  let fallbackTitle = textNoPriority.replace(/^(add|remind|create)\s+/i, '').trim();

  if (fallbackTitle.length > 2) {
    return {
      thought: `Fallback rule: interpreting "${fallbackTitle}" as task creation`,
      toolCalls: [
        {
          name: 'create_task',
          arguments: {
            title: fallbackTitle,
            priority,
            due: due || null,
          },
        },
      ],
    };
  }

  // Default: list open tasks
  return {
    thought: 'Unrecognized utterance format, defaulting to listing open tasks',
    toolCalls: [
      {
        name: 'list_tasks',
        arguments: { status: 'open' },
      },
    ],
  };
}

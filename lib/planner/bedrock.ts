import { McpToolSchema, PlanResult, ToolCall } from '../types';
import { planWithRules } from './rules';

/**
 * Checks if AWS Bedrock credentials and region are present in environment
 */
export function isBedrockConfigured(): boolean {
  return Boolean(
    process.env.AWS_REGION &&
    (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE || process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI)
  );
}

/**
 * Bedrock Converse-based Planner
 * Only executes if AWS Bedrock credentials exist; otherwise falls back gracefully to rules planner.
 */
export async function planWithBedrock(
  utterance: string,
  tools: McpToolSchema[] = [],
  context?: Record<string, any>
): Promise<{ result: PlanResult; usedBedrock: boolean }> {
  if (!isBedrockConfigured()) {
    return {
      result: planWithRules(utterance, context),
      usedBedrock: false,
    };
  }

  try {
    const { BedrockRuntimeClient, ConverseCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION,
    });

    const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';

    // Format discovered MCP tools into Bedrock toolConfig
    const toolConfig = {
      tools: tools.map((t) => ({
        toolSpec: {
          name: t.name,
          description: t.description || `Tool ${t.name}`,
          inputSchema: {
            json: (t.inputSchema as any) || { type: 'object' },
          },
        },
      })),
    };

    const systemPrompt = `You are TaskPilot AI, an intelligent voice task manager.
Your role is to translate user utterances into precise tool calls using the available tools.
Rules:
- create_task: For adding new tasks, specifying title, priority ('low', 'medium', 'high'), and due date ('YYYY-MM-DD').
- complete_task: For finishing or marking tasks done by ID or title substring.
- list_tasks: For querying or viewing tasks.
- If the user asks to plan their day, create several structured priority tasks.`;

    const command = new ConverseCommand({
      modelId,
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: utterance }],
        },
      ],
      toolConfig: toolConfig.tools.length > 0 ? (toolConfig as any) : undefined,
    });

    const response = await client.send(command);
    const outputMessage = response.output?.message;
    const toolCalls: ToolCall[] = [];

    if (outputMessage?.content) {
      for (const block of outputMessage.content) {
        if (block.toolUse) {
          toolCalls.push({
            name: block.toolUse.name as any,
            arguments: (block.toolUse.input as any) || {},
          });
        }
      }
    }

    if (toolCalls.length > 0) {
      return {
        result: {
          thought: `Bedrock planner generated ${toolCalls.length} tool calls using ${modelId}.`,
          toolCalls,
        },
        usedBedrock: true,
      };
    }

    // If no tool call returned from model, fallback to rules
    return {
      result: planWithRules(utterance, context),
      usedBedrock: false,
    };
  } catch (err) {
    console.warn('[Bedrock Planner] Fallback to rule-based planner:', err);
    return {
      result: planWithRules(utterance, context),
      usedBedrock: false,
    };
  }
}

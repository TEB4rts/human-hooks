import { fromBotAutomation } from './bots.js';
import { fromClaudeToolUse } from './claude.js';
import { fromGeminiFunctionCall } from './gemini.js';
import { fromLangChainAction } from './langchain.js';
import { fromMcpToolCall } from './mcp.js';
import { fromN8nItem } from './n8n.js';
import { fromOpenAIToolCall } from './openai.js';
import { fromToolEnvelope } from './generic.js';
import { fromWorkflowStep } from './workflows.js';
import type { GuardRequest, JsonMap } from '../types.js';

export interface NormalizeGuardRequestHints {
  provider?: 'claude' | 'openai' | 'n8n' | 'mcp' | 'langchain' | 'bot' | 'generic' | 'gemini' | 'workflow';
}

export function normalizeGuardRequest(
  input: Record<string, unknown>,
  hints: NormalizeGuardRequestHints = {},
): GuardRequest<JsonMap, JsonMap> {
  if (isGuardRequest(input)) {
    return input as unknown as GuardRequest<JsonMap, JsonMap>;
  }

  const provider = hints.provider;
  if (provider === 'claude') return fromClaudeToolUse(input as never);
  if (provider === 'openai') return fromOpenAIToolCall(input as never);
  if (provider === 'n8n') return fromN8nItem(input as never);
  if (provider === 'mcp') return fromMcpToolCall(input as never);
  if (provider === 'langchain') return fromLangChainAction(input as never);
  if (provider === 'bot') return fromBotAutomation(input as never);
  if (provider === 'generic') return fromToolEnvelope(input as never);
  if (provider === 'gemini') return fromGeminiFunctionCall(input as never);
  if (provider === 'workflow') return fromWorkflowStep(input as never);

  if ('json' in input) return fromN8nItem(input as never);
  if ('botName' in input && 'task' in input) return fromBotAutomation(input as never);
  if ('functionName' in input) return fromOpenAIToolCall(input as never);
  if ('serverName' in input || 'params' in input) return fromMcpToolCall(input as never);
  if ('graphId' in input || 'nodeName' in input) return fromLangChainAction(input as never);
  if ('toolName' in input && ('sessionId' in input || 'messageId' in input || 'userId' in input)) return fromClaudeToolUse(input as never);
  if ('name' in input && ('args' in input || 'invocationId' in input)) return fromGeminiFunctionCall(input as never);
  if ('stepName' in input && ('workflowId' in input || 'provider' in input)) return fromWorkflowStep(input as never);
  if ('action' in input && ('payload' in input || 'provider' in input)) return fromToolEnvelope(input as never);

  throw new Error('Could not normalize request shape. Provide hints.provider or use a specific adapter.');
}

function isGuardRequest(input: Record<string, unknown>): boolean {
  return typeof input.action === 'string' && Boolean(input.actor) && Boolean(input.payload);
}

import type { GuardRequest, JsonMap, ReviewActor } from '../types.js';

export interface ClaudeToolUseEnvelope<TInput extends JsonMap = JsonMap> {
  toolName: string;
  input: TInput;
  confidence?: number;
  userId?: string;
  sessionId?: string;
  messageId?: string;
  tags?: string[];
  actor?: ReviewActor;
}

export function fromClaudeToolUse<TInput extends JsonMap = JsonMap>(
  envelope: ClaudeToolUseEnvelope<TInput>,
): GuardRequest<TInput, JsonMap> {
  return {
    action: `tool.${envelope.toolName}`,
    actor: envelope.actor ?? {
      id: envelope.sessionId ?? envelope.userId ?? 'claude-agent',
      type: 'agent',
      name: 'Claude-compatible agent',
    },
    provider: 'claude',
    payload: envelope.input,
    meta: {
      confidence: envelope.confidence,
      sessionId: envelope.sessionId,
      messageId: envelope.messageId,
    },
    tags: envelope.tags,
    idempotencyKey: envelope.messageId,
  };
}

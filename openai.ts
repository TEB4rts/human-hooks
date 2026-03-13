import type { GuardRequest, JsonMap, ReviewActor } from '../types.js';

export interface OpenAIToolCallEnvelope<TInput extends JsonMap = JsonMap> {
  functionName: string;
  arguments?: TInput;
  input?: TInput;
  confidence?: number;
  toolCallId?: string;
  runId?: string;
  threadId?: string;
  assistantId?: string;
  tags?: string[];
  actor?: ReviewActor;
}

export function fromOpenAIToolCall<TInput extends JsonMap = JsonMap>(
  envelope: OpenAIToolCallEnvelope<TInput>,
): GuardRequest<TInput, JsonMap> {
  const payload = envelope.arguments ?? envelope.input ?? ({} as TInput);

  return {
    action: `tool.${envelope.functionName}`,
    actor: envelope.actor ?? {
      id: envelope.runId ?? envelope.assistantId ?? 'openai-agent',
      type: 'agent',
      name: 'OpenAI-compatible agent',
    },
    provider: 'openai',
    payload,
    meta: {
      confidence: envelope.confidence,
      toolCallId: envelope.toolCallId,
      runId: envelope.runId,
      threadId: envelope.threadId,
      assistantId: envelope.assistantId,
    },
    tags: envelope.tags,
    idempotencyKey: envelope.toolCallId ?? envelope.runId,
  };
}

import type { GuardRequest, JsonMap, ReviewActor } from '../types.js';

export interface GeminiFunctionCallEnvelope<TInput extends JsonMap = JsonMap> {
  name: string;
  args?: TInput;
  input?: TInput;
  invocationId?: string;
  sessionId?: string;
  confidence?: number;
  tags?: string[];
  actor?: ReviewActor;
}

export function fromGeminiFunctionCall<TInput extends JsonMap = JsonMap>(
  envelope: GeminiFunctionCallEnvelope<TInput>,
): GuardRequest<TInput, JsonMap> {
  const payload = envelope.args ?? envelope.input ?? ({} as TInput);

  return {
    action: `tool.${envelope.name}`,
    actor: envelope.actor ?? {
      id: envelope.invocationId ?? envelope.sessionId ?? 'gemini-agent',
      type: 'agent',
      name: 'Gemini-compatible agent',
    },
    provider: 'gemini',
    payload,
    meta: {
      confidence: envelope.confidence,
      invocationId: envelope.invocationId,
      sessionId: envelope.sessionId,
    },
    tags: envelope.tags,
    idempotencyKey: envelope.invocationId,
  };
}

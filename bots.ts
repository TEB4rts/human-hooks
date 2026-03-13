import type { GuardRequest, JsonMap } from '../types.js';

export interface BotAutomationEnvelope<TPayload extends JsonMap = JsonMap> {
  botName: string;
  task: string;
  payload: TPayload;
  confidence?: number;
  runId?: string;
  tags?: string[];
}

export function fromBotAutomation<TPayload extends JsonMap = JsonMap>(
  envelope: BotAutomationEnvelope<TPayload>,
): GuardRequest<TPayload, JsonMap> {
  return {
    action: envelope.task,
    actor: {
      id: envelope.runId ?? `${envelope.botName}-automation`,
      type: 'agent',
      name: envelope.botName,
    },
    provider: envelope.botName,
    payload: envelope.payload,
    meta: {
      confidence: envelope.confidence,
      runId: envelope.runId,
    },
    tags: envelope.tags,
    idempotencyKey: envelope.runId,
  };
}

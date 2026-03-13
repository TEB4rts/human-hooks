import type { GuardRequest, JsonMap, ReviewActor } from '../types.js';

export interface WorkflowStepEnvelope<TInput extends JsonMap = JsonMap> {
  provider: 'make' | 'zapier' | 'pipedream' | 'workflow';
  stepName: string;
  input?: TInput;
  payload?: TInput;
  runId?: string;
  workflowId?: string;
  confidence?: number;
  tags?: string[];
  actor?: ReviewActor;
}

export function fromWorkflowStep<TInput extends JsonMap = JsonMap>(
  envelope: WorkflowStepEnvelope<TInput>,
): GuardRequest<TInput, JsonMap> {
  const payload = envelope.payload ?? envelope.input ?? ({} as TInput);

  return {
    action: `step.${envelope.stepName}`,
    actor: envelope.actor ?? {
      id: envelope.runId ?? envelope.workflowId ?? `${envelope.provider}-workflow`,
      type: 'service',
      name: `${envelope.provider} workflow`,
    },
    provider: envelope.provider,
    payload,
    meta: {
      confidence: envelope.confidence,
      runId: envelope.runId,
      workflowId: envelope.workflowId,
    },
    tags: envelope.tags,
    idempotencyKey: envelope.runId,
  };
}

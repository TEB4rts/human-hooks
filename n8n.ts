import type { GuardRequest, JsonMap } from '../types.js';

export interface N8nItemEnvelope {
  json: Record<string, unknown>;
  pairedItem?: unknown;
}

export interface N8nGuardOptions {
  actionField?: string;
  actorIdField?: string;
  confidenceField?: string;
  provider?: string;
}

export function fromN8nItem(
  item: N8nItemEnvelope,
  options: N8nGuardOptions = {},
): GuardRequest<JsonMap, JsonMap> {
  const actionField = options.actionField ?? 'action';
  const actorIdField = options.actorIdField ?? 'actorId';
  const confidenceField = options.confidenceField ?? 'confidence';
  const data = item.json as Record<string, unknown>;

  return {
    action: String(data[actionField] ?? 'workflow.action'),
    actor: {
      id: String(data[actorIdField] ?? 'n8n-workflow'),
      type: 'service',
      name: 'n8n workflow',
    },
    provider: options.provider ?? 'n8n',
    payload: (data.payload as JsonMap | undefined) ?? (data as JsonMap),
    meta: {
      confidence: typeof data[confidenceField] === 'number' ? (data[confidenceField] as number) : undefined,
      workflowId: data.workflowId as string | undefined,
      executionId: data.executionId as string | undefined,
    },
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
    idempotencyKey: typeof data.executionId === 'string' ? (data.executionId as string) : undefined,
  };
}

export function toN8nReviewResponse(reviewId: string): { json: { status: string; reviewId: string } } {
  return {
    json: {
      status: 'needs_review',
      reviewId,
    },
  };
}

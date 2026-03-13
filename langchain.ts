import type { GuardRequest, JsonMap, ReviewActor } from '../types.js';

export interface LangChainActionEnvelope<TInput extends JsonMap = JsonMap> {
  tool: string;
  input: TInput;
  confidence?: number;
  runId?: string;
  graphId?: string;
  nodeName?: string;
  tags?: string[];
  actor?: ReviewActor;
}

export function fromLangChainAction<TInput extends JsonMap = JsonMap>(
  envelope: LangChainActionEnvelope<TInput>,
): GuardRequest<TInput, JsonMap> {
  return {
    action: `tool.${envelope.tool}`,
    actor: envelope.actor ?? {
      id: envelope.runId ?? envelope.graphId ?? 'langchain-agent',
      type: 'agent',
      name: envelope.nodeName ? `LangChain node ${envelope.nodeName}` : 'LangChain agent',
    },
    provider: 'langchain',
    payload: envelope.input,
    meta: {
      confidence: envelope.confidence,
      runId: envelope.runId,
      graphId: envelope.graphId,
      nodeName: envelope.nodeName,
    },
    tags: envelope.tags,
    idempotencyKey: envelope.runId,
  };
}

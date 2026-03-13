import type { GuardRequest, JsonMap, ReviewActor } from '../types.js';

export interface McpToolCallEnvelope<TParams extends JsonMap = JsonMap> {
  toolName: string;
  params?: TParams;
  arguments?: TParams;
  sessionId?: string;
  requestId?: string;
  serverName?: string;
  confidence?: number;
  tags?: string[];
  actor?: ReviewActor;
}

export function fromMcpToolCall<TParams extends JsonMap = JsonMap>(
  envelope: McpToolCallEnvelope<TParams>,
): GuardRequest<TParams, JsonMap> {
  const payload = envelope.params ?? envelope.arguments ?? ({} as TParams);

  return {
    action: `tool.${envelope.toolName}`,
    actor: envelope.actor ?? {
      id: envelope.sessionId ?? envelope.requestId ?? 'mcp-agent',
      type: 'agent',
      name: envelope.serverName ? `${envelope.serverName} MCP client` : 'MCP client',
    },
    provider: 'mcp',
    payload,
    meta: {
      confidence: envelope.confidence,
      requestId: envelope.requestId,
      sessionId: envelope.sessionId,
      serverName: envelope.serverName,
    },
    tags: envelope.tags,
    idempotencyKey: envelope.requestId,
  };
}

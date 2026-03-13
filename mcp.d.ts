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
export declare function fromMcpToolCall<TParams extends JsonMap = JsonMap>(envelope: McpToolCallEnvelope<TParams>): GuardRequest<TParams, JsonMap>;

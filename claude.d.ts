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
export declare function fromClaudeToolUse<TInput extends JsonMap = JsonMap>(envelope: ClaudeToolUseEnvelope<TInput>): GuardRequest<TInput, JsonMap>;

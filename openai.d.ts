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
export declare function fromOpenAIToolCall<TInput extends JsonMap = JsonMap>(envelope: OpenAIToolCallEnvelope<TInput>): GuardRequest<TInput, JsonMap>;

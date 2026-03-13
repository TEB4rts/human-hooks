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
export declare function fromGeminiFunctionCall<TInput extends JsonMap = JsonMap>(envelope: GeminiFunctionCallEnvelope<TInput>): GuardRequest<TInput, JsonMap>;

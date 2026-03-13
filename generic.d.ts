import type { GuardRequest, JsonMap, ReviewActor, ReviewTarget } from '../types.js';
export interface GenericToolEnvelope<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap> {
    action: string;
    actor: ReviewActor;
    payload: TPayload;
    meta?: TMeta;
    provider?: string;
    resource?: ReviewTarget;
    tags?: string[];
    idempotencyKey?: string;
}
export declare function fromToolEnvelope<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(input: GenericToolEnvelope<TPayload, TMeta>): GuardRequest<TPayload, TMeta>;

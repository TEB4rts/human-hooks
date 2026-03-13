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
export declare function fromN8nItem(item: N8nItemEnvelope, options?: N8nGuardOptions): GuardRequest<JsonMap, JsonMap>;
export declare function toN8nReviewResponse(reviewId: string): {
    json: {
        status: string;
        reviewId: string;
    };
};

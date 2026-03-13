import type { ReviewActor, ReviewRecord } from './types.js';
export interface QueueAuthorizerOptions {
    queueApprovers?: Record<string, string[]>;
    globalApprovers?: string[];
    allowActors?: ReviewActor['type'][];
}
export declare function createQueueAuthorizer(options?: QueueAuthorizerOptions): (review: ReviewRecord, actor: ReviewActor) => boolean;

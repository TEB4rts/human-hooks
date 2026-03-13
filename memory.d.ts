import type { ReviewRecord, ReviewStore } from '../types.js';
export declare class MemoryReviewStore implements ReviewStore {
    private readonly reviews;
    create(review: ReviewRecord): Promise<void>;
    get(id: string): Promise<ReviewRecord | null>;
    listPending(queue?: string): Promise<ReviewRecord[]>;
    listAll(queue?: string): Promise<ReviewRecord[]>;
    put(review: ReviewRecord): Promise<ReviewRecord>;
    findPendingByFingerprint(fingerprint: string): Promise<ReviewRecord | null>;
}
export declare function memoryReviewStore(): ReviewStore;

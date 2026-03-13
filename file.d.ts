import type { ReviewRecord, ReviewStore } from '../types.js';
export declare class FileReviewStore implements ReviewStore {
    private readonly filePath;
    constructor(filePath: string);
    create(review: ReviewRecord): Promise<void>;
    get(id: string): Promise<ReviewRecord | null>;
    listPending(queue?: string): Promise<ReviewRecord[]>;
    put(review: ReviewRecord): Promise<ReviewRecord>;
    findPendingByFingerprint(fingerprint: string): Promise<ReviewRecord | null>;
    private readDb;
    private writeDb;
}
export declare function fileReviewStore(filePath: string): ReviewStore;

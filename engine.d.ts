import type { ApprovalOutcome, GuardDecision, GuardRequest, JsonMap, ReviewActor, ReviewEngineOptions, ReviewRecord, ReviewStats, WrappedActionResult, WrapActionOptions } from './types.js';
export declare class ReviewEngine {
    private readonly store;
    private readonly policies;
    private readonly defaultQueue;
    private readonly idGenerator;
    private readonly eventSink;
    private readonly reviewerAuthorizer;
    private readonly now;
    constructor(options: ReviewEngineOptions);
    guard<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(request: GuardRequest<TPayload, TMeta>): Promise<GuardDecision>;
    guardMany<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(requests: GuardRequest<TPayload, TMeta>[]): Promise<GuardDecision[]>;
    approve(id: string, actor: ReviewActor, note?: string): Promise<ReviewRecord>;
    reject(id: string, actor: ReviewActor, note?: string): Promise<ReviewRecord>;
    markExecuted(id: string, actor?: ReviewActor, output?: JsonMap): Promise<ReviewRecord>;
    getReview(id: string): Promise<ReviewRecord | null>;
    listPending(queue?: string): Promise<ReviewRecord[]>;
    listAll(queue?: string): Promise<ReviewRecord[]>;
    getStats(queue?: string): Promise<ReviewStats>;
    waitForApproval(id: string): Promise<ApprovalOutcome>;
    wrapAction<TInput, TResult, TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(options: WrapActionOptions<TInput, TResult, TPayload, TMeta>): {
        run: (input: TInput) => Promise<WrappedActionResult<TResult>>;
    };
    private evaluateMatches;
    private buildReviewRecord;
    private createHistoryEntry;
    private assertReviewerAllowed;
    private getRequiredReview;
    private expireIfNeeded;
    private isExpired;
    private publish;
}
export declare function createReviewEngine(options: ReviewEngineOptions): ReviewEngine;

import type { ReviewActor } from '../types.js';
import { ReviewEngine } from '../engine.js';
export declare function createReviewHttpApi(engine: ReviewEngine): {
    listPending: (queue?: string) => Promise<import("../types.js").ReviewRecord<import("../types.js").JsonMap, import("../types.js").JsonMap>[]>;
    listAll: (queue?: string) => Promise<import("../types.js").ReviewRecord<import("../types.js").JsonMap, import("../types.js").JsonMap>[]>;
    getStats: (queue?: string) => Promise<import("../types.js").ReviewStats>;
    getReview: (id: string) => Promise<import("../types.js").ReviewRecord<import("../types.js").JsonMap, import("../types.js").JsonMap> | null>;
    approve: (id: string, actor: ReviewActor, note?: string) => Promise<import("../types.js").ReviewRecord<import("../types.js").JsonMap, import("../types.js").JsonMap>>;
    reject: (id: string, actor: ReviewActor, note?: string) => Promise<import("../types.js").ReviewRecord<import("../types.js").JsonMap, import("../types.js").JsonMap>>;
    markExecuted: (id: string, actor?: ReviewActor, output?: Record<string, unknown>) => Promise<import("../types.js").ReviewRecord<import("../types.js").JsonMap, import("../types.js").JsonMap>>;
    guard: <T>(request: T) => Promise<import("../types.js").GuardDecision>;
    guardMany: <T>(requests: T[]) => Promise<import("../types.js").GuardDecision[]>;
};
export { createReviewFetchHandler } from './fetch.js';

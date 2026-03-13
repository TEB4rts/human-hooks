import type { ReviewActor } from '../types.js';
import { ReviewEngine } from '../engine.js';
export declare function createReviewHttpApi(engine: ReviewEngine): {
    listPending: (queue?: string) => Promise<import("../types.js").ReviewRecord<import("../types.js").JsonMap, import("../types.js").JsonMap>[]>;
    getReview: (id: string) => Promise<import("../types.js").ReviewRecord<import("../types.js").JsonMap, import("../types.js").JsonMap> | null>;
    approve: (id: string, actor: ReviewActor, note?: string) => Promise<import("../types.js").ReviewRecord<import("../types.js").JsonMap, import("../types.js").JsonMap>>;
    reject: (id: string, actor: ReviewActor, note?: string) => Promise<import("../types.js").ReviewRecord<import("../types.js").JsonMap, import("../types.js").JsonMap>>;
    guard: <T>(request: T) => Promise<import("../types.js").GuardDecision>;
};
export { createReviewFetchHandler } from './fetch.js';

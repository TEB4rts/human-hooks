import type { ReviewActor } from '../types.js';
import { ReviewEngine } from '../engine.js';
import { createReviewFetchHandler } from './fetch.js';

export function createReviewHttpApi(engine: ReviewEngine) {
  return {
    listPending: async (queue?: string) => engine.listPending(queue),
    getReview: async (id: string) => engine.getReview(id),
    approve: async (id: string, actor: ReviewActor, note?: string) => engine.approve(id, actor, note),
    reject: async (id: string, actor: ReviewActor, note?: string) => engine.reject(id, actor, note),
    guard: async <T>(request: T) => engine.guard(request as never),
  };
}

export { createReviewFetchHandler } from './fetch.js';

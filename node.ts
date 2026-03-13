import type { ReviewActor } from '../types.js';
import { ReviewEngine } from '../engine.js';
import { createReviewFetchHandler } from './fetch.js';

export function createReviewHttpApi(engine: ReviewEngine) {
  return {
    listPending: async (queue?: string) => engine.listPending(queue),
    listAll: async (queue?: string) => engine.listAll(queue),
    getStats: async (queue?: string) => engine.getStats(queue),
    getReview: async (id: string) => engine.getReview(id),
    approve: async (id: string, actor: ReviewActor, note?: string) => engine.approve(id, actor, note),
    reject: async (id: string, actor: ReviewActor, note?: string) => engine.reject(id, actor, note),
    markExecuted: async (id: string, actor?: ReviewActor, output?: Record<string, unknown>) =>
      engine.markExecuted(id, actor, output as never),
    guard: async <T>(request: T) => engine.guard(request as never),
    guardMany: async <T>(requests: T[]) => engine.guardMany(requests as never),
  };
}

export { createReviewFetchHandler } from './fetch.js';

export function createReviewHttpApi(engine) {
    return {
        listPending: async (queue) => engine.listPending(queue),
        listAll: async (queue) => engine.listAll(queue),
        getStats: async (queue) => engine.getStats(queue),
        getReview: async (id) => engine.getReview(id),
        approve: async (id, actor, note) => engine.approve(id, actor, note),
        reject: async (id, actor, note) => engine.reject(id, actor, note),
        markExecuted: async (id, actor, output) => engine.markExecuted(id, actor, output),
        guard: async (request) => engine.guard(request),
        guardMany: async (requests) => engine.guardMany(requests),
    };
}
export { createReviewFetchHandler } from './fetch.js';

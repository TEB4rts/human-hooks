export function createReviewHttpApi(engine) {
    return {
        listPending: async (queue) => engine.listPending(queue),
        getReview: async (id) => engine.getReview(id),
        approve: async (id, actor, note) => engine.approve(id, actor, note),
        reject: async (id, actor, note) => engine.reject(id, actor, note),
        guard: async (request) => engine.guard(request),
    };
}
export { createReviewFetchHandler } from './fetch.js';

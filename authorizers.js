export function createQueueAuthorizer(options = {}) {
    const queueApprovers = options.queueApprovers ?? {};
    const globalApprovers = new Set(options.globalApprovers ?? []);
    const allowActors = new Set(options.allowActors ?? ['human']);
    return (review, actor) => {
        if (!allowActors.has(actor.type)) {
            return false;
        }
        if (globalApprovers.has(actor.id)) {
            return true;
        }
        const queueList = queueApprovers[review.queue] ?? [];
        return queueList.includes(actor.id);
    };
}

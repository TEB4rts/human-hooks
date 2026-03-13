import type { ReviewActor, ReviewRecord } from './types.js';

export interface QueueAuthorizerOptions {
  queueApprovers?: Record<string, string[]>;
  globalApprovers?: string[];
  allowActors?: ReviewActor['type'][];
}

export function createQueueAuthorizer(options: QueueAuthorizerOptions = {}) {
  const queueApprovers = options.queueApprovers ?? {};
  const globalApprovers = new Set(options.globalApprovers ?? []);
  const allowActors = new Set(options.allowActors ?? ['human']);

  return (review: ReviewRecord, actor: ReviewActor): boolean => {
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

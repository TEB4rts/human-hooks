import type { ReviewRecord, ReviewStore } from '../types.js';
import { jsonClone } from '../utils.js';

export class MemoryReviewStore implements ReviewStore {
  private readonly reviews = new Map<string, ReviewRecord>();

  async create(review: ReviewRecord): Promise<void> {
    this.reviews.set(review.id, jsonClone(review));
  }

  async get(id: string): Promise<ReviewRecord | null> {
    const review = this.reviews.get(id);
    return review ? jsonClone(review) : null;
  }

  async listPending(queue?: string): Promise<ReviewRecord[]> {
    return Array.from(this.reviews.values())
      .filter((review) => review.status === 'pending' && (!queue || review.queue === queue))
      .map((review) => jsonClone(review));
  }

  async put(review: ReviewRecord): Promise<ReviewRecord> {
    this.reviews.set(review.id, jsonClone(review));
    return jsonClone(review);
  }

  async findPendingByFingerprint(fingerprint: string): Promise<ReviewRecord | null> {
    for (const review of this.reviews.values()) {
      if (review.fingerprint === fingerprint && review.status === 'pending') {
        return jsonClone(review);
      }
    }
    return null;
  }
}

export function memoryReviewStore(): ReviewStore {
  return new MemoryReviewStore();
}

import { jsonClone } from '../utils.js';
export class MemoryReviewStore {
    reviews = new Map();
    async create(review) {
        this.reviews.set(review.id, jsonClone(review));
    }
    async get(id) {
        const review = this.reviews.get(id);
        return review ? jsonClone(review) : null;
    }
    async listPending(queue) {
        return Array.from(this.reviews.values())
            .filter((review) => review.status === 'pending' && (!queue || review.queue === queue))
            .map((review) => jsonClone(review));
    }
    async put(review) {
        this.reviews.set(review.id, jsonClone(review));
        return jsonClone(review);
    }
    async findPendingByFingerprint(fingerprint) {
        for (const review of this.reviews.values()) {
            if (review.fingerprint === fingerprint && review.status === 'pending') {
                return jsonClone(review);
            }
        }
        return null;
    }
}
export function memoryReviewStore() {
    return new MemoryReviewStore();
}

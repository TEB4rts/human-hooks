import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ReviewRecord, ReviewStore } from '../types.js';
import { jsonClone } from '../utils.js';

interface FileStoreShape {
  reviews: ReviewRecord[];
}

export class FileReviewStore implements ReviewStore {
  constructor(private readonly filePath: string) {}

  async create(review: ReviewRecord): Promise<void> {
    const db = await this.readDb();
    db.reviews.push(jsonClone(review));
    await this.writeDb(db);
  }

  async get(id: string): Promise<ReviewRecord | null> {
    const db = await this.readDb();
    const review = db.reviews.find((item) => item.id === id);
    return review ? jsonClone(review) : null;
  }

  async listPending(queue?: string): Promise<ReviewRecord[]> {
    const db = await this.readDb();
    return db.reviews
      .filter((review) => review.status === 'pending' && (!queue || review.queue === queue))
      .map((review) => jsonClone(review));
  }

  async listAll(queue?: string): Promise<ReviewRecord[]> {
    const db = await this.readDb();
    return db.reviews
      .filter((review) => !queue || review.queue === queue)
      .map((review) => jsonClone(review));
  }

  async put(review: ReviewRecord): Promise<ReviewRecord> {
    const db = await this.readDb();
    const index = db.reviews.findIndex((item) => item.id === review.id);
    if (index === -1) {
      db.reviews.push(jsonClone(review));
    } else {
      db.reviews[index] = jsonClone(review);
    }
    await this.writeDb(db);
    return jsonClone(review);
  }

  async findPendingByFingerprint(fingerprint: string): Promise<ReviewRecord | null> {
    const db = await this.readDb();
    const review = db.reviews.find((item) => item.fingerprint === fingerprint && item.status === 'pending');
    return review ? jsonClone(review) : null;
  }

  private async readDb(): Promise<FileStoreShape> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as FileStoreShape;
      if (!Array.isArray(parsed.reviews)) {
        return { reviews: [] };
      }
      return parsed;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        return { reviews: [] };
      }
      throw error;
    }
  }

  private async writeDb(db: FileStoreShape): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(db, null, 2), 'utf8');
    await rename(tempPath, this.filePath);
  }
}

export function fileReviewStore(filePath: string): ReviewStore {
  return new FileReviewStore(filePath);
}

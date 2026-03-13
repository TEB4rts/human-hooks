import type { FetchHandlerOptions } from '../types.js';
import { ReviewEngine } from '../engine.js';
export declare function createReviewFetchHandler(engine: ReviewEngine, options?: FetchHandlerOptions): (request: Request) => Promise<Response>;

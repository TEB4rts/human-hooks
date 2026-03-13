import type { JsonMap, ReviewRecord } from './types.js';
export interface ReviewSummary {
    title: string;
    subtitle: string;
    markdown: string;
    facts: JsonMap;
}
export declare function buildReviewSummary(review: ReviewRecord): ReviewSummary;

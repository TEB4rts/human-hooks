import type { SignedReviewTokenPayload } from './types.js';
export declare function createSignedReviewToken(payload: SignedReviewTokenPayload, secret: string): string;
export declare function verifySignedReviewToken(token: string, secret: string): SignedReviewTokenPayload;

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SignedReviewTokenPayload } from './types.js';

function base64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function fromBase64url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function signature(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function createSignedReviewToken(payload: SignedReviewTokenPayload, secret: string): string {
  const body = base64url(JSON.stringify(payload));
  const sig = signature(body, secret);
  return `${body}.${sig}`;
}

export function verifySignedReviewToken(token: string, secret: string): SignedReviewTokenPayload {
  const [body, providedSig] = token.split('.');
  if (!body || !providedSig) {
    throw new Error('Invalid token format.');
  }

  const expectedSig = signature(body, secret);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Invalid token signature.');
  }

  const payload = JSON.parse(fromBase64url(body)) as SignedReviewTokenPayload;
  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired.');
  }

  return payload;
}

export function createSignedReviewActionLink(
  baseUrl: string,
  payload: SignedReviewTokenPayload,
  secret: string,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('token', createSignedReviewToken(payload, secret));
  url.searchParams.set('reviewId', payload.reviewId);
  url.searchParams.set('action', payload.action);
  return url.toString();
}

import type { FetchHandlerOptions, GuardDecision, ReviewActor } from '../types.js';
import { ReviewEngine } from '../engine.js';
import { verifySignedReviewToken } from '../tokens.js';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function badRequest(message: string, status = 400): Response {
  return json({ error: message }, status);
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return await request.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

function actorFromBody(body: Record<string, unknown>): ReviewActor {
  const actor = body.actor as Record<string, unknown> | undefined;
  if (!actor?.id || !actor?.type) {
    throw new Error('actor.id and actor.type are required.');
  }

  return {
    id: String(actor.id),
    type: actor.type as ReviewActor['type'],
    name: typeof actor.name === 'string' ? actor.name : undefined,
  };
}

export function createReviewFetchHandler(engine: ReviewEngine, options: FetchHandlerOptions = {}) {
  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const segments = path.split('/').filter(Boolean);

    if (request.method === 'GET' && path === '/reviews') {
      const queue = url.searchParams.get('queue') ?? undefined;
      return json(await engine.listPending(queue));
    }

    if (request.method === 'POST' && path === '/guard') {
      const body = await readJson(request);
      const decision = await engine.guard(body as never) as GuardDecision;
      return json(decision, decision.status === 'needs_review' ? 202 : 200);
    }

    if (segments[0] === 'reviews' && segments[1] && request.method === 'GET' && segments.length === 2) {
      const review = await engine.getReview(segments[1]);
      return review ? json(review) : badRequest('Review not found.', 404);
    }

    if (segments[0] === 'reviews' && segments[1] && request.method === 'POST' && segments[2] === 'approve') {
      const body = await readJson(request);
      const actor = body.token && options.tokenSecret
        ? tokenActor(body.token as string, 'approve', segments[1], options.tokenSecret)
        : actorFromBody(body);
      const review = await engine.approve(segments[1], actor, typeof body.note === 'string' ? body.note : undefined);
      return json(review, review.status === 'pending' ? 202 : 200);
    }

    if (segments[0] === 'reviews' && segments[1] && request.method === 'POST' && segments[2] === 'reject') {
      const body = await readJson(request);
      const actor = body.token && options.tokenSecret
        ? tokenActor(body.token as string, 'reject', segments[1], options.tokenSecret)
        : actorFromBody(body);
      const review = await engine.reject(segments[1], actor, typeof body.note === 'string' ? body.note : undefined);
      return json(review);
    }

    return badRequest('Route not found.', 404);
  };
};

function tokenActor(token: string, action: 'approve' | 'reject', reviewId: string, secret: string): ReviewActor {
  const payload = verifySignedReviewToken(token, secret);
  if (payload.action !== action || payload.reviewId !== reviewId) {
    throw new Error('Token does not match review/action.');
  }

  return {
    id: payload.actorId ?? `token-${action}`,
    type: 'human',
  };
}

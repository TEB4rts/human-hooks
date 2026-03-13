import type { FetchHandlerOptions, GuardDecision, ReviewActor, ReviewRecord } from '../types.js';
import { ReviewEngine } from '../engine.js';
import { normalizeGuardRequest } from '../adapters/universal.js';
import { verifySignedReviewToken } from '../tokens.js';
import { createInboxHtml } from './inbox.js';
import { buildReviewSummary } from '../summary.js';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
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

function filterReviews(reviews: ReviewRecord[], status?: string): ReviewRecord[] {
  if (!status || status === 'all') {
    return reviews;
  }
  return reviews.filter((review) => review.status === status);
}

export function createReviewFetchHandler(engine: ReviewEngine, options: FetchHandlerOptions = {}) {
  return async function handle(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const segments = path.split('/').filter(Boolean);

      if (request.method === 'GET' && (path === '/' || path === '/app')) {
        return html(createInboxHtml({ title: options.appTitle ?? 'human-hooks inbox' }));
      }

      if (request.method === 'GET' && path === '/reviews') {
        const queue = url.searchParams.get('queue') ?? undefined;
        const status = url.searchParams.get('status') ?? 'pending';
        const items = status === 'pending'
          ? await engine.listPending(queue)
          : filterReviews(await engine.listAll(queue), status);
        return json({ items });
      }

      if (request.method === 'GET' && path === '/stats') {
        const queue = url.searchParams.get('queue') ?? undefined;
        return json(await engine.getStats(queue));
      }

      if (request.method === 'POST' && path === '/guard') {
        const body = await readJson(request);
        const providerHint = typeof body.providerHint === 'string' ? body.providerHint : undefined;
        const decision = await engine.guard(normalizeGuardRequest(body, { provider: providerHint as never })) as GuardDecision;
        return json(decision, decision.status === 'needs_review' ? 202 : 200);
      }

      if (request.method === 'POST' && path === '/guard/batch') {
        const body = await readJson(request);
        const items = Array.isArray(body.items) ? body.items : [];
        const decisions = await engine.guardMany(items.map((item) => normalizeGuardRequest(item as Record<string, unknown>)));
        const status = decisions.some((decision) => decision.status === 'needs_review') ? 202 : 200;
        return json({ items: decisions }, status);
      }

      if (segments[0] === 'reviews' && segments[1] && request.method === 'GET' && segments.length === 2) {
        const review = await engine.getReview(segments[1]);
        return review ? json(review) : badRequest('Review not found.', 404);
      }

      if (segments[0] === 'reviews' && segments[1] && request.method === 'GET' && segments[2] === 'summary') {
        const review = await engine.getReview(segments[1]);
        return review ? json(buildReviewSummary(review)) : badRequest('Review not found.', 404);
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

      if (segments[0] === 'reviews' && segments[1] && request.method === 'POST' && segments[2] === 'execute') {
        const body = await readJson(request);
        const actor = body.actor ? actorFromBody(body) : undefined;
        const output = (body.output && typeof body.output === 'object') ? body.output as Record<string, unknown> : undefined;
        const review = await engine.markExecuted(segments[1], actor, output as never);
        return json(review);
      }

      return badRequest('Route not found.', 404);
    } catch (error) {
      return badRequest((error as Error).message, 400);
    }
  };
}

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

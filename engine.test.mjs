import test from 'node:test';
import assert from 'node:assert/strict';

import {
  amountAbove,
  createReviewEngine,
  createReviewFetchHandler,
  createSignedReviewToken,
  fileReviewStore,
  fromBotAutomation,
  fromClaudeToolUse,
  fromN8nItem,
  memoryEventSink,
  memoryReviewStore,
  policy,
  verifySignedReviewToken,
} from '../dist/index.js';

function fixedNow(iso) {
  return () => new Date(iso);
}

test('creates a review for a risky action', async () => {
  const engine = createReviewEngine({
    store: memoryReviewStore(),
    policies: [
      policy({
        name: 'high-value',
        queue: 'finance',
        severity: 'high',
        score: 40,
        reason: 'Needs review.',
        when: amountAbove(100),
      }),
    ],
    now: fixedNow('2026-03-13T00:00:00.000Z'),
  });

  const decision = await engine.guard({
    action: 'refund.create',
    actor: { id: 'agent-1', type: 'agent' },
    payload: { amount: 150 },
  });

  assert.equal(decision.status, 'needs_review');
  assert.equal(decision.review.queue, 'finance');
  assert.equal(decision.review.riskScore, 40);
  assert.equal(decision.review.severity, 'high');
});

test('dedupes repeated risky requests using fingerprint', async () => {
  const sink = memoryEventSink();
  const engine = createReviewEngine({
    store: memoryReviewStore(),
    eventSink: sink,
    policies: [
      policy({
        name: 'high-value',
        queue: 'finance',
        severity: 'high',
        score: 40,
        reason: 'Needs review.',
        when: amountAbove(100),
      }),
    ],
  });

  const request = {
    action: 'refund.create',
    actor: { id: 'agent-1', type: 'agent' },
    payload: { amount: 150 },
  };

  const first = await engine.guard(request);
  const second = await engine.guard(request);

  assert.equal(first.status, 'needs_review');
  assert.equal(second.status, 'needs_review');
  assert.equal(first.review.id, second.review.id);
  assert.equal(second.reused, true);
  assert.equal(sink.events.some((event) => event.type === 'review.reused'), true);
});

test('supports dual approval and execution marking', async () => {
  const engine = createReviewEngine({
    store: memoryReviewStore(),
    policies: [
      policy({
        name: 'wire-transfer',
        queue: 'finance',
        severity: 'critical',
        score: 90,
        requiredApprovals: 2,
        reason: 'Dual approval required.',
        when: amountAbove(500),
      }),
    ],
  });

  const decision = await engine.guard({
    action: 'wire.send',
    actor: { id: 'agent-1', type: 'agent' },
    payload: { amount: 2000 },
  });

  assert.equal(decision.status, 'needs_review');
  const first = await engine.approve(decision.review.id, { id: 'alice', type: 'human' }, 'Looks okay');
  assert.equal(first.status, 'pending');
  const second = await engine.approve(decision.review.id, { id: 'bob', type: 'human' }, 'Approved');
  assert.equal(second.status, 'approved');
  const executed = await engine.markExecuted(decision.review.id, { id: 'system', type: 'service' }, { ok: true });
  assert.equal(executed.status, 'executed');
  assert.deepEqual(executed.execution?.output, { ok: true });
});

test('expires stale reviews', async () => {
  const engine = createReviewEngine({
    store: memoryReviewStore(),
    policies: [
      policy({
        name: 'short-lived',
        queue: 'ops',
        severity: 'medium',
        score: 10,
        expiresInMs: 1000,
        reason: 'Only valid briefly.',
        when: amountAbove(1),
      }),
    ],
    now: fixedNow('2026-03-13T00:00:00.000Z'),
  });

  const decision = await engine.guard({
    action: 'job.run',
    actor: { id: 'agent-1', type: 'agent' },
    payload: { amount: 2 },
  });

  assert.equal(decision.status, 'needs_review');

  const laterEngine = createReviewEngine({
    store: engine['store'],
    policies: [],
    now: fixedNow('2026-03-13T00:00:02.000Z'),
  });

  const review = await laterEngine.getReview(decision.review.id);
  assert.equal(review?.status, 'expired');
});

test('signed tokens work with fetch handler approval flow', async () => {
  const engine = createReviewEngine({
    store: memoryReviewStore(),
    policies: [
      policy({
        name: 'high-value',
        queue: 'finance',
        severity: 'high',
        score: 40,
        reason: 'Needs review.',
        when: amountAbove(100),
      }),
    ],
  });

  const decision = await engine.guard({
    action: 'refund.create',
    actor: { id: 'agent-1', type: 'agent' },
    payload: { amount: 150 },
  });

  assert.equal(decision.status, 'needs_review');

  const token = createSignedReviewToken({
    reviewId: decision.review.id,
    action: 'approve',
    actorId: 'esteban',
  }, 'secret');

  const payload = verifySignedReviewToken(token, 'secret');
  assert.equal(payload.reviewId, decision.review.id);

  const handler = createReviewFetchHandler(engine, { tokenSecret: 'secret' });
  const response = await handler(new Request(`https://example.com/reviews/${decision.review.id}/approve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  }));

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'approved');
});

test('file store persists reviews', async () => {
  const filePath = new URL('./tmp-reviews.json', import.meta.url).pathname;
  const store = fileReviewStore(filePath);
  const engine = createReviewEngine({
    store,
    policies: [
      policy({
        name: 'high-value',
        queue: 'finance',
        severity: 'high',
        score: 40,
        reason: 'Needs review.',
        when: amountAbove(100),
      }),
    ],
  });

  const decision = await engine.guard({
    action: 'refund.create',
    actor: { id: 'agent-1', type: 'agent' },
    payload: { amount: 150 },
  });

  assert.equal(decision.status, 'needs_review');
  const stored = await store.get(decision.review.id);
  assert.equal(stored?.id, decision.review.id);
});

test('adapters normalize external tool shapes', async () => {
  const claude = fromClaudeToolUse({
    toolName: 'issue_refund',
    input: { amount: 10 },
    sessionId: 'sess1',
    messageId: 'msg1',
  });
  assert.equal(claude.provider, 'claude');
  assert.equal(claude.action, 'tool.issue_refund');

  const n8n = fromN8nItem({
    json: { action: 'email.send', actorId: 'wf1', confidence: 0.4, payload: { amount: 10 } },
  });
  assert.equal(n8n.provider, 'n8n');
  assert.equal(n8n.meta?.confidence, 0.4);

  const bot = fromBotAutomation({
    botName: 'clawdbot',
    task: 'repo.delete_branch',
    payload: { branch: 'test' },
    runId: 'run1',
  });
  assert.equal(bot.provider, 'clawdbot');
  assert.equal(bot.idempotencyKey, 'run1');
});

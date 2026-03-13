import test from 'node:test';
import assert from 'node:assert/strict';

import {
  amountAbove,
  buildReviewSummary,
  createQueueAuthorizer,
  createReviewEngine,
  createReviewFetchHandler,
  createSignedReviewActionLink,
  createSignedReviewToken,
  createUniversalValidationPolicies,
  fileReviewStore,
  fromBotAutomation,
  fromClaudeToolUse,
  fromGeminiFunctionCall,
  fromN8nItem,
  fromWorkflowStep,
  memoryEventSink,
  memoryReviewStore,
  normalizeGuardRequest,
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
  assert.equal(decision.review.history[0].type, 'review.created');
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
  assert.deepEqual(executed.history.map((entry) => entry.type), [
    'review.created',
    'review.approval_recorded',
    'review.approval_recorded',
    'review.approved',
    'review.executed',
  ]);
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

test('signed tokens and links work with fetch handler approval flow', async () => {
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

  const link = createSignedReviewActionLink('https://approvals.example.com/review', {
    reviewId: decision.review.id,
    action: 'approve',
    actorId: 'esteban',
  }, 'secret');
  assert.equal(link.includes('token='), true);

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

test('adapters normalize diverse external tool shapes', async () => {
  const claude = fromClaudeToolUse({
    toolName: 'issue_refund',
    input: { amount: 10 },
    sessionId: 'sess1',
    messageId: 'msg1',
  });
  assert.equal(claude.provider, 'claude');
  assert.equal(claude.action, 'tool.issue_refund');

  const gemini = fromGeminiFunctionCall({
    name: 'send_email',
    args: { recipientCount: 2 },
    invocationId: 'inv1',
  });
  assert.equal(gemini.provider, 'gemini');

  const n8n = fromN8nItem({
    json: { action: 'email.send', actorId: 'wf1', confidence: 0.4, payload: { amount: 10 } },
  });
  assert.equal(n8n.provider, 'n8n');
  assert.equal(n8n.meta?.confidence, 0.4);

  const bot = fromBotAutomation({
    botName: 'clawdbot',
    task: 'repo.delete_branch',
    payload: { branch: 'stale-1' },
    confidence: 0.91,
  });
  assert.equal(bot.provider, 'clawdbot');

  const workflow = fromWorkflowStep({
    provider: 'make',
    stepName: 'crm.update',
    payload: { id: '1' },
    runId: 'run1',
  });
  assert.equal(workflow.provider, 'make');

  const auto = normalizeGuardRequest({
    name: 'send_email',
    args: { recipientEmail: 'x@example.com' },
    invocationId: 'inv2',
  });
  assert.equal(auto.provider, 'gemini');
});

test('universal validation policies catch non-financial risky actions', async () => {
  const engine = createReviewEngine({
    store: memoryReviewStore(),
    policies: createUniversalValidationPolicies({
      corporateDomains: ['example.com'],
      confidenceThreshold: 0.8,
    }),
  });

  const decision = await engine.guard({
    action: 'email.send',
    actor: { id: 'agent-1', type: 'agent' },
    provider: 'openai',
    payload: { recipientEmail: 'outside@gmail.com', recipientCount: 2 },
    meta: { confidence: 0.5 },
    tags: ['external', 'production'],
  });

  assert.equal(decision.status, 'needs_review');
  assert.equal(decision.review.policyNames.includes('external-communication'), true);
  assert.equal(decision.review.policyNames.includes('low-confidence'), true);
  assert.equal(decision.review.policyNames.includes('production-or-pii'), true);
});

test('queue authorizer restricts approvals to allowed actors', async () => {
  const engine = createReviewEngine({
    store: memoryReviewStore(),
    policies: [
      policy({
        name: 'security-change',
        queue: 'security',
        severity: 'critical',
        score: 50,
        reason: 'Sensitive.',
        when: amountAbove(1),
      }),
    ],
    reviewerAuthorizer: createQueueAuthorizer({
      queueApprovers: { security: ['alice'] },
      globalApprovers: ['owner'],
    }),
  });

  const decision = await engine.guard({
    action: 'secret.rotate',
    actor: { id: 'agent', type: 'agent' },
    payload: { amount: 2 },
  });

  await assert.rejects(
    () => engine.approve(decision.review.id, { id: 'mallory', type: 'human' }),
    /not allowed/,
  );

  const approved = await engine.approve(decision.review.id, { id: 'alice', type: 'human' });
  assert.equal(approved.status, 'approved');
});

test('fetch handler serves inbox ui and summary endpoints', async () => {
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

  const handler = createReviewFetchHandler(engine, { appTitle: 'Inbox Beast' });
  const appResponse = await handler(new Request('https://example.com/app'));
  assert.equal(appResponse.status, 200);
  assert.match(await appResponse.text(), /Inbox Beast/);

  const reviewsResponse = await handler(new Request('https://example.com/reviews?status=all'));
  assert.equal(reviewsResponse.status, 200);
  const reviewsBody = await reviewsResponse.json();
  assert.equal(Array.isArray(reviewsBody.items), true);

  const summaryResponse = await handler(new Request(`https://example.com/reviews/${decision.review.id}/summary`));
  const summary = await summaryResponse.json();
  assert.match(summary.markdown, /refund.create/);

  const built = buildReviewSummary(decision.review);
  assert.match(built.markdown, /Needs review/);
});

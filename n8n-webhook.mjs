import {
  confidenceBelow,
  createReviewEngine,
  fromN8nItem,
  memoryReviewStore,
  policy,
  toN8nReviewResponse,
} from '../dist/index.js';

const engine = createReviewEngine({
  store: memoryReviewStore(),
  policies: [
    policy({
      name: 'uncertain-email-send',
      queue: 'marketing',
      severity: 'medium',
      score: 25,
      reason: 'Low confidence email send requires review.',
      when: confidenceBelow(0.7),
    }),
  ],
});

const request = fromN8nItem({
  json: {
    action: 'email.send',
    actorId: 'workflow_marketing_1',
    confidence: 0.62,
    payload: {
      subject: 'Launch blast',
      recipientCount: 10000,
    },
  },
});

const decision = await engine.guard(request);
if (decision.status === 'needs_review') {
  console.log(JSON.stringify(toN8nReviewResponse(decision.review.id), null, 2));
} else {
  console.log(JSON.stringify(decision, null, 2));
}

import {
  amountAbove,
  confidenceBelow,
  createReviewEngine,
  fileReviewStore,
  policy,
} from '../dist/index.js';

const engine = createReviewEngine({
  store: fileReviewStore(new URL('./basic-reviews.json', import.meta.url).pathname),
  defaultQueue: 'ops',
  policies: [
    policy({
      name: 'high-value-refund',
      queue: 'finance',
      severity: 'high',
      score: 40,
      reason: 'Refund amount is above the automatic threshold.',
      when: amountAbove(100),
    }),
    policy({
      name: 'low-confidence',
      queue: 'ops',
      severity: 'medium',
      score: 15,
      reason: 'The model is not confident enough for automatic execution.',
      when: confidenceBelow(0.8),
    }),
  ],
});

const decision = await engine.guard({
  action: 'refund.create',
  actor: { id: 'agent_support_1', type: 'agent' },
  provider: 'claude',
  payload: { amount: 180, currency: 'USD' },
  meta: { confidence: 0.72 },
  tags: ['refund'],
});

console.log(JSON.stringify(decision, null, 2));

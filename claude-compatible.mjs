import {
  amountAbove,
  createReviewEngine,
  fromClaudeToolUse,
  memoryReviewStore,
  policy,
} from '../dist/index.js';

const engine = createReviewEngine({
  store: memoryReviewStore(),
  policies: [
    policy({
      name: 'high-spend',
      queue: 'finance',
      severity: 'high',
      score: 60,
      requiredApprovals: 2,
      reason: 'Spending above threshold requires dual approval.',
      when: amountAbove(500),
    }),
  ],
});

const request = fromClaudeToolUse({
  toolName: 'issue_refund',
  input: { amount: 650, currency: 'USD' },
  confidence: 0.91,
  sessionId: 'sess_123',
  messageId: 'msg_123',
});

const decision = await engine.guard(request);
console.log(JSON.stringify(decision, null, 2));

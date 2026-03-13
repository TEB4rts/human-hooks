import {
  amountAbove,
  createReviewEngine,
  memoryReviewStore,
  policy,
} from '../dist/index.js';

const engine = createReviewEngine({
  store: memoryReviewStore(),
  policies: [
    policy({
      name: 'large-payout',
      queue: 'finance',
      reason: 'Large payouts need a human check.',
      when: amountAbove(500),
    }),
  ],
});

const payout = engine.wrapAction({
  action: 'payout.send',
  buildRequest: (input) => ({
    action: 'payout.send',
    actor: { id: 'agent_finance_1', type: 'agent', name: 'Finance Agent' },
    payload: input,
    meta: { confidence: 0.97 },
    resource: { type: 'bank_account', id: input.destination },
  }),
  execute: async (input) => {
    return {
      ok: true,
      transferId: `tr_${input.destination}`,
      sentAmount: input.amount,
    };
  },
});

console.log(await payout.run({ amount: 25, destination: 'acct_small' }));
console.log(await payout.run({ amount: 700, destination: 'acct_large' }));

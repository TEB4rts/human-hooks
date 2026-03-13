# human-hooks

**Pause before damage.**

`human-hooks` is a provider-neutral approval and policy engine for AI tools, agents, workflow automations, and tomorrow's weird little software goblins.

It is built to sit at the **decision boundary** between:

- an AI system that wants to do something
- a human who may need to review it
- a real-world system that can be damaged by a bad action

That makes it useful for:

- Claude-compatible tool use
- OpenAI-style tool runners
- n8n workflows
- bot automations like Clawdbot or Moltbot
- queue workers
- backend APIs
- anything else that can normalize actions into a `GuardRequest`

## What is new in this version

- durable **file-backed review store**
- **multi-approver** workflows
- **risk scoring** and severity levels
- **deduping** via request fingerprinting
- **expiry / SLA** support for stale reviews
- **signed approval tokens** for links or external UIs
- **event sinks** and signed webhooks
- **fetch-native API handler** for workers, Next, Bun, Hono, or Node
- adapters for **Claude-compatible**, **n8n**, and generic bot automation envelopes

## Install

```bash
npm install human-hooks
```

## Core idea

Your runtime stays yours.

`human-hooks` does **not** try to become the model provider, the orchestrator, or the giant monolith from framework heaven. It stays thin.

1. your tool runner decides it wants to act
2. you normalize the action to a `GuardRequest`
3. `human-hooks` evaluates policies
4. the action either executes or pauses for approval
5. when approved, your runtime resumes the action however you want

That design is what keeps it future-proof.

## Quick start

```ts
import {
  amountAbove,
  confidenceBelow,
  createReviewEngine,
  fileReviewStore,
  policy,
} from 'human-hooks';

const engine = createReviewEngine({
  store: fileReviewStore('./data/reviews.json'),
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

if (decision.status === 'needs_review') {
  console.log(decision.review.id, decision.review.riskScore, decision.review.severity);
}
```

## Multi-approver review

```ts
import { amountAbove, createReviewEngine, memoryReviewStore, policy } from 'human-hooks';

const engine = createReviewEngine({
  store: memoryReviewStore(),
  policies: [
    policy({
      name: 'wire-transfer',
      queue: 'finance',
      severity: 'critical',
      score: 80,
      requiredApprovals: 2,
      reason: 'Wire transfer requires dual approval.',
      when: amountAbove(1000),
    }),
  ],
});
```

The first approval records progress. The second one finalizes the review.

## Signed approval links

```ts
import { createSignedReviewToken } from 'human-hooks';

const token = createSignedReviewToken(
  {
    reviewId: 'review_123',
    action: 'approve',
    actorId: 'esteban',
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  process.env.HUMAN_HOOKS_SECRET,
);
```

That token can be posted into Slack, email, or any internal UI and verified later by the fetch handler.

## Fetch-native API

```ts
import { createReviewEngine, createReviewFetchHandler, memoryReviewStore } from 'human-hooks';

const engine = createReviewEngine({
  store: memoryReviewStore(),
  policies: [],
});

const handler = createReviewFetchHandler(engine, {
  tokenSecret: process.env.HUMAN_HOOKS_SECRET,
});

export default {
  fetch: handler,
};
```

Routes:

- `GET /reviews`
- `GET /reviews/:id`
- `POST /guard`
- `POST /reviews/:id/approve`
- `POST /reviews/:id/reject`

## Claude-compatible example

```ts
import { createReviewEngine, fromClaudeToolUse, memoryReviewStore, policy, amountAbove } from 'human-hooks';

const engine = createReviewEngine({
  store: memoryReviewStore(),
  policies: [
    policy({
      name: 'high-spend',
      queue: 'finance',
      severity: 'high',
      score: 50,
      reason: 'Spending above threshold requires review.',
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
```

## n8n example

```ts
import { createReviewEngine, fromN8nItem, toN8nReviewResponse } from 'human-hooks';

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
  return [toN8nReviewResponse(decision.review.id)];
}
```

## Bot automation example

This is the generic adapter for custom bots, including setups shaped like Clawdbot or Moltbot:

```ts
import { fromBotAutomation } from 'human-hooks';

const request = fromBotAutomation({
  botName: 'clawdbot',
  task: 'repo.delete_branch',
  payload: { repo: 'team/app', branch: 'legacy-prod' },
  confidence: 0.77,
  runId: 'run_001',
  tags: ['repo', 'destructive'],
});
```

## Event sinks and webhooks

```ts
import { createEventFanout, createReviewEngine, memoryEventSink, webhookEventSink } from 'human-hooks';

const engine = createReviewEngine({
  store: memoryReviewStore(),
  eventSink: createEventFanout(
    memoryEventSink(),
    webhookEventSink({
      url: 'https://example.com/review-events',
      secret: process.env.HUMAN_HOOKS_SECRET,
    }),
  ),
  policies: [],
});
```

Emitted events include:

- `review.created`
- `review.reused`
- `review.approval_recorded`
- `review.approved`
- `review.rejected`
- `review.expired`
- `review.executed`

## Suggested architecture for a serious product

```text
packages/
  core/
  adapters/
    claude/
    openai/
    n8n/
    bots/
  ui/
    react/
    web/
  workers/
    webhooks/
```

## What still belongs on the roadmap

- Postgres / Redis production stores
- React approval inbox
- Slack / Discord action cards
- policy pack marketplace
- replay + resume helpers for agent runtimes
- signed audit export for compliance
- MCP server wrapper

## Development

```bash
npm run check
npm test
npm run build
npm run example:basic
npm run example:claude
npm run example:n8n
```

## License

MIT

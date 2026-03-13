# human-hooks

**Pause before damage. Approve before regret.**

`human-hooks` is a universal **validation, approval, and audit layer** for AI tools, automations, bots, workflow engines, and future agent runtimes.

It is built to sit at the dangerous seam where software moves from **thinking** to **doing**:

- spending money
- publishing content
- changing permissions
- touching production
- exporting data
- changing code or infrastructure
- contacting real humans
- handling secrets, contracts, or regulated surfaces

That makes it useful not just for finance, but for almost any project where an AI or automation may need validation before acting.

## Why it exists

Every team is building automations now. Very few teams have a clean, reusable way to answer:

- Should this action be blocked, approved, or allowed?
- Who needs to review it?
- How risky is it?
- Can we prove what happened later?
- Can this work across Claude, OpenAI-style tools, MCP, n8n, bots, and whatever weird workflow creature shows up next?

`human-hooks` is the answer to that seam.

## What is in v0.4

- provider-neutral **review engine**
- universal **validation policies** for money, access, secrets, data export, destructive actions, legal surfaces, publishing, infra changes, and production risk
- **multi-approver** workflows, expiry, deduping, signed approval links, and audit history
- durable **memory** and **file-backed** stores
- **event sinks**, webhook fanout, and signed webhooks
- **fetch-native API** for workers, Bun, Next, Hono, Node, or serverless runtimes
- lightweight **approval inbox UI** at `/app`
- adapters for **Claude-compatible**, **OpenAI-compatible**, **Gemini-style**, **MCP**, **LangChain**, **n8n**, **workflow tools**, and generic bots
- role/queue-aware **reviewer authorizer** helper
- clean summaries for inboxes, dashboards, Slack posts, or internal tools

## What this is good for

This library is intentionally broad. It is designed to become a default component in projects that need human validation.

### Common use cases

- AI support agents issuing refunds, credits, or account changes
- AI copilots drafting and sending external emails or bulk messages
- workflow tools posting to Slack, CRMs, webhooks, or email platforms
- bots rotating keys, changing secrets, or touching vaults
- automations exporting customer or employee data
- deploy/release bots touching production or schema migrations
- internal tooling that needs a review queue and audit trail
- content publishing pipelines that must pause before going public
- regulated or compliance-heavy systems that need sign-off evidence

## Install

```bash
npm install human-hooks
```

## Quick start

```ts
import {
  createReviewEngine,
  createUniversalValidationPolicies,
  fileReviewStore,
} from 'human-hooks';

const engine = createReviewEngine({
  store: fileReviewStore('./data/reviews.json'),
  policies: createUniversalValidationPolicies({
    spendThreshold: 250,
    confidenceThreshold: 0.82,
    bulkRecipientThreshold: 2000,
    corporateDomains: ['yourcompany.com'],
  }),
});

const decision = await engine.guard({
  action: 'email.send',
  actor: { id: 'agent_support_1', type: 'agent' },
  provider: 'claude',
  payload: {
    recipientEmail: 'customer@gmail.com',
    subject: 'Account update',
    body: '...',
  },
  meta: { confidence: 0.71 },
  tags: ['external'],
});

if (decision.status === 'needs_review') {
  console.log(decision.review.id, decision.review.queue, decision.review.severity);
}
```

## Universal policy packs

Use the included preset pack when you want a solid default for real projects.

```ts
import { createUniversalValidationPolicies } from 'human-hooks';

const policies = createUniversalValidationPolicies({
  spendThreshold: 500,
  confidenceThreshold: 0.8,
  bulkRecipientThreshold: 1000,
  exportRecordThreshold: 1000,
  corporateDomains: ['example.com'],
});
```

Included validation categories:

- large spend / money movement
- low-confidence actions
- bulk outreach
- destructive operations
- production + PII
- permission / access changes
- secrets / credentials / key material
- external communication
- bulk data export
- code / infra / database mutations
- legal / policy / compliance surfaces

## Provider adapters

You can use specific adapters or auto-detect with `normalizeGuardRequest()`.

Supported adapter entry points:

- `fromClaudeToolUse()`
- `fromOpenAIToolCall()`
- `fromGeminiFunctionCall()`
- `fromMcpToolCall()`
- `fromLangChainAction()`
- `fromN8nItem()`
- `fromWorkflowStep()` for Make, Zapier, Pipedream-style steps
- `fromBotAutomation()` for custom bots such as Clawdbot/Moltbot-style automation envelopes
- `fromToolEnvelope()` for generic normalized inputs
- `normalizeGuardRequest()` for mixed environments

## Approval inbox UI

The fetch handler now serves a minimal review UI at `/app`.

```ts
import {
  createQueueAuthorizer,
  createReviewEngine,
  createReviewFetchHandler,
  createUniversalValidationPolicies,
  fileReviewStore,
} from 'human-hooks';

const engine = createReviewEngine({
  store: fileReviewStore('./data/reviews.json'),
  policies: createUniversalValidationPolicies({
    corporateDomains: ['example.com'],
  }),
  reviewerAuthorizer: createQueueAuthorizer({
    globalApprovers: ['owner'],
    queueApprovers: {
      security: ['security-lead'],
      finance: ['finance-lead'],
    },
  }),
});

export default {
  fetch: createReviewFetchHandler(engine, {
    tokenSecret: process.env.HUMAN_HOOKS_SECRET,
    appTitle: 'human-hooks inbox',
  }),
};
```

Routes:

- `GET /app`
- `GET /reviews?status=pending|all|approved|rejected|executed|expired`
- `GET /reviews/:id`
- `GET /reviews/:id/summary`
- `GET /stats`
- `POST /guard`
- `POST /guard/batch`
- `POST /reviews/:id/approve`
- `POST /reviews/:id/reject`
- `POST /reviews/:id/execute`

## Role-aware approver rules

```ts
import { createQueueAuthorizer } from 'human-hooks';

const reviewerAuthorizer = createQueueAuthorizer({
  globalApprovers: ['owner'],
  queueApprovers: {
    security: ['alice'],
    finance: ['bob'],
    communications: ['carol'],
  },
});
```

## Examples

- `npm run example:basic`
- `npm run example:claude`
- `npm run example:n8n`
- `npm run example:universal`
- `npm run example:inbox`

## Ownership and liability notes

This repository is already set up with:

- your ownership in the copyright notice
- an MIT license with an **"AS IS"** warranty disclaimer and limitation of liability language
- contributor and security docs
- template legal notes for hosted-service use

Important reality check: no open-source license or README spell can guarantee total future liability immunity in every jurisdiction or deployment model. It does, however, give you the standard warranty/liability disclaimer most software projects use. If you plan to run this as a hosted service or sell it to customers, you should add proper terms of service and have a lawyer review them.

See:

- `LICENSE`
- `docs/legal-ownership-and-risk.md`
- `docs/hosted-service-terms-template.md`
- `SECURITY.md`
- `CONTRIBUTING.md`

## License

MIT

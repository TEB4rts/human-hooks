# integration playbook

## Recommended deployment shape

1. Normalize every risky agent/tool action into a `GuardRequest`.
2. Call `engine.guard()` before the side effect happens.
3. If the decision is `needs_review`, send the review to a queue, inbox, Slack message, or internal UI.
4. Approve or reject through the fetch API or direct engine methods.
5. After the underlying action runs, call `markExecuted()` for a full audit trail.

## Adapter matrix

- `fromClaudeToolUse()` for Claude-style tool envelopes
- `fromOpenAIToolCall()` for OpenAI-compatible tool runners
- `fromMcpToolCall()` for MCP clients and tool servers
- `fromLangChainAction()` for LangChain or LangGraph nodes
- `fromN8nItem()` for n8n workflows
- `fromBotAutomation()` for custom bots such as Clawdbot or Moltbot-like systems
- `normalizeGuardRequest()` when you want auto-detection

## Safe tagging strategy

Use request tags aggressively. They are cheap and useful.

Suggested tags:

- `production`
- `destructive`
- `pii`
- `finance`
- `public-facing`
- `customer-impacting`
- `irreversible`

## Approval UX tips

- Show the review summary, not raw JSON first.
- Put the raw request below an expandable section.
- Include one-click approve/reject links using signed review tokens.
- Surface queue, severity, risk score, and triggered policies prominently.
- Keep approvals fast. A slow approval system teaches engineers to route around it.

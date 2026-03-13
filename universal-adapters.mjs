import {
  buildReviewSummary,
  createFutureProofPolicies,
  createReviewEngine,
  memoryReviewStore,
  normalizeGuardRequest,
} from '../dist/index.js';

const engine = createReviewEngine({
  store: memoryReviewStore(),
  policies: createFutureProofPolicies({
    spendThreshold: 100,
    bulkRecipientThreshold: 1000,
  }),
});

const requests = [
  normalizeGuardRequest({
    functionName: 'send_email',
    arguments: { recipientCount: 5000, subject: 'Launch day blast' },
    runId: 'run_openai_1',
  }),
  normalizeGuardRequest({
    toolName: 'delete_file',
    params: { path: '/prod/secrets.txt' },
    requestId: 'req_mcp_1',
    serverName: 'filesystem',
  }),
  normalizeGuardRequest({
    botName: 'clawdbot',
    task: 'repo.delete_branch',
    payload: { repo: 'team/app', branch: 'legacy-prod' },
    runId: 'bot_1',
    tags: ['destructive', 'production'],
  }),
];

const results = await engine.guardMany(requests);
for (const result of results) {
  if (result.status === 'needs_review') {
    const summary = buildReviewSummary(result.review);
    console.log(summary.title);
    console.log(summary.subtitle);
  } else {
    console.log('approved automatically');
  }
}

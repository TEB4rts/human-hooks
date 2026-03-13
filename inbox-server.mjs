import { createServer } from 'node:http';
import {
  createQueueAuthorizer,
  createReviewEngine,
  createReviewFetchHandler,
  createUniversalValidationPolicies,
  fileReviewStore,
} from '../dist/index.js';

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
      communications: ['brand-lead'],
    },
  }),
});

const handler = createReviewFetchHandler(engine, {
  tokenSecret: process.env.HUMAN_HOOKS_SECRET || 'dev-secret',
  appTitle: 'human-hooks approval inbox',
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost:8787');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : Buffer.concat(chunks),
  });

  const response = await handler(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
});

server.listen(8787, () => {
  console.log('human-hooks inbox running at http://localhost:8787');
});

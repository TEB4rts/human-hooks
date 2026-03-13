import type { JsonMap, ReviewRecord } from './types.js';

export interface ReviewSummary {
  title: string;
  subtitle: string;
  markdown: string;
  facts: JsonMap;
}

export function buildReviewSummary(review: ReviewRecord): ReviewSummary {
  const title = `${review.action} requires ${review.requiredApprovals > 1 ? `${review.requiredApprovals} approvals` : 'review'}`;
  const subtitle = `${review.severity.toUpperCase()} risk in queue ${review.queue}`;
  const facts: JsonMap = {
    reviewId: review.id,
    queue: review.queue,
    action: review.action,
    status: review.status,
    severity: review.severity,
    riskScore: review.riskScore,
    policyNames: review.policyNames,
    actorId: review.request.actor.id,
    provider: review.request.provider,
    tags: review.request.tags,
  };

  const markdown = [
    `# ${title}`,
    '',
    `- Status: **${review.status}**`,
    `- Queue: **${review.queue}**`,
    `- Severity: **${review.severity}**`,
    `- Risk score: **${review.riskScore}**`,
    `- Triggered by: ${review.policyNames.join(', ') || 'manual rule'}`,
    `- Reason: ${review.reason}`,
    '',
    '## Request',
    '```json',
    JSON.stringify(review.request, null, 2),
    '```',
  ].join('\n');

  return {
    title,
    subtitle,
    markdown,
    facts,
  };
}

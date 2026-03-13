import { reasonFromMatches } from './policies.js';
import type {
  ApprovalOutcome,
  GuardDecision,
  GuardRequest,
  JsonMap,
  PolicyMatch,
  ReviewActor,
  ReviewEngineOptions,
  ReviewEvent,
  ReviewRecord,
  ReviewSeverity,
  WrappedActionResult,
  WrapActionOptions,
} from './types.js';
import { addMilliseconds, computeFingerprint, createId, getPathValue, maxSeverity, nowIso } from './utils.js';

export class ReviewEngine {
  private readonly store;
  private readonly policies;
  private readonly defaultQueue;
  private readonly idGenerator;
  private readonly eventSink;
  private readonly reviewerAuthorizer;
  private readonly now;

  constructor(options: ReviewEngineOptions) {
    this.store = options.store;
    this.policies = options.policies;
    this.defaultQueue = options.defaultQueue ?? 'default';
    this.idGenerator = options.idGenerator ?? (() => createId('review'));
    this.eventSink = options.eventSink;
    this.reviewerAuthorizer = options.reviewerAuthorizer;
    this.now = options.now ?? (() => new Date());
  }

  async guard<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
    request: GuardRequest<TPayload, TMeta>,
  ): Promise<GuardDecision> {
    const matches = await this.evaluateMatches(request);
    if (matches.length === 0) {
      return {
        status: 'approved',
        policyNames: [],
        riskScore: 0,
      };
    }

    const fingerprint = computeFingerprint({
      request,
      policies: matches.map((match) => match.name).sort(),
    });

    const existing = this.store.findPendingByFingerprint
      ? await this.store.findPendingByFingerprint(fingerprint)
      : null;

    if (existing && !this.isExpired(existing)) {
      await this.publish('review.reused', existing);
      return {
        status: 'needs_review',
        review: existing,
        reused: true,
      };
    }

    const now = this.now();
    const record = this.buildReviewRecord(request, matches, fingerprint, now);
    await this.store.create(record);
    await this.publish('review.created', record);

    return {
      status: 'needs_review',
      review: record,
    };
  }

  async approve(id: string, actor: ReviewActor, note?: string): Promise<ReviewRecord> {
    const review = await this.getRequiredReview(id);
    await this.assertReviewerAllowed(review, actor);
    const activeReview = await this.expireIfNeeded(review);

    if (activeReview.status !== 'pending') {
      return activeReview;
    }

    const duplicate = activeReview.approvals.find((entry) => entry.actor.id === actor.id && entry.decision === 'approve');
    if (!duplicate) {
      activeReview.approvals.push({
        actor,
        note,
        at: nowIso(this.now()),
        decision: 'approve',
      });
    }

    activeReview.updatedAt = nowIso(this.now());
    await this.publish('review.approval_recorded', activeReview);

    if (countApprovals(activeReview) >= activeReview.requiredApprovals) {
      activeReview.status = 'approved';
      activeReview.resolution = {
        actor,
        note,
        at: nowIso(this.now()),
      };
      activeReview.updatedAt = nowIso(this.now());
      await this.store.put(activeReview);
      await this.publish('review.approved', activeReview);
      return activeReview;
    }

    await this.store.put(activeReview);
    return activeReview;
  }

  async reject(id: string, actor: ReviewActor, note?: string): Promise<ReviewRecord> {
    const review = await this.getRequiredReview(id);
    await this.assertReviewerAllowed(review, actor);
    const activeReview = await this.expireIfNeeded(review);

    if (activeReview.status !== 'pending') {
      return activeReview;
    }

    activeReview.approvals.push({
      actor,
      note,
      at: nowIso(this.now()),
      decision: 'reject',
    });
    activeReview.status = 'rejected';
    activeReview.resolution = {
      actor,
      note,
      at: nowIso(this.now()),
    };
    activeReview.updatedAt = nowIso(this.now());
    await this.store.put(activeReview);
    await this.publish('review.rejected', activeReview);
    return activeReview;
  }

  async markExecuted(id: string, actor?: ReviewActor, output?: JsonMap): Promise<ReviewRecord> {
    const review = await this.getRequiredReview(id);
    if (review.status !== 'approved' && review.status !== 'executed') {
      throw new Error(`Review ${id} must be approved before execution.`);
    }

    if (review.status !== 'executed') {
      review.status = 'executed';
      review.execution = {
        actor,
        at: nowIso(this.now()),
        output,
      };
      review.updatedAt = nowIso(this.now());
      await this.store.put(review);
      await this.publish('review.executed', review);
    }

    return review;
  }

  async getReview(id: string): Promise<ReviewRecord | null> {
    const review = await this.store.get(id);
    if (!review) {
      return null;
    }
    return this.expireIfNeeded(review);
  }

  async listPending(queue?: string): Promise<ReviewRecord[]> {
    const reviews = await this.store.listPending(queue);
    const output: ReviewRecord[] = [];
    for (const review of reviews) {
      output.push(await this.expireIfNeeded(review));
    }
    return output.filter((review) => review.status === 'pending');
  }

  async waitForApproval(id: string): Promise<ApprovalOutcome> {
    const review = await this.getRequiredReview(id);
    const current = await this.expireIfNeeded(review);
    return {
      status: current.status === 'approved' ? 'approved' : 'pending',
      review: current,
    };
  }

  wrapAction<TInput, TResult, TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
    options: WrapActionOptions<TInput, TResult, TPayload, TMeta>,
  ): { run: (input: TInput) => Promise<WrappedActionResult<TResult>> } {
    return {
      run: async (input: TInput) => {
        const request = options.buildRequest(input);
        const decision = await this.guard(request);

        if (decision.status === 'needs_review') {
          return {
            status: 'needs_review',
            review: decision.review,
          };
        }

        const result = await options.execute(input);
        return {
          status: 'executed',
          result,
        };
      },
    };
  }

  private async evaluateMatches<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
    request: GuardRequest<TPayload, TMeta>,
  ): Promise<PolicyMatch[]> {
    const context = {
      request,
      value: (path: string) => getPathValue(request, path),
    };

    const matches: PolicyMatch[] = [];
    for (const reviewPolicy of this.policies) {
      if (await reviewPolicy.when(context)) {
        matches.push({
          name: reviewPolicy.name,
          reason: typeof reviewPolicy.reason === 'function' ? reviewPolicy.reason(context) : reviewPolicy.reason,
          queue: reviewPolicy.queue ?? this.defaultQueue,
          score: reviewPolicy.score ?? 10,
          severity: reviewPolicy.severity ?? 'medium',
          requiredApprovals: reviewPolicy.requiredApprovals ?? 1,
          expiresInMs: reviewPolicy.expiresInMs,
          tags: reviewPolicy.tags,
        });
      }
    }
    return matches;
  }

  private buildReviewRecord<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap>(
    request: GuardRequest<TPayload, TMeta>,
    matches: PolicyMatch[],
    fingerprint: string,
    now: Date,
  ): ReviewRecord<TPayload, TMeta> {
    const expiresInMs = matches
      .map((match) => match.expiresInMs)
      .filter((value): value is number => typeof value === 'number');

    const severity = matches.reduce<ReviewSeverity>((current, match) => maxSeverity(current, match.severity), 'low');
    const updatedAt = nowIso(now);

    return {
      id: this.idGenerator(),
      status: 'pending',
      action: request.action,
      queue: chooseQueue(matches, this.defaultQueue),
      reason: matches.map((match) => match.reason).join('; ') || reasonFromMatches(matches.map((match) => match.name)),
      policyNames: matches.map((match) => match.name),
      matches,
      riskScore: matches.reduce((sum, match) => sum + match.score, 0),
      severity,
      requiredApprovals: Math.max(...matches.map((match) => match.requiredApprovals), 1),
      createdAt: updatedAt,
      updatedAt,
      expiresAt: expiresInMs.length > 0 ? nowIso(addMilliseconds(now, Math.min(...expiresInMs))) : undefined,
      request,
      fingerprint,
      approvals: [],
    };
  }

  private async assertReviewerAllowed(review: ReviewRecord, actor: ReviewActor): Promise<void> {
    if (this.reviewerAuthorizer && !(await this.reviewerAuthorizer(review, actor))) {
      throw new Error(`Actor ${actor.id} is not allowed to review ${review.id}.`);
    }
  }

  private async getRequiredReview(id: string): Promise<ReviewRecord> {
    const review = await this.store.get(id);
    if (!review) {
      throw new Error(`Review ${id} not found.`);
    }
    return review;
  }

  private async expireIfNeeded(review: ReviewRecord): Promise<ReviewRecord> {
    if (!this.isExpired(review) || review.status !== 'pending') {
      return review;
    }

    review.status = 'expired';
    review.updatedAt = nowIso(this.now());
    await this.store.put(review);
    await this.publish('review.expired', review);
    return review;
  }

  private isExpired(review: ReviewRecord): boolean {
    return typeof review.expiresAt === 'string' && new Date(review.expiresAt).getTime() <= this.now().getTime();
  }

  private async publish(type: ReviewEvent['type'], review: ReviewRecord): Promise<void> {
    if (!this.eventSink) {
      return;
    }

    await this.eventSink.publish({
      id: createId('evt'),
      type,
      at: nowIso(this.now()),
      reviewId: review.id,
      queue: review.queue,
      action: review.action,
      status: review.status,
      severity: review.severity,
      riskScore: review.riskScore,
      payload: {
        reason: review.reason,
        policyNames: review.policyNames,
        actorId: review.request.actor.id,
      },
    });
  }
}

export function createReviewEngine(options: ReviewEngineOptions): ReviewEngine {
  return new ReviewEngine(options);
}

function countApprovals(review: ReviewRecord): number {
  return new Set(
    review.approvals
      .filter((entry) => entry.decision === 'approve')
      .map((entry) => entry.actor.id),
  ).size;
}

function chooseQueue(matches: PolicyMatch[], fallback: string): string {
  const critical = matches.find((match) => match.severity === 'critical');
  if (critical) {
    return critical.queue;
  }
  return matches[0]?.queue ?? fallback;
}

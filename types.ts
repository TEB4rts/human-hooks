export type Primitive = string | number | boolean | null;

export type JsonValue =
  | Primitive
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

export type JsonMap = Record<string, JsonValue | undefined>;

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'executed';
export type ReviewSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ReviewDecisionType = 'approve' | 'reject';
export type ReviewEventName =
  | 'review.created'
  | 'review.reused'
  | 'review.approval_recorded'
  | 'review.approved'
  | 'review.rejected'
  | 'review.expired'
  | 'review.executed';

export interface ReviewActor {
  id: string;
  type: 'human' | 'agent' | 'service';
  name?: string;
}

export interface ReviewTarget {
  type: string;
  id?: string;
  name?: string;
}

export interface GuardRequest<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap> {
  action: string;
  actor: ReviewActor;
  payload: TPayload;
  meta?: TMeta;
  resource?: ReviewTarget;
  tags?: string[];
  provider?: string;
  idempotencyKey?: string;
}

export interface ReviewApproval {
  actor: ReviewActor;
  note?: string;
  at: string;
  decision: ReviewDecisionType;
}

export interface ReviewResolution {
  actor: ReviewActor;
  note?: string;
  at: string;
}

export interface ReviewExecution {
  actor?: ReviewActor;
  at: string;
  output?: JsonValue;
}

export interface PolicyMatch {
  name: string;
  reason: string;
  queue: string;
  score: number;
  severity: ReviewSeverity;
  requiredApprovals: number;
  expiresInMs?: number;
  tags?: string[];
}

export interface ReviewRecord<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap> {
  id: string;
  status: ReviewStatus;
  action: string;
  queue: string;
  reason: string;
  policyNames: string[];
  matches: PolicyMatch[];
  riskScore: number;
  severity: ReviewSeverity;
  requiredApprovals: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  request: GuardRequest<TPayload, TMeta>;
  fingerprint: string;
  approvals: ReviewApproval[];
  resolution?: ReviewResolution;
  execution?: ReviewExecution;
}

export interface ReviewStore {
  create(review: ReviewRecord): Promise<void>;
  get(id: string): Promise<ReviewRecord | null>;
  listPending(queue?: string): Promise<ReviewRecord[]>;
  put(review: ReviewRecord): Promise<ReviewRecord>;
  findPendingByFingerprint?(fingerprint: string): Promise<ReviewRecord | null>;
}

export interface PolicyContext<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap> {
  request: GuardRequest<TPayload, TMeta>;
  value(path: string): JsonValue | undefined;
}

export type Condition<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap> =
  (context: PolicyContext<TPayload, TMeta>) => boolean | Promise<boolean>;

export interface ReviewPolicy<TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap> {
  name: string;
  description?: string;
  queue?: string;
  reason: string | ((context: PolicyContext<TPayload, TMeta>) => string);
  when: Condition<TPayload, TMeta>;
  score?: number;
  severity?: ReviewSeverity;
  requiredApprovals?: number;
  expiresInMs?: number;
  tags?: string[];
}

export interface GuardApproved {
  status: 'approved';
  policyNames: string[];
  riskScore: number;
}

export interface GuardNeedsReview {
  status: 'needs_review';
  review: ReviewRecord;
  reused?: boolean;
}

export type GuardDecision = GuardApproved | GuardNeedsReview;

export interface ReviewEvent {
  id: string;
  type: ReviewEventName;
  at: string;
  reviewId: string;
  queue: string;
  action: string;
  status: ReviewStatus;
  severity: ReviewSeverity;
  riskScore: number;
  payload: JsonMap;
}

export interface ReviewEventSink {
  publish(event: ReviewEvent): Promise<void>;
}

export interface ReviewEngineOptions {
  store: ReviewStore;
  policies: ReviewPolicy[];
  defaultQueue?: string;
  idGenerator?: () => string;
  eventSink?: ReviewEventSink;
  reviewerAuthorizer?: (review: ReviewRecord, actor: ReviewActor) => boolean | Promise<boolean>;
  now?: () => Date;
}

export interface WrapActionOptions<TInput, TResult, TPayload extends JsonMap = JsonMap, TMeta extends JsonMap = JsonMap> {
  action: string;
  buildRequest: (input: TInput) => GuardRequest<TPayload, TMeta>;
  execute: (input: TInput) => Promise<TResult>;
}

export interface WrappedActionResult<TResult = unknown> {
  status: 'executed' | 'needs_review';
  result?: TResult;
  review?: ReviewRecord;
}

export interface ApprovalOutcome {
  status: 'pending' | 'approved';
  review: ReviewRecord;
}

export interface SignedReviewTokenPayload extends JsonMap {
  reviewId: string;
  action: ReviewDecisionType;
  actorId?: string;
  exp?: number;
}

export interface FetchHandlerOptions {
  tokenSecret?: string;
}

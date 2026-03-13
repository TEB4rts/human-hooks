create table if not exists human_hooks_reviews (
  id text primary key,
  status text not null,
  action text not null,
  queue text not null,
  reason text not null,
  policy_names jsonb not null,
  matches jsonb not null,
  risk_score integer not null,
  severity text not null,
  required_approvals integer not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  expires_at timestamptz null,
  request jsonb not null,
  fingerprint text not null,
  approvals jsonb not null,
  resolution jsonb null,
  execution jsonb null
);

create index if not exists human_hooks_reviews_pending_idx
  on human_hooks_reviews (queue, created_at)
  where status = 'pending';

create index if not exists human_hooks_reviews_fingerprint_idx
  on human_hooks_reviews (fingerprint);

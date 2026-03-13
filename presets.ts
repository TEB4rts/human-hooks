import {
  actionMatches,
  any,
  amountAbove,
  confidenceBelow,
  externalDomainNotAllowed,
  flag,
  policy,
  recipientCountAbove,
  tagAny,
  tagIncludes,
} from './policies.js';
import type { ReviewPolicy } from './types.js';

export interface UniversalPolicyOptions {
  spendThreshold?: number;
  confidenceThreshold?: number;
  bulkRecipientThreshold?: number;
  destructiveTag?: string;
  piiTag?: string;
  productionTag?: string;
  secretTag?: string;
  externalCommTag?: string;
  privilegedTag?: string;
  exportRecordThreshold?: number;
  corporateDomains?: string[];
}

export function createUniversalValidationPolicies(options: UniversalPolicyOptions = {}): ReviewPolicy[] {
  const spendThreshold = options.spendThreshold ?? 500;
  const confidenceThreshold = options.confidenceThreshold ?? 0.8;
  const bulkRecipientThreshold = options.bulkRecipientThreshold ?? 500;
  const exportRecordThreshold = options.exportRecordThreshold ?? 1000;
  const destructiveTag = options.destructiveTag ?? 'destructive';
  const piiTag = options.piiTag ?? 'pii';
  const productionTag = options.productionTag ?? 'production';
  const secretTag = options.secretTag ?? 'secret';
  const externalCommTag = options.externalCommTag ?? 'external';
  const privilegedTag = options.privilegedTag ?? 'privileged';
  const corporateDomains = options.corporateDomains ?? [];

  return [
    policy({
      name: 'large-spend',
      queue: 'finance',
      severity: 'high',
      score: 45,
      reason: 'The requested financial amount is above the automatic threshold.',
      when: amountAbove(spendThreshold),
    }),
    policy({
      name: 'low-confidence',
      queue: 'ops',
      severity: 'medium',
      score: 20,
      reason: 'The automation confidence is below the approved safety floor.',
      when: confidenceBelow(confidenceThreshold),
    }),
    policy({
      name: 'bulk-outreach',
      queue: 'marketing',
      severity: 'high',
      score: 35,
      reason: 'The workflow is trying to reach a large audience at once.',
      when: recipientCountAbove(bulkRecipientThreshold),
    }),
    policy({
      name: 'destructive-action',
      queue: 'ops',
      severity: 'critical',
      score: 70,
      requiredApprovals: 2,
      reason: 'The action appears destructive or hard to reverse.',
      when: any(
        tagIncludes(destructiveTag),
        actionMatches(/delete|destroy|terminate|wipe|revoke|drop|shutdown|remove|disable/i),
      ),
    }),
    policy({
      name: 'production-or-pii',
      queue: 'security',
      severity: 'critical',
      score: 60,
      requiredApprovals: 2,
      reason: 'The request touches production systems or sensitive data.',
      when: any(tagIncludes(productionTag), tagIncludes(piiTag)),
    }),
    policy({
      name: 'permission-or-access-change',
      queue: 'security',
      severity: 'critical',
      score: 65,
      requiredApprovals: 2,
      reason: 'The request changes permissions, roles, credentials, or access scope.',
      when: any(
        tagIncludes(privilegedTag),
        actionMatches(/grant|invite|permission|role|policy|access|credential|apikey|token|secret/i),
      ),
    }),
    policy({
      name: 'secret-or-key-material',
      queue: 'security',
      severity: 'critical',
      score: 80,
      requiredApprovals: 2,
      reason: 'The request appears to read, write, rotate, or expose secrets or key material.',
      when: any(
        tagIncludes(secretTag),
        actionMatches(/secret|password|key|token|credential|vault|kms|sign/i),
        flag('payload.containsSecretMaterial'),
      ),
    }),
    policy({
      name: 'external-communication',
      queue: 'communications',
      severity: 'high',
      score: 40,
      reason: 'The action sends or publishes information outside the system boundary.',
      when: any(
        tagIncludes(externalCommTag),
        actionMatches(/email|send|post|publish|broadcast|notify|share|webhook/i),
        ...corporateDomains.length > 0 ? [externalDomainNotAllowed('payload.recipientEmail', corporateDomains)] : [],
      ),
    }),
    policy({
      name: 'bulk-data-export',
      queue: 'data-governance',
      severity: 'critical',
      score: 75,
      requiredApprovals: 2,
      reason: 'The workflow exports or downloads a large amount of potentially sensitive data.',
      when: any(
        actionMatches(/export|download|dump|backup|extract/i),
        recipientCountAbove(exportRecordThreshold, 'payload.recordCount'),
      ),
    }),
    policy({
      name: 'code-or-infra-change',
      queue: 'platform',
      severity: 'critical',
      score: 65,
      requiredApprovals: 2,
      reason: 'The request deploys code, changes infrastructure, or mutates databases.',
      when: actionMatches(/deploy|release|rollback|terraform|infra|migrate|schema|database|db\.|k8s|dns/i),
    }),
    policy({
      name: 'legal-or-policy-surface',
      queue: 'legal',
      severity: 'high',
      score: 50,
      requiredApprovals: 1,
      reason: 'The action touches contracts, compliance, policy text, or regulated commitments.',
      when: actionMatches(/contract|terms|policy|legal|compliance|consent|privacy/i),
    }),
  ];
}

export interface FutureProofPolicyOptions extends UniversalPolicyOptions {}

export function createFutureProofPolicies(options: FutureProofPolicyOptions = {}): ReviewPolicy[] {
  return createUniversalValidationPolicies(options);
}

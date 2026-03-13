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
export declare function createUniversalValidationPolicies(options?: UniversalPolicyOptions): ReviewPolicy[];
export interface FutureProofPolicyOptions extends UniversalPolicyOptions {
}
export declare function createFutureProofPolicies(options?: FutureProofPolicyOptions): ReviewPolicy[];

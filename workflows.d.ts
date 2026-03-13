import type { GuardRequest, JsonMap, ReviewActor } from '../types.js';
export interface WorkflowStepEnvelope<TInput extends JsonMap = JsonMap> {
    provider: 'make' | 'zapier' | 'pipedream' | 'workflow';
    stepName: string;
    input?: TInput;
    payload?: TInput;
    runId?: string;
    workflowId?: string;
    confidence?: number;
    tags?: string[];
    actor?: ReviewActor;
}
export declare function fromWorkflowStep<TInput extends JsonMap = JsonMap>(envelope: WorkflowStepEnvelope<TInput>): GuardRequest<TInput, JsonMap>;

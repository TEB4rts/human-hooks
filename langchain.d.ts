import type { GuardRequest, JsonMap, ReviewActor } from '../types.js';
export interface LangChainActionEnvelope<TInput extends JsonMap = JsonMap> {
    tool: string;
    input: TInput;
    confidence?: number;
    runId?: string;
    graphId?: string;
    nodeName?: string;
    tags?: string[];
    actor?: ReviewActor;
}
export declare function fromLangChainAction<TInput extends JsonMap = JsonMap>(envelope: LangChainActionEnvelope<TInput>): GuardRequest<TInput, JsonMap>;

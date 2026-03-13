import type { GuardRequest, JsonMap } from '../types.js';
export interface BotAutomationEnvelope<TPayload extends JsonMap = JsonMap> {
    botName: string;
    task: string;
    payload: TPayload;
    confidence?: number;
    runId?: string;
    tags?: string[];
}
export declare function fromBotAutomation<TPayload extends JsonMap = JsonMap>(envelope: BotAutomationEnvelope<TPayload>): GuardRequest<TPayload, JsonMap>;

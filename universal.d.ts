import type { GuardRequest, JsonMap } from '../types.js';
export interface NormalizeGuardRequestHints {
    provider?: 'claude' | 'openai' | 'n8n' | 'mcp' | 'langchain' | 'bot' | 'generic' | 'gemini' | 'workflow';
}
export declare function normalizeGuardRequest(input: Record<string, unknown>, hints?: NormalizeGuardRequestHints): GuardRequest<JsonMap, JsonMap>;

import { fromBotAutomation } from './bots.js';
import { fromClaudeToolUse } from './claude.js';
import { fromGeminiFunctionCall } from './gemini.js';
import { fromLangChainAction } from './langchain.js';
import { fromMcpToolCall } from './mcp.js';
import { fromN8nItem } from './n8n.js';
import { fromOpenAIToolCall } from './openai.js';
import { fromToolEnvelope } from './generic.js';
import { fromWorkflowStep } from './workflows.js';
export function normalizeGuardRequest(input, hints = {}) {
    if (isGuardRequest(input)) {
        return input;
    }
    const provider = hints.provider;
    if (provider === 'claude')
        return fromClaudeToolUse(input);
    if (provider === 'openai')
        return fromOpenAIToolCall(input);
    if (provider === 'n8n')
        return fromN8nItem(input);
    if (provider === 'mcp')
        return fromMcpToolCall(input);
    if (provider === 'langchain')
        return fromLangChainAction(input);
    if (provider === 'bot')
        return fromBotAutomation(input);
    if (provider === 'generic')
        return fromToolEnvelope(input);
    if (provider === 'gemini')
        return fromGeminiFunctionCall(input);
    if (provider === 'workflow')
        return fromWorkflowStep(input);
    if ('json' in input)
        return fromN8nItem(input);
    if ('botName' in input && 'task' in input)
        return fromBotAutomation(input);
    if ('functionName' in input)
        return fromOpenAIToolCall(input);
    if ('serverName' in input || 'params' in input)
        return fromMcpToolCall(input);
    if ('graphId' in input || 'nodeName' in input)
        return fromLangChainAction(input);
    if ('toolName' in input && ('sessionId' in input || 'messageId' in input || 'userId' in input))
        return fromClaudeToolUse(input);
    if ('name' in input && ('args' in input || 'invocationId' in input))
        return fromGeminiFunctionCall(input);
    if ('stepName' in input && ('workflowId' in input || 'provider' in input))
        return fromWorkflowStep(input);
    if ('action' in input && ('payload' in input || 'provider' in input))
        return fromToolEnvelope(input);
    throw new Error('Could not normalize request shape. Provide hints.provider or use a specific adapter.');
}
function isGuardRequest(input) {
    return typeof input.action === 'string' && Boolean(input.actor) && Boolean(input.payload);
}

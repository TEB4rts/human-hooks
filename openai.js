export function fromOpenAIToolCall(envelope) {
    const payload = envelope.arguments ?? envelope.input ?? {};
    return {
        action: `tool.${envelope.functionName}`,
        actor: envelope.actor ?? {
            id: envelope.runId ?? envelope.assistantId ?? 'openai-agent',
            type: 'agent',
            name: 'OpenAI-compatible agent',
        },
        provider: 'openai',
        payload,
        meta: {
            confidence: envelope.confidence,
            toolCallId: envelope.toolCallId,
            runId: envelope.runId,
            threadId: envelope.threadId,
            assistantId: envelope.assistantId,
        },
        tags: envelope.tags,
        idempotencyKey: envelope.toolCallId ?? envelope.runId,
    };
}

export function fromClaudeToolUse(envelope) {
    return {
        action: `tool.${envelope.toolName}`,
        actor: envelope.actor ?? {
            id: envelope.sessionId ?? envelope.userId ?? 'claude-agent',
            type: 'agent',
            name: 'Claude-compatible agent',
        },
        provider: 'claude',
        payload: envelope.input,
        meta: {
            confidence: envelope.confidence,
            sessionId: envelope.sessionId,
            messageId: envelope.messageId,
        },
        tags: envelope.tags,
        idempotencyKey: envelope.messageId,
    };
}

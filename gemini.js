export function fromGeminiFunctionCall(envelope) {
    const payload = envelope.args ?? envelope.input ?? {};
    return {
        action: `tool.${envelope.name}`,
        actor: envelope.actor ?? {
            id: envelope.invocationId ?? envelope.sessionId ?? 'gemini-agent',
            type: 'agent',
            name: 'Gemini-compatible agent',
        },
        provider: 'gemini',
        payload,
        meta: {
            confidence: envelope.confidence,
            invocationId: envelope.invocationId,
            sessionId: envelope.sessionId,
        },
        tags: envelope.tags,
        idempotencyKey: envelope.invocationId,
    };
}

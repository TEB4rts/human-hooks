export function fromBotAutomation(envelope) {
    return {
        action: envelope.task,
        actor: {
            id: envelope.runId ?? `${envelope.botName}-automation`,
            type: 'agent',
            name: envelope.botName,
        },
        provider: envelope.botName,
        payload: envelope.payload,
        meta: {
            confidence: envelope.confidence,
            runId: envelope.runId,
        },
        tags: envelope.tags,
        idempotencyKey: envelope.runId,
    };
}

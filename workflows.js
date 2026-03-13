export function fromWorkflowStep(envelope) {
    const payload = envelope.payload ?? envelope.input ?? {};
    return {
        action: `step.${envelope.stepName}`,
        actor: envelope.actor ?? {
            id: envelope.runId ?? envelope.workflowId ?? `${envelope.provider}-workflow`,
            type: 'service',
            name: `${envelope.provider} workflow`,
        },
        provider: envelope.provider,
        payload,
        meta: {
            confidence: envelope.confidence,
            runId: envelope.runId,
            workflowId: envelope.workflowId,
        },
        tags: envelope.tags,
        idempotencyKey: envelope.runId,
    };
}

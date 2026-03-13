export function fromLangChainAction(envelope) {
    return {
        action: `tool.${envelope.tool}`,
        actor: envelope.actor ?? {
            id: envelope.runId ?? envelope.graphId ?? 'langchain-agent',
            type: 'agent',
            name: envelope.nodeName ? `LangChain node ${envelope.nodeName}` : 'LangChain agent',
        },
        provider: 'langchain',
        payload: envelope.input,
        meta: {
            confidence: envelope.confidence,
            runId: envelope.runId,
            graphId: envelope.graphId,
            nodeName: envelope.nodeName,
        },
        tags: envelope.tags,
        idempotencyKey: envelope.runId,
    };
}

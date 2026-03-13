export function fromMcpToolCall(envelope) {
    const payload = envelope.params ?? envelope.arguments ?? {};
    return {
        action: `tool.${envelope.toolName}`,
        actor: envelope.actor ?? {
            id: envelope.sessionId ?? envelope.requestId ?? 'mcp-agent',
            type: 'agent',
            name: envelope.serverName ? `${envelope.serverName} MCP client` : 'MCP client',
        },
        provider: 'mcp',
        payload,
        meta: {
            confidence: envelope.confidence,
            requestId: envelope.requestId,
            sessionId: envelope.sessionId,
            serverName: envelope.serverName,
        },
        tags: envelope.tags,
        idempotencyKey: envelope.requestId,
    };
}

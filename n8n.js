export function fromN8nItem(item, options = {}) {
    const actionField = options.actionField ?? 'action';
    const actorIdField = options.actorIdField ?? 'actorId';
    const confidenceField = options.confidenceField ?? 'confidence';
    const data = item.json;
    return {
        action: String(data[actionField] ?? 'workflow.action'),
        actor: {
            id: String(data[actorIdField] ?? 'n8n-workflow'),
            type: 'service',
            name: 'n8n workflow',
        },
        provider: options.provider ?? 'n8n',
        payload: data.payload ?? data,
        meta: {
            confidence: typeof data[confidenceField] === 'number' ? data[confidenceField] : undefined,
            workflowId: data.workflowId,
            executionId: data.executionId,
        },
        tags: Array.isArray(data.tags) ? data.tags : undefined,
        idempotencyKey: typeof data.executionId === 'string' ? data.executionId : undefined,
    };
}
export function toN8nReviewResponse(reviewId) {
    return {
        json: {
            status: 'needs_review',
            reviewId,
        },
    };
}

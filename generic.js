export function fromToolEnvelope(input) {
    return {
        action: input.action,
        actor: input.actor,
        payload: input.payload,
        meta: input.meta,
        provider: input.provider,
        resource: input.resource,
        tags: input.tags,
        idempotencyKey: input.idempotencyKey,
    };
}

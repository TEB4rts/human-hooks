import { createId, stableStringify } from './utils.js';
import { createHmac } from 'node:crypto';
export class MemoryEventSink {
    events = [];
    async publish(event) {
        this.events.push(event);
    }
}
export function memoryEventSink() {
    return new MemoryEventSink();
}
export function createEventFanout(...sinks) {
    return {
        async publish(event) {
            await Promise.all(sinks.map(async (sink) => sink.publish(event)));
        },
    };
}
export function webhookEventSink(options) {
    const fetcher = options.fetcher ?? fetch;
    return {
        async publish(event) {
            const body = stableStringify(event);
            const headers = {
                'content-type': 'application/json',
                'x-human-hooks-event-id': event.id || createId('evt'),
                ...options.headers,
            };
            if (options.secret) {
                headers['x-human-hooks-signature'] = signWebhookPayload(body, options.secret);
            }
            const response = await fetcher(options.url, {
                method: 'POST',
                headers,
                body,
            });
            if (!response.ok) {
                throw new Error(`Webhook sink failed with status ${response.status}.`);
            }
        },
    };
}
export function signWebhookPayload(body, secret) {
    const digest = createHmac('sha256', secret).update(body).digest('hex');
    return `sha256=${digest}`;
}

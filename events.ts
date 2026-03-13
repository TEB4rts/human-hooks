import type { ReviewEvent, ReviewEventSink } from './types.js';
import { createId, stableStringify } from './utils.js';
import { createHmac } from 'node:crypto';

export class MemoryEventSink implements ReviewEventSink {
  public readonly events: ReviewEvent[] = [];

  async publish(event: ReviewEvent): Promise<void> {
    this.events.push(event);
  }
}

export function memoryEventSink(): MemoryEventSink {
  return new MemoryEventSink();
}

export function createEventFanout(...sinks: ReviewEventSink[]): ReviewEventSink {
  return {
    async publish(event: ReviewEvent): Promise<void> {
      await Promise.all(sinks.map(async (sink) => sink.publish(event)));
    },
  };
}

export interface WebhookEventSinkOptions {
  url: string;
  secret?: string;
  fetcher?: typeof fetch;
  headers?: Record<string, string>;
}

export function webhookEventSink(options: WebhookEventSinkOptions): ReviewEventSink {
  const fetcher = options.fetcher ?? fetch;

  return {
    async publish(event: ReviewEvent): Promise<void> {
      const body = stableStringify(event);
      const headers: Record<string, string> = {
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

export function signWebhookPayload(body: string, secret: string): string {
  const digest = createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${digest}`;
}

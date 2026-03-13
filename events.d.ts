import type { ReviewEvent, ReviewEventSink } from './types.js';
export declare class MemoryEventSink implements ReviewEventSink {
    readonly events: ReviewEvent[];
    publish(event: ReviewEvent): Promise<void>;
}
export declare class ConsoleEventSink implements ReviewEventSink {
    publish(event: ReviewEvent): Promise<void>;
}
export declare function memoryEventSink(): MemoryEventSink;
export declare function consoleEventSink(): ConsoleEventSink;
export declare function createEventFanout(...sinks: ReviewEventSink[]): ReviewEventSink;
export interface WebhookEventSinkOptions {
    url: string;
    secret?: string;
    fetcher?: typeof fetch;
    headers?: Record<string, string>;
}
export declare function webhookEventSink(options: WebhookEventSinkOptions): ReviewEventSink;
export declare function signWebhookPayload(body: string, secret: string): string;

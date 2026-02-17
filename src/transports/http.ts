// src/transports/http.ts

import { JsonFormatter } from '../core/formatter';
import type { Formatter, LogEntry, Transport } from '../types';

export interface HttpTransportOptions {
    url: string;
    formatter?: Formatter;

    /** HTTP method (default: 'POST') */
    method?: 'POST' | 'PUT';

    /** Additional headers sent with every request */
    headers?: Record<string, string>;

    /** Batch multiple entries into a single request (default: true) */
    batch?: boolean;

    /** Max number of entries per batch (default: 50) */
    batchSize?: number;

    /** Max delay in ms before flushing a non-full batch (default: 2000) */
    batchInterval?: number;

    /** Number of retry attempts on failure (default: 3) */
    retries?: number;

    /** Initial retry delay in ms, doubles on each attempt (default: 200) */
    retryDelay?: number;

    /** Request timeout in ms (default: 5000) */
    timeout?: number;

    /** Called when a batch ultimately fails after all retries */
    onError?: (error: Error, entries: LogEntry[]) => void;
}

/**
 * HTTP transport - sends logs to a remote endpoint.
 *
 * Supports:
 *  - Single or batched requests
 *  - Automatic retry with exponential back-off
 *  - Graceful flush on close
 */
export class HttpTransport implements Transport {
    name = 'http';

    private readonly url: string;
    private readonly method: 'POST' | 'PUT';
    private readonly headers: Record<string, string>;
    private readonly formatter: Formatter;
    private readonly batch: boolean;
    private readonly batchSize: number;
    private readonly batchInterval: number;
    private readonly retries: number;
    private readonly retryDelay: number;
    private readonly timeout: number;
    private readonly onError: (error: Error, entries: LogEntry[]) => void;

    private queue: LogEntry[] = [];
    private flushTimer: ReturnType<typeof setTimeout> | null = null;
    private closed = false;

    constructor(options: HttpTransportOptions) {
        this.url = options.url;
        this.method = options.method ?? 'POST';
        this.formatter = options.formatter ?? new JsonFormatter();
        this.batch = options.batch ?? true;
        this.batchSize = options.batchSize ?? 50;
        this.batchInterval = options.batchInterval ?? 2_000;
        this.retries = options.retries ?? 3;
        this.retryDelay = options.retryDelay ?? 200;
        this.timeout = options.timeout ?? 5_000;
        this.onError =
            options.onError ??
            ((err) => {
                console.error(
                    '[HttpTransport] Failed to send log batch:',
                    err.message
                );
            });

        this.headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
    }

    // ─── Transport interface ──────────────────────────────────────────────────

    write(entry: LogEntry): void {
        if (this.closed) return;

        if (!this.batch) {
            // Fire-and-forget single entry
            this.sendWithRetry([entry]).catch(() => {
                // onError is called inside sendWithRetry
            });
            return;
        }

        this.queue.push(entry);

        if (this.queue.length >= this.batchSize) {
            // Batch is full – flush immediately
            this.flushQueue();
        } else if (!this.flushTimer) {
            // Schedule a flush for when the interval elapses
            this.flushTimer = setTimeout(
                () => this.flushQueue(),
                this.batchInterval
            );
        }
    }

    async flush(): Promise<void> {
        this.clearTimer();
        if (this.queue.length > 0) {
            await this.flushQueue();
        }
    }

    async close(): Promise<void> {
        this.closed = true;
        await this.flush();
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    /** Drains the current queue and sends it as a single request. */
    private async flushQueue(): Promise<void> {
        this.clearTimer();

        if (this.queue.length === 0) return;

        const entries = this.queue.splice(0, this.queue.length);
        await this.sendWithRetry(entries);
    }

    /** Serializes entries and posts them, retrying on transient failures. */
    private async sendWithRetry(entries: LogEntry[]): Promise<void> {
        const body = this.serialize(entries);
        let attempt = 0;

        while (attempt <= this.retries) {
            try {
                await this.post(body);
                return; // Success
            } catch (error) {
                attempt++;
                if (attempt > this.retries) {
                    this.onError(
                        error instanceof Error
                            ? error
                            : new Error(String(error)),
                        entries
                    );
                    return;
                }
                // Exponential back-off: 200ms, 400ms, 800ms, …
                await sleep(this.retryDelay * 2 ** (attempt - 1));
            }
        }
    }

    /** Performs the actual HTTP request with a timeout. */
    private async post(body: string): Promise<void> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(this.url, {
                method: this.method,
                headers: this.headers,
                body,
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status} ${response.statusText} from ${this.url}`
                );
            }
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * Serializes a list of entries.
     *
     * - Single entry  → the formatter's string output wrapped in an object
     * - Multiple entries → JSON array of the raw entries (formatter is used for
     *   single-entry mode only; batch payloads are always JSON arrays so the
     *   remote can parse them uniformly)
     */
    private serialize(entries: LogEntry[]): string {
        if (entries.length === 1) {
            // entries[0] is safe here because we explicitly checked length === 1
            return this.formatter.format(entries[0]!);
        }
        return JSON.stringify(entries);
    }

    private clearTimer(): void {
        if (this.flushTimer !== null) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
    }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

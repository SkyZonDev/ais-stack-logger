// src/transports/console.ts

import { createAdvancedFormatter } from '../core/formatter';
import type { Formatter, LogEntry, Transport } from '../types';

/**
 * Console transport - outputs logs to stdout/stderr
 */
export class ConsoleTransport implements Transport {
    name = 'console';
    private formatter: Formatter;
    private useStderr: boolean;

    constructor(
        options: {
            formatter?: Formatter;
            useStderr?: boolean; // Use stderr for warn/error levels
        } = {}
    ) {
        this.formatter = options.formatter || createAdvancedFormatter();
        this.useStderr = options.useStderr !== false;
    }

    write(entry: LogEntry): void {
        const formatted = this.formatter.format(entry);

        if (
            this.useStderr &&
            (entry.level === 'error' ||
                entry.level === 'fatal' ||
                entry.level === 'warn')
        ) {
            process.stderr.write(formatted + '\n');
        } else {
            process.stdout.write(formatted + '\n');
        }
    }

    flush(): void {
        // Console streams are auto-flushed
    }

    close(): void {
        // Nothing to close for console
    }
}

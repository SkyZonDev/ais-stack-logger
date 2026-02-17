// src/core/logger.ts

import { getLevelCallOptions } from '../config';
import { ConsoleTransport } from '../transports/console';
import type {
    Formatter,
    LogCallOptions,
    LogContext,
    LogEntry,
    Logger,
    LoggerConfig,
    LogLevelName,
    Transport,
} from '../types';
import { Redactor } from '../utils/redactor';
import { mergeContext, Serializer } from '../utils/serializer';
import { createAdvancedFormatter } from './formatter';
import { getDefaultLevel, isLevelEnabled } from './levels';

// ─── ScopedLogger ─────────────────────────────────────────────────────────────

/**
 * A thin proxy returned by `logger.with(options)`.
 * Every log method on this object will merge the scoped options on top of any
 * per-level options already defined in the global config.
 */
class ScopedLogger implements Logger {
    constructor(
        private readonly inner: LoggerImpl,
        private readonly scopedOptions: LogCallOptions
    ) {}

    private merge(callOptions?: LogCallOptions): LogCallOptions {
        return { ...this.scopedOptions, ...callOptions };
    }

    trace(
        message: string,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        this.inner.trace(message, context, this.merge(options));
    }
    debug(
        message: string,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        this.inner.debug(message, context, this.merge(options));
    }
    log(message: string, context?: LogContext, options?: LogCallOptions): void {
        this.inner.log(message, context, this.merge(options));
    }
    info(
        message: string,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        this.inner.info(message, context, this.merge(options));
    }
    warn(
        message: string,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        this.inner.warn(message, context, this.merge(options));
    }
    error(
        message: string,
        error?: Error | LogContext,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        this.inner.error(message, error, context, this.merge(options));
    }
    fatal(
        message: string,
        error?: Error | LogContext,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        this.inner.fatal(message, error, context, this.merge(options));
    }

    child(context: LogContext): Logger {
        return this.inner.child(context).with(this.scopedOptions);
    }
    withContext(context: LogContext): Logger {
        return this.child(context);
    }
    with(options: LogCallOptions): Logger {
        return new ScopedLogger(this.inner, this.merge(options));
    }
    setLevel(level: LogLevelName): void {
        this.inner.setLevel(level);
    }
    getLevel(): LogLevelName {
        return this.inner.getLevel();
    }
    isLevelEnabled(level: LogLevelName): boolean {
        return this.inner.isLevelEnabled(level);
    }
    flush(): Promise<void> {
        return this.inner.flush();
    }
    close(): Promise<void> {
        return this.inner.close();
    }
}

// ─── LoggerImpl ───────────────────────────────────────────────────────────────

/**
 * Main Logger implementation
 */
export class LoggerImpl implements Logger {
    private level: LogLevelName;
    private context: LogContext;
    private transports: Transport[];
    private formatter: Formatter;
    private serializer: Serializer;
    private redactor?: Redactor;
    private timestamp: boolean | 'iso' | 'epoch';
    private asyncMode: boolean;

    constructor(config: LoggerConfig = {}) {
        this.level = config.level || getDefaultLevel();
        this.context = config.context || {};
        this.transports = config.transports || [
            new ConsoleTransport({
                formatter: config.formatter || createAdvancedFormatter(),
            }),
        ];
        this.formatter = config.formatter || createAdvancedFormatter();
        this.timestamp = config.timestamp !== false ? 'iso' : false;
        this.asyncMode = config.async || false;

        this.serializer = new Serializer({
            maxDepth: config.maxDepth ?? 1000,
            maxStringLength: config.maxStringLength ?? 1000,
        });

        if (config.redact && config.redact.length > 0) {
            this.redactor = new Redactor({ paths: config.redact });
        }
    }

    // ── Core log methods ──────────────────────────────────────────────────────

    trace(
        message: string,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        this.log_internal('trace', message, context, options);
    }

    debug(
        message: string,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        this.log_internal('debug', message, context, options);
    }

    log(message: string, context?: LogContext, options?: LogCallOptions): void {
        this.log_internal('log', message, context, options);
    }

    info(
        message: string,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        this.log_internal('info', message, context, options);
    }

    warn(
        message: string,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        this.log_internal('warn', message, context, options);
    }

    error(
        message: string,
        error?: Error | LogContext,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        let errorObj: Error | undefined;
        let ctx: LogContext | undefined;

        if (error instanceof Error) {
            errorObj = error;
            ctx = context;
        } else {
            ctx = error;
        }

        const finalContext = errorObj
            ? { ...ctx, error: this.serializer.serialize(errorObj) }
            : ctx;

        this.log_internal('error', message, finalContext, options);
    }

    fatal(
        message: string,
        error?: Error | LogContext,
        context?: LogContext,
        options?: LogCallOptions
    ): void {
        let errorObj: Error | undefined;
        let ctx: LogContext | undefined;

        if (error instanceof Error) {
            errorObj = error;
            ctx = context;
        } else {
            ctx = error;
        }

        const finalContext = errorObj
            ? { ...ctx, error: this.serializer.serialize(errorObj) }
            : ctx;

        this.log_internal('fatal', message, finalContext, options);
    }

    // ── Context management ────────────────────────────────────────────────────

    child(context: LogContext): Logger {
        return new LoggerImpl({
            level: this.level,
            context: mergeContext(this.context, context),
            transports: this.transports,
            formatter: this.formatter,
            timestamp: this.timestamp,
            async: this.asyncMode,
        });
    }

    withContext(context: LogContext): Logger {
        return this.child(context);
    }

    /**
     * Return a scoped logger that applies `options` to every subsequent call.
     * The underlying logger and its config are not modified.
     *
     * @example
     * const verbose = logger.with({ mode: 'pretty', emphasisErrors: true });
     * verbose.info('Server started', { port: 3000 });
     * verbose.warn('Deprecated endpoint called', { path: '/old' });
     */
    with(options: LogCallOptions): Logger {
        return new ScopedLogger(this, options);
    }

    // ── Configuration ─────────────────────────────────────────────────────────

    setLevel(level: LogLevelName): void {
        this.level = level;
    }

    getLevel(): LogLevelName {
        return this.level;
    }

    isLevelEnabled(level: LogLevelName): boolean {
        return isLevelEnabled(level, this.level);
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async flush(): Promise<void> {
        const promises = this.transports
            .filter((t) => t.flush)
            .map((t) => t.flush!());
        await Promise.all(promises);
    }

    async close(): Promise<void> {
        await this.flush();
        const promises = this.transports
            .filter((t) => t.close)
            .map((t) => t.close!());
        await Promise.all(promises);
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private log_internal(
        level: LogLevelName,
        message: string,
        context?: LogContext,
        callOptions?: LogCallOptions
    ): void {
        if (!isLevelEnabled(level, this.level)) return;

        // Merge call options: per-level config (lowest priority) < call-site options
        const levelOptions = getLevelCallOptions(level);
        const mergedCallOptions: LogCallOptions | undefined =
            levelOptions || callOptions
                ? { ...levelOptions, ...callOptions }
                : undefined;

        const entry = this.buildEntry(
            level,
            message,
            context,
            mergedCallOptions
        );

        if (this.asyncMode) {
            setImmediate(() => this.writeToTransports(entry));
        } else {
            this.writeToTransports(entry);
        }
    }

    private buildEntry(
        level: LogLevelName,
        message: string,
        context?: LogContext,
        callOptions?: LogCallOptions
    ): LogEntry {
        let mergedContext = mergeContext(this.context, context || {});

        const serializedContext = this.serializer.serialize(
            mergedContext
        ) as Record<string, unknown>;

        if (this.redactor) {
            mergedContext = this.redactor.redact(serializedContext);
        } else {
            mergedContext = serializedContext;
        }

        const entry: LogEntry = {
            level,
            message,
            ...mergedContext,
            timestamp: undefined,
        };

        if (this.timestamp) {
            entry.timestamp =
                this.timestamp === 'epoch'
                    ? Date.now()
                    : new Date().toISOString();
        }

        // Attach per-call options so the formatter can pick them up
        if (callOptions) {
            entry.$callOptions = callOptions;
        }

        return entry;
    }

    private writeToTransports(entry: LogEntry): void {
        for (const transport of this.transports) {
            try {
                transport.write(entry);
            } catch (error) {
                console.error('Transport write error:', error);
            }
        }
    }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a new logger instance
 */
export function createLogger(config?: LoggerConfig): Logger {
    return new LoggerImpl(config);
}

// src/types.ts

/**
 * Log levels from lowest to highest priority
 */
export enum LogLevel {
    TRACE = 10,
    DEBUG = 20,
    LOG = 30,
    INFO = 40,
    WARN = 50,
    ERROR = 60,
    FATAL = 70,
}

export type LogLevelName =
    | 'trace'
    | 'debug'
    | 'log'
    | 'info'
    | 'warn'
    | 'error'
    | 'fatal';

/**
 * Base log entry structure
 */
export interface LogEntry {
    timestamp: string | number | undefined;
    level: LogLevelName;
    message: string;
    /** Internal: per-call formatter overrides (stripped before output) */
    $callOptions?: LogCallOptions;
    [key: string]: unknown;
}

/**
 * Context object that can be attached to loggers
 */
export type LogContext = Record<string, unknown>;

/**
 * Transport interface - handles where logs are written
 */
export interface Transport {
    name: string;
    write(entry: LogEntry): void | Promise<void>;
    flush?(): void | Promise<void>;
    close?(): void | Promise<void>;
}

/**
 * Formatter interface - transforms log entries
 */
export interface Formatter {
    format(entry: LogEntry): string;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
    /** Minimum log level to output */
    level?: LogLevelName;

    /** Base context merged into all logs */
    context?: LogContext;

    /** List of transports to use */
    transports?: Transport[];

    /** Custom formatter */
    formatter?: Formatter;

    /** Enable pretty printing (development mode) */
    pretty?: boolean;

    /** Fields to redact from logs */
    redact?: string[];

    /** Maximum serialization depth */
    maxDepth?: number;

    /** Maximum string length before truncation */
    maxStringLength?: number;

    /** Enable timestamp in logs */
    timestamp?: boolean | 'iso' | 'epoch';

    /** Custom error serializer */
    errorSerializer?: (error: Error) => Record<string, unknown>;

    /** Async mode (non-blocking writes) */
    async?: boolean;
}

/**
 * Per-call formatting overrides.
 * Pass as the last argument to any log method to override the formatter for that single call.
 *
 * @example
 * // Force pretty output for one specific call, even if the global mode is 'minimal'
 * csl.info('Deployment finished', { version: '2.1.0' }, { mode: 'pretty' });
 *
 * // Or chain with .with() for multiple calls
 * const pretty = csl.with({ mode: 'pretty' });
 * pretty.info('Step 1 done');
 * pretty.info('Step 2 done');
 */
export interface LogCallOptions {
    /** Override the formatter mode for this call */
    mode?: FormatterMode;
    /** Override error emphasis for this call */
    emphasisErrors?: boolean;
    /** Override color rendering for this call */
    colors?: boolean;
    /** Override timestamp rendering for this call */
    timestamp?: boolean;
}

/**
 * Per-level formatter overrides used in defineConfig
 */
export type PerLevelConfig = Partial<Record<LogLevelName, LogCallOptions>>;

/**
 * Per-environment config used in defineConfig.
 * Keys are NODE_ENV values ('development', 'production', 'test', …).
 */
export type PerEnvConfig = Record<
    string,
    Partial<LoggerConfig & FormatterConfig>
>;

/**
 * Full configuration file shape for defineConfig().
 * Combines logger config, formatter config, and advanced overrides.
 *
 * @example
 * // logger.config.ts
 * import { defineConfig } from '@ais-forge/logger';
 *
 * export default defineConfig({
 *   level: 'info',
 *   mode: 'pretty',
 *   emphasisErrors: true,
 *   alignContext: true,
 *
 *   // Per-level formatting overrides
 *   levels: {
 *     debug: { mode: 'minimal' },
 *     error: { mode: 'pretty', emphasisErrors: true },
 *   },
 *
 *   // Per-environment overrides (applied via NODE_ENV)
 *   env: {
 *     production:  { mode: 'json',   level: 'warn' },
 *     development: { mode: 'pretty', level: 'debug' },
 *     test:        { mode: 'minimal', level: 'error' },
 *   },
 *
 *   redact: ['password', 'token'],
 * });
 */
export interface LoggerConfigFile extends LoggerConfig, FormatterConfig {
    /** Per-level formatter overrides */
    levels?: PerLevelConfig;
    /** Per-environment overrides keyed by NODE_ENV value */
    env?: PerEnvConfig;
}

/**
 * Logger instance interface
 */
export interface Logger {
    // Core logging methods — LogCallOptions is always the last optional param
    trace(
        message: string,
        context?: LogContext,
        options?: LogCallOptions
    ): void;
    debug(
        message: string,
        context?: LogContext,
        options?: LogCallOptions
    ): void;
    log(message: string, context?: LogContext, options?: LogCallOptions): void;
    info(message: string, context?: LogContext, options?: LogCallOptions): void;
    warn(message: string, context?: LogContext, options?: LogCallOptions): void;
    error(
        message: string,
        error?: Error | LogContext,
        context?: LogContext,
        options?: LogCallOptions
    ): void;
    fatal(
        message: string,
        error?: Error | LogContext,
        context?: LogContext,
        options?: LogCallOptions
    ): void;

    // Context management
    child(context: LogContext): Logger;
    withContext(context: LogContext): Logger;

    /**
     * Returns a scoped logger that applies the given call options to every log
     * method invoked on it — without touching the underlying logger config.
     *
     * @example
     * const loud = logger.with({ mode: 'pretty', emphasisErrors: true });
     * loud.info('Deployment started', { version: '2.1.0' });
     * loud.warn('Config override active');
     */
    with(options: LogCallOptions): Logger;

    // Configuration
    setLevel(level: LogLevelName): void;
    getLevel(): LogLevelName;
    isLevelEnabled(level: LogLevelName): boolean;

    // Lifecycle
    flush(): Promise<void>;
    close(): Promise<void>;
}

/**
 * Redaction options
 */
export interface RedactionOptions {
    paths: string[];
    censor?: string;
    remove?: boolean;
}

/**
 * Serialization options
 */
export interface SerializationOptions {
    maxDepth?: number;
    maxStringLength?: number;
    maxArrayLength?: number;
    circularRef?: string;
    bigIntMode?: 'string' | 'number';
}

/**
 * Performance metrics
 */
export interface LogMetrics {
    totalLogs: number;
    logsByLevel: Record<LogLevelName, number>;
    averageSerializationTime: number;
    droppedLogs: number;
}

/**
 * Formatter display modes
 */
export type FormatterMode = 'pretty' | 'compact' | 'minimal' | 'json';

/**
 * Advanced formatter configuration
 */
export interface FormatterConfig {
    /** Display mode */
    mode?: FormatterMode;

    /** Enable error emphasis (automatic for error/fatal) */
    emphasisErrors?: boolean;

    /** Align context keys vertically */
    alignContext?: boolean;

    /** Group logs by requestId */
    groupByRequest?: boolean;

    /** Show visual separators */
    showSeparators?: boolean;

    /** Enable colors */
    colors?: boolean;

    /** Show timestamps (same options as LoggerConfig) */
    timestamp?: boolean | 'iso' | 'epoch';

    /** Maximum key width for alignment */
    maxKeyWidth?: number;

    /** Enable flow tracking visualization */
    flowTracking?: boolean;
}

/**
 * Value colorizer function type
 */
export type ValueColorizer = (value: unknown, key?: string) => string;

/**
 * Flow tracking entry
 */
export interface FlowEntry {
    requestId: string;
    timestamp: number;
    level: string;
    service: string;
    message: string;
    isLast?: boolean;
}

/**
 * Flow state for tracking request flows
 */
export interface FlowState {
    activeFlows: Map<string, FlowEntry[]>;
    lastRequestId?: string;
}

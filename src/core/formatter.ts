// src/core/formatter.ts

import type {
    FlowState,
    Formatter,
    FormatterConfig,
    LogCallOptions,
    LogEntry,
    LogLevelName,
} from '../types';
import { LEVEL_COLORS } from './levels';

// ─── ANSI helpers ─────────────────────────────────────────────────────────────

const COLORS = {
    gray: '\x1b[90m',
    white: '\x1b[37m',
    brightWhite: '\x1b[97m',
    red: '\x1b[31m',
    brightRed: '\x1b[91m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
    bgRed: '\x1b[41m',
};

const BOX = {
    horizontal: '─',
    horizontalBold: '━',
    vertical: '│',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    tee: '├',
    teeLast: '└',
    cross: '┼',
};

const ICONS: Record<LogLevelName, string> = {
    trace: '◦',
    debug: '◉',
    log: '●',
    info: '✓',
    warn: '⚠',
    error: '✖',
    fatal: '⨯',
};

// ─── JsonFormatter ────────────────────────────────────────────────────────────

/**
 * JSON formatter — outputs structured JSON logs.
 * The internal `$callOptions` field is stripped automatically.
 */
export class JsonFormatter implements Formatter {
    format(entry: LogEntry): string {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { $callOptions, ...clean } = entry;
        return JSON.stringify(clean);
    }
}

// ─── AdvancedFormatter ────────────────────────────────────────────────────────

/**
 * Full required config (all fields resolved)
 */
type ResolvedFormatterConfig = Required<FormatterConfig>;

/**
 * Advanced flow-structured formatter.
 *
 * Per-call overrides are picked up from `entry.$callOptions` and merged on
 * top of the instance config for the duration of that single `format()` call.
 * The `$callOptions` field is stripped before any output is produced.
 */
export class AdvancedFormatter implements Formatter {
    private config: ResolvedFormatterConfig;
    private flowState: FlowState;

    constructor(config: FormatterConfig = {}) {
        this.config = {
            mode: config.mode ?? 'pretty',
            emphasisErrors: config.emphasisErrors !== false,
            alignContext: config.alignContext !== false,
            groupByRequest: config.groupByRequest ?? false,
            showSeparators: config.showSeparators !== false,
            colors: config.colors !== false,
            timestamp: config.timestamp !== false,
            maxKeyWidth: config.maxKeyWidth ?? 15,
            flowTracking: config.flowTracking ?? false,
        };

        this.flowState = { activeFlows: new Map() };
    }

    format(entry: LogEntry): string {
        // ── 1. Strip the internal $callOptions field ──────────────────────────
        const { $callOptions, ...cleanEntry } = entry;

        // ── 2. Resolve effective config for this call ─────────────────────────
        //    Per-call options win over instance config.
        const effectiveConfig = this.resolveConfig($callOptions);

        return this.formatWith(cleanEntry as LogEntry, effectiveConfig);
    }

    /**
     * Merge per-call overrides on top of the instance config.
     * Only the fields present in LogCallOptions are eligible for override.
     */
    private resolveConfig(
        callOptions?: LogCallOptions
    ): ResolvedFormatterConfig {
        if (!callOptions) return this.config;

        return {
            ...this.config,
            ...(callOptions.mode !== undefined && { mode: callOptions.mode }),
            ...(callOptions.emphasisErrors !== undefined && {
                emphasisErrors: callOptions.emphasisErrors,
            }),
            ...(callOptions.colors !== undefined && {
                colors: callOptions.colors,
            }),
            ...(callOptions.timestamp !== undefined && {
                timestamp: callOptions.timestamp,
            }),
        };
    }

    /**
     * Core formatting — uses `config` for all rendering decisions.
     */
    private formatWith(
        entry: LogEntry,
        config: ResolvedFormatterConfig
    ): string {
        const { emphasisErrors, mode } = config;

        if (
            emphasisErrors &&
            (entry.level === 'error' || entry.level === 'fatal')
        ) {
            return this.formatErrorAttention(entry, config);
        }

        switch (mode) {
            case 'compact':
                return this.formatCompact(entry, config);
            case 'minimal':
                return this.formatMinimal(entry, config);
            case 'json':
                return JSON.stringify(entry);
            case 'pretty':
            default:
                return this.formatPretty(entry, config);
        }
    }

    // ── Mode renderers ────────────────────────────────────────────────────────

    private formatPretty(
        entry: LogEntry,
        config: ResolvedFormatterConfig
    ): string {
        const { timestamp, level, message, ...context } = entry;
        const lines: string[] = [];

        const service = context['service'] || context['component'];
        const requestId = context['requestId'] || context['traceId'];

        lines.push(
            this.buildHeader(
                timestamp,
                level,
                service as string,
                requestId as string,
                config
            )
        );

        if (config.showSeparators) {
            lines.push(
                this.colorize(BOX.horizontal.repeat(50), COLORS.gray, config)
            );
        }

        lines.push(this.colorize(message, COLORS.brightWhite, config));

        const contextToShow = this.filterContext(context, [
            'service',
            'component',
            'requestId',
            'traceId',
        ]);

        if (Object.keys(contextToShow).length > 0) {
            lines.push(this.formatContext(contextToShow, config));
        }

        if (config.flowTracking && requestId) {
            const flowViz = this.updateFlow(requestId as string, entry);
            if (flowViz) {
                lines.push('');
                lines.push(flowViz);
            }
        }

        return lines.join('\n');
    }

    private formatErrorAttention(
        entry: LogEntry,
        config: ResolvedFormatterConfig
    ): string {
        const { timestamp, level, message, error, ...context } = entry;
        const lines: string[] = [];
        const width = 60;

        lines.push(
            this.colorize(BOX.horizontalBold.repeat(width), COLORS.red, config)
        );

        const service = context['service'] || context['component'];
        const requestId = context['requestId'] || context['traceId'];
        lines.push(
            this.colorize(
                this.buildHeader(
                    timestamp,
                    level,
                    service as string,
                    requestId as string,
                    config
                ),
                COLORS.red,
                config
            )
        );

        lines.push(
            this.colorize(BOX.horizontalBold.repeat(width), COLORS.red, config)
        );
        lines.push('');

        const icon = ICONS[level];
        lines.push(
            `${this.colorize(icon, COLORS.red, config)} ${this.colorize(
                message,
                COLORS.brightRed + COLORS.bold,
                config
            )}`
        );
        lines.push('');

        const contextToShow = this.filterContext(context, [
            'service',
            'component',
            'requestId',
            'traceId',
            'error',
        ]);
        if (Object.keys(contextToShow).length > 0) {
            lines.push(this.colorize('Context', COLORS.bold, config));
            lines.push(this.formatContext(contextToShow, config, 2));
            lines.push('');
        }

        if (error && typeof error === 'object') {
            const errorObj = error as Record<string, unknown>;

            if (errorObj['stack']) {
                lines.push(this.colorize('Stack', COLORS.bold, config));
                const stackLines = String(errorObj['stack'])
                    .split('\n')
                    .slice(1, 6);
                stackLines.forEach((line) => {
                    lines.push(
                        this.colorize('  ' + line.trim(), COLORS.gray, config)
                    );
                });
                lines.push('');
            }

            const errorDetails = { ...errorObj };
            delete errorDetails['stack'];
            delete errorDetails['message'];
            delete errorDetails['name'];

            if (Object.keys(errorDetails).length > 0) {
                lines.push(this.colorize('Error Details', COLORS.bold, config));
                lines.push(this.formatContext(errorDetails, config, 2));
                lines.push('');
            }
        }

        lines.push(
            this.colorize(BOX.horizontalBold.repeat(width), COLORS.red, config)
        );

        return lines.join('\n');
    }

    private formatCompact(
        entry: LogEntry,
        config: ResolvedFormatterConfig
    ): string {
        const { timestamp, level, message, ...context } = entry;
        const parts: string[] = [];

        if (config.timestamp && timestamp) {
            parts.push(
                this.colorize(
                    this.formatTime(timestamp, true),
                    COLORS.gray,
                    config
                )
            );
        }

        const levelStr = level.toUpperCase().padEnd(5);
        parts.push(this.colorize(levelStr, this.getLevelColor(level), config));

        const service = context['service'] || context['component'];
        if (service) {
            parts.push(this.colorize(String(service), COLORS.gray, config));
        }

        const requestId = context['requestId'] || context['traceId'];
        if (requestId) {
            parts.push(this.colorize(String(requestId), COLORS.gray, config));
        }

        parts.push(this.colorize('→', COLORS.gray, config));
        parts.push(message);

        const contextToShow = this.filterContext(context, [
            'service',
            'component',
            'requestId',
            'traceId',
        ]);
        if (Object.keys(contextToShow).length > 0) {
            parts.push(
                this.colorize(
                    this.formatContextInline(contextToShow),
                    COLORS.gray,
                    config
                )
            );
        }

        return parts.join(' ');
    }

    private formatMinimal(
        entry: LogEntry,
        config: ResolvedFormatterConfig
    ): string {
        const { timestamp, level, message, ...context } = entry;
        const parts: string[] = [];

        if (config.timestamp && timestamp) {
            parts.push(
                this.colorize(
                    this.formatTime(timestamp, true),
                    COLORS.gray,
                    config
                )
            );
        }

        const service = context['service'] || context['component'];
        if (service) {
            parts.push(
                this.colorize(String(service).padEnd(15), COLORS.gray, config)
            );
        }

        parts.push(
            this.colorize(ICONS[level], this.getLevelColor(level), config)
        );

        parts.push(message);

        return parts.join('  ');
    }

    // ── Shared rendering helpers ──────────────────────────────────────────────

    private buildHeader(
        timestamp: string | number | undefined,
        level: LogLevelName,
        service?: string,
        requestId?: string,
        config?: ResolvedFormatterConfig
    ): string {
        const cfg = config ?? this.config;
        const parts: string[] = [];

        if (cfg.timestamp && timestamp) {
            parts.push(
                this.colorize(this.formatTime(timestamp), COLORS.gray, cfg)
            );
        }

        parts.push(
            this.colorize(
                level.toUpperCase().padEnd(7),
                this.getLevelColor(level),
                cfg
            )
        );

        if (service) {
            parts.push(
                this.colorize(String(service).padEnd(15), COLORS.blue, cfg)
            );
        }
        if (requestId) {
            parts.push(this.colorize(String(requestId), COLORS.cyan, cfg));
        }

        return parts.join('  ');
    }

    private formatContext(
        context: Record<string, unknown>,
        config: ResolvedFormatterConfig,
        indent = 2
    ): string {
        const lines: string[] = [];
        const entries = Object.entries(context);
        if (entries.length === 0) return '';

        const maxKeyWidth = config.alignContext
            ? Math.min(
                  Math.max(...entries.map(([key]) => key.length)),
                  config.maxKeyWidth
              )
            : 0;

        for (const [key, value] of entries) {
            const paddedKey = config.alignContext
                ? key.padEnd(maxKeyWidth)
                : key;
            const keyStr = this.colorize(paddedKey, COLORS.gray, config);
            const sep = this.colorize(':', COLORS.gray, config);
            const valStr = this.colorizeValue(value, config);
            const indentStr = ' '.repeat(indent);
            lines.push(`${indentStr}${keyStr} ${sep} ${valStr}`);
        }

        return lines.join('\n');
    }

    private formatContextInline(context: Record<string, unknown>): string {
        const pairs = Object.entries(context).map(([key, value]) => {
            const v =
                typeof value === 'string'
                    ? `"${value}"`
                    : JSON.stringify(value);
            return `${key}:${v}`;
        });
        return `{ ${pairs.join(', ')} }`;
    }

    private colorizeValue(
        value: unknown,
        config: ResolvedFormatterConfig
    ): string {
        if (value === null) return this.colorize('null', COLORS.gray, config);
        if (value === undefined)
            return this.colorize('undefined', COLORS.gray, config);

        switch (typeof value) {
            case 'string':
                return this.colorize(String(value), COLORS.green, config);
            case 'number':
                return this.colorize(String(value), COLORS.cyan, config);
            case 'boolean':
                return this.colorize(String(value), COLORS.magenta, config);
            case 'object':
                return this.colorize(
                    Array.isArray(value)
                        ? `[${(value as unknown[]).length} items]`
                        : JSON.stringify(value),
                    COLORS.gray,
                    config
                );
            default:
                return this.colorize(String(value), COLORS.white, config);
        }
    }

    private formatTime(timestamp: string | number, short = false): string {
        const date =
            typeof timestamp === 'number'
                ? new Date(timestamp)
                : new Date(timestamp);

        const iso = date.toISOString().split('T')[1] ?? '';
        return short ? (iso.split('.')[0] ?? '') : iso.substring(0, 12);
    }

    private getLevelColor(level: LogLevelName): string {
        if (level === 'error' || level === 'fatal')
            return COLORS.red + COLORS.bold;
        if (level === 'warn') return COLORS.yellow + COLORS.bold;
        return LEVEL_COLORS[level] || COLORS.white;
    }

    private filterContext(
        context: Record<string, unknown>,
        exclude: string[]
    ): Record<string, unknown> {
        const filtered: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(context)) {
            if (!exclude.includes(key)) filtered[key] = value;
        }
        return filtered;
    }

    private updateFlow(requestId: string, entry: LogEntry): string | null {
        if (!this.flowState.activeFlows.has(requestId)) {
            this.flowState.activeFlows.set(requestId, []);
        }

        const flow = this.flowState.activeFlows.get(requestId)!;
        flow.push({
            requestId,
            timestamp: Date.now(),
            level: entry.level,
            service: String(entry['service'] || entry['component'] || ''),
            message: entry.message,
        });

        if (flow.length < 2) return null;

        const lines: string[] = [];
        const lastIndex = flow.length - 1;

        flow.forEach((flowEntry, index) => {
            const isLast = index === lastIndex;
            const prefix = isLast ? BOX.teeLast : BOX.tee;
            lines.push(
                this.colorize(
                    `${prefix}─ ${flowEntry.message}`,
                    COLORS.gray,
                    this.config
                )
            );
            if (!isLast) {
                lines.push(
                    this.colorize(BOX.vertical, COLORS.gray, this.config)
                );
            }
        });

        if (flow.length > 10) {
            this.flowState.activeFlows.set(requestId, flow.slice(-10));
        }

        return lines.join('\n');
    }

    private colorize(
        text: string,
        color: string,
        config?: ResolvedFormatterConfig
    ): string {
        if (!(config ?? this.config).colors) return text;
        return `${color}${text}${COLORS.reset}`;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    configure(config: Partial<FormatterConfig>): void {
        Object.assign(this.config, config);
    }

    getConfig(): FormatterConfig {
        return { ...this.config };
    }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAdvancedFormatter(
    config?: FormatterConfig
): AdvancedFormatter {
    return new AdvancedFormatter(config);
}

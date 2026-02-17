// src/index.ts

import { tryAutoLoad } from './autoload';
import { getFormatterConfig, getLoggerConfig, onConfigDefined } from './config';
import { AdvancedFormatter, createAdvancedFormatter } from './core/formatter';
import { createLogger } from './core/logger';
import type { FormatterConfig, Logger, LoggerConfig } from './types';

export { defineConfig } from './config';
export {
    AdvancedFormatter,
    createAdvancedFormatter,
    JsonFormatter,
} from './core/formatter';
export { createLogger } from './core/logger';
export { ConsoleTransport } from './transports/console';
export { FileTransport } from './transports/file';
export * from './types';
export { Redactor } from './utils/redactor';
export { Serializer } from './utils/serializer';

// ─── Auto-load ────────────────────────────────────────────────────────────────
// Runs once at module initialization time, before any consumer code executes.
// Scans process.cwd() for a logger.config.{ts,js,mjs,cjs} file and loads it.
//
// To opt out:  LOGGER_NO_AUTOLOAD=true node ...
// To override: simply call defineConfig() in your own code — last call wins.

tryAutoLoad();

// ─── Global csl logger ────────────────────────────────────────────────────────

/**
 * Default global logger.  Works out of the box — zero config required.
 *
 * If a `logger.config.ts` (or .js / .mjs / .cjs) exists at the project root,
 * it is loaded automatically when this package is first imported.  No explicit
 * import of the config file is needed anywhere in your application.
 *
 * @example
 * ```ts
 * // No setup required in any file — just import and use
 * import { csl } from '@ais-forge/logger';
 *
 * csl.info('Server started', { port: 3000 });
 * csl.error('DB failed', error, { host: 'localhost' });
 *
 * // Per-call mode override
 * csl.info('Verbose step', { data }, { mode: 'pretty' });
 *
 * // Scoped override for multiple calls
 * const loud = csl.with({ mode: 'pretty', emphasisErrors: true });
 * loud.warn('Cache miss', { key: 'user:42' });
 * ```
 */
export const csl: Logger = createLogger();

// Wire defineConfig() → csl automatically
onConfigDefined(() => {
    const loggerCfg = getLoggerConfig();
    const fmtCfg = getFormatterConfig();
    const formatter = fmtCfg ? createAdvancedFormatter(fmtCfg) : undefined;

    Object.assign(
        csl,
        createLogger({
            ...loggerCfg,
            ...(formatter && { formatter }),
        })
    );
});

// ─── configure / configureCsl ─────────────────────────────────────────────────

let _globalFormatter: AdvancedFormatter | null = null;

/** Imperatively configure the global csl formatter. */
export function configure(config: FormatterConfig): void {
    if (!_globalFormatter) {
        _globalFormatter = createAdvancedFormatter(config);
    } else {
        _globalFormatter.configure(config);
    }
    configureCsl({ formatter: _globalFormatter });
}

/** Imperatively configure the global csl logger. */
export function configureCsl(config: LoggerConfig): Logger {
    Object.assign(csl, createLogger(config));
    return csl;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export const presets = {
    development: (): Logger =>
        createLogger({
            level: 'debug',
            formatter: createAdvancedFormatter({
                mode: 'pretty',
                emphasisErrors: true,
                alignContext: true,
                showSeparators: true,
                colors: true,
                timestamp: true,
            }),
            timestamp: true,
        }),
    production: (): Logger =>
        createLogger({ level: 'info', pretty: false, timestamp: 'iso' }),
    testing: (): Logger => createLogger({ level: 'error', pretty: false }),
    silent: (): Logger => createLogger({ level: 'fatal', transports: [] }),
    compact: (): Logger =>
        createLogger({
            level: 'info',
            formatter: createAdvancedFormatter({
                mode: 'compact',
                colors: true,
                timestamp: true,
            }),
            timestamp: true,
        }),
    minimal: (): Logger =>
        createLogger({
            level: 'info',
            formatter: createAdvancedFormatter({
                mode: 'minimal',
                colors: true,
                timestamp: true,
            }),
            timestamp: true,
        }),
};

export default csl;

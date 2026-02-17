// src/config.ts

import type {
    FormatterConfig,
    LogCallOptions,
    LoggerConfig,
    LoggerConfigFile,
    LogLevelName,
    PerLevelConfig,
} from './types';

// ─── Resolved config ──────────────────────────────────────────────────────────

export interface ResolvedConfig extends LoggerConfig, FormatterConfig {
    levels?: PerLevelConfig;
}

// ─── Internal state ───────────────────────────────────────────────────────────

let _config: ResolvedConfig | null = null;

/**
 * Listeners registered by index.ts (or any other consumer).
 * Using a callback avoids circular imports between config.ts ↔ index.ts.
 */
type ConfigListener = (config: ResolvedConfig) => void;
const _listeners: ConfigListener[] = [];

// ─── defineConfig ─────────────────────────────────────────────────────────────

/**
 * Define the global logger configuration.
 *
 * Import your config file **once** at the top of your entry point — that's all.
 * The `csl` global logger is automatically reconfigured; no `loadConfig()` call
 * is required anywhere else in your application.
 *
 * @example
 * ```ts
 * // logger.config.ts
 * import { defineConfig } from '@ais-forge/logger';
 *
 * export default defineConfig({
 *   level: 'info',
 *   mode: 'pretty',
 *   emphasisErrors: true,
 *   alignContext: true,
 *   redact: ['password', 'token'],
 *
 *   levels: {
 *     trace: { mode: 'minimal' },
 *     debug: { mode: 'minimal' },
 *     info:  { mode: 'compact' },
 *     warn:  { mode: 'pretty'  },
 *     error: { mode: 'pretty', emphasisErrors: true },
 *     fatal: { mode: 'pretty', emphasisErrors: true },
 *   },
 *
 *   env: {
 *     production:  { mode: 'json',    level: 'warn',  colors: false },
 *     development: { mode: 'pretty',  level: 'debug', colors: true  },
 *     test:        { mode: 'minimal', level: 'error', colors: false },
 *   },
 * });
 *
 * // main.ts  ← entry point only
 * import './logger.config';               // ← one import, done
 * import { csl } from '@ais-forge/logger';
 *
 * csl.info('Server started');             // ← already configured
 *
 * // any-other-file.ts  ← no change needed
 * import { csl } from '@ais-forge/logger';
 * csl.debug('Doing something');           // ← just works
 * ```
 */
export function defineConfig(config: LoggerConfigFile): LoggerConfigFile {
    _config = resolveConfig(config);
    for (const listener of _listeners) {
        listener(_config);
    }
    return config;
}

// ─── Listener registration (used internally by index.ts) ──────────────────────

/**
 * Register a callback that fires:
 *   • immediately if defineConfig() was already called
 *   • on the next defineConfig() call otherwise
 *
 * This lets index.ts wire csl without a circular import.
 */
export function onConfigDefined(listener: ConfigListener): void {
    _listeners.push(listener);
    if (_config) {
        listener(_config);
    }
}

// ─── Internal resolver ────────────────────────────────────────────────────────

function resolveConfig(config: LoggerConfigFile): ResolvedConfig {
    const { env, levels, ...base } = config;

    const currentEnv = process.env['NODE_ENV'] ?? 'development';
    const envOverride = env?.[currentEnv] ?? {};
    const {
        env: _e,
        levels: _l,
        ...safeEnvOverride
    } = envOverride as LoggerConfigFile;

    return {
        ...base,
        ...safeEnvOverride,
        ...(levels && { levels }),
    };
}

// ─── Public accessors ─────────────────────────────────────────────────────────

export function getResolvedConfig(): ResolvedConfig | null {
    return _config;
}

export function getLevelCallOptions(
    level: LogLevelName
): LogCallOptions | undefined {
    return _config?.levels?.[level];
}

export function getLoggerConfig(): LoggerConfig | null {
    if (!_config) return null;
    const {
        mode: _a,
        emphasisErrors: _b,
        alignContext: _c,
        groupByRequest: _d,
        showSeparators: _e,
        colors: _f,
        maxKeyWidth: _g,
        flowTracking: _h,
        levels: _i,
        ...rest
    } = _config;
    return rest as LoggerConfig;
}

export function getFormatterConfig(): FormatterConfig | null {
    if (!_config) return null;
    const {
        mode,
        emphasisErrors,
        alignContext,
        groupByRequest,
        showSeparators,
        colors,
        timestamp,
        maxKeyWidth,
        flowTracking,
    } = _config;

    return {
        ...(mode !== undefined ? { mode } : {}),
        ...(emphasisErrors !== undefined ? { emphasisErrors } : {}),
        ...(alignContext !== undefined ? { alignContext } : {}),
        ...(groupByRequest !== undefined ? { groupByRequest } : {}),
        ...(showSeparators !== undefined ? { showSeparators } : {}),
        ...(colors !== undefined ? { colors } : {}),
        ...(timestamp !== undefined ? { timestamp } : {}),
        ...(maxKeyWidth !== undefined ? { maxKeyWidth } : {}),
        ...(flowTracking !== undefined ? { flowTracking } : {}),
    };
}

/** Reset global config — useful in tests */
export function resetConfig(): void {
    _config = null;
}

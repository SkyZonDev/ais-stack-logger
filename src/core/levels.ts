// src/core/levels.ts

import { LogLevel, type LogLevelName } from '../types';

/**
 * Mapping from level names to numeric values
 */
export const LEVEL_VALUES: Record<LogLevelName, LogLevel> = {
    trace: LogLevel.TRACE,
    debug: LogLevel.DEBUG,
    log: LogLevel.LOG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
    fatal: LogLevel.FATAL,
};

/**
 * Mapping from numeric values to level names
 */
export const LEVEL_NAMES: Record<LogLevel, LogLevelName> = {
    [LogLevel.TRACE]: 'trace',
    [LogLevel.DEBUG]: 'debug',
    [LogLevel.LOG]: 'log',
    [LogLevel.INFO]: 'info',
    [LogLevel.WARN]: 'warn',
    [LogLevel.ERROR]: 'error',
    [LogLevel.FATAL]: 'fatal',
};

/**
 * ANSI color codes for pretty printing
 */
export const LEVEL_COLORS: Record<LogLevelName, string> = {
    trace: '\x1b[90m', // Gray
    debug: '\x1b[36m', // Cyan
    log: '\x1b[37m', // White
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    fatal: '\x1b[35m', // Magenta
};

export const RESET_COLOR = '\x1b[0m';

/**
 * Check if a level should be logged based on minimum level
 */
export function isLevelEnabled(
    level: LogLevelName,
    minLevel: LogLevelName
): boolean {
    return LEVEL_VALUES[level] >= LEVEL_VALUES[minLevel];
}

/**
 * Get level name from numeric value
 */
export function getLevelName(level: LogLevel): LogLevelName {
    return LEVEL_NAMES[level] || 'info';
}

/**
 * Get numeric value from level name
 */
export function getLevelValue(level: LogLevelName): LogLevel {
    return LEVEL_VALUES[level] || LogLevel.INFO;
}

/**
 * Validate level name
 */
export function isValidLevel(level: string): level is LogLevelName {
    return level in LEVEL_VALUES;
}

/**
 * Get environment-appropriate default level
 */
export function getDefaultLevel(): LogLevelName {
    const env = process.env.NODE_ENV;
    const logLevel = process.env.LOG_LEVEL;

    if (logLevel && isValidLevel(logLevel)) {
        return logLevel;
    }

    switch (env) {
        case 'production':
            return 'info';
        case 'test':
            return 'error';
        case 'development':
        default:
            return 'debug';
    }
}

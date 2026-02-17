// src/autoload.ts

import * as fs from 'fs';
import * as path from 'path';

/**
 * Config file names scanned in order, relative to process.cwd().
 * First match wins.
 */
const CONFIG_CANDIDATES = [
    'logger.config.ts', // ts-node / tsx / bun
    'logger.config.js',
    'logger.config.mjs',
    'logger.config.cjs',
    'logger.config', // extension-less (rare but valid in some bundlers)
];

/**
 * Directories to scan, in order of priority.
 * Useful for monorepos where the config can live at the package root or workspace root.
 */
const SCAN_DIRS = [
    process.cwd(), // package root (most common)
    path.join(process.cwd(), 'src'), // src/logger.config.ts
    path.join(process.cwd(), 'config'), // config/logger.config.ts
];

/**
 * Try to auto-load the logger config file.
 *
 * Returns the resolved path if a config was found and loaded, or null.
 * Errors in the config file itself (syntax errors, runtime errors) are
 * re-thrown so they are never silently swallowed.
 *
 * Opt-out: set LOGGER_NO_AUTOLOAD=true in your environment.
 */
export function tryAutoLoad(): string | null {
    // Escape hatch — useful in environments that manage config differently
    if (process.env['LOGGER_NO_AUTOLOAD'] === 'true') {
        return null;
    }

    for (const dir of SCAN_DIRS) {
        for (const name of CONFIG_CANDIDATES) {
            const fullPath = path.join(dir, name);

            if (!fs.existsSync(fullPath)) continue;

            try {
                // biome-ignore lint: This dynamic require is intentional for autoloading configs.
                require(fullPath);
                return fullPath;
            } catch (err) {
                // MODULE_NOT_FOUND can happen when the file exists on disk but one
                // of *its* dependencies is missing — surface that, don't swallow it.
                if (
                    err instanceof Error &&
                    (err as NodeJS.ErrnoException).code ===
                        'MODULE_NOT_FOUND' &&
                    !(err as NodeJS.ErrnoException).message?.includes(fullPath)
                ) {
                    throw err;
                }
                // Any other runtime error in the config file should also surface.
                if (
                    err instanceof Error &&
                    (err as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND'
                ) {
                    throw err;
                }
                // File truly not found at this path — try next candidate
                continue;
            }
        }
    }

    return null;
}

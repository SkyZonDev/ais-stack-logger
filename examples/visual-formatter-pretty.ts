// examples/visual-formatter-pretty.ts
//
// 1. PRETTY MODE (Flow Structured) - Default for development

import { createAdvancedFormatter, createLogger } from '../src';

export function runPrettyModeDemo(): void {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('        @ais-forge/logger - Visual Demo');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📋 MODE 1: PRETTY (Flow Structured)\n');
    console.log('Best for: Development, debugging, human-readable logs\n');

    const prettyLogger = createLogger({
        formatter: createAdvancedFormatter({
            mode: 'pretty',
            emphasisErrors: false,
            alignContext: true,
            showSeparators: true,
            colors: true,
            timestamp: true,
        }),
        context: {
            service: 'auth-service',
            version: '1.2.0',
        },
    });

    prettyLogger.info('User login successful', {
        requestId: 'req-abc123',
        userId: 42,
        ip: '192.168.1.10',
        duration: 12,
        method: 'POST',
    });

    console.log('\n');

    prettyLogger.debug('Token validation started', {
        requestId: 'req-abc123',
        tokenType: 'JWT',
        expiresIn: 3600,
    });

    console.log('\n');
}

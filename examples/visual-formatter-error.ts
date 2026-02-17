// examples/visual-formatter-error.ts
//
// 2. ERROR ATTENTION MODE (Automatic for errors)

import { createAdvancedFormatter, createLogger } from '../src';

export function runErrorAttentionDemo(): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🚨 MODE 2: ERROR ATTENTION (Automatic)\n');
    console.log(
        'Best for: Errors and fatal issues that need immediate attention\n'
    );

    const errorLogger = createLogger({
        formatter: createAdvancedFormatter({
            mode: 'pretty',
            emphasisErrors: true, // This triggers special formatting for errors
            alignContext: true,
            colors: true,
            timestamp: true,
        }),
        context: {
            service: 'db-service',
            version: '2.0.1',
        },
    });

    const dbError = new Error('Connection timeout');
    dbError.stack = `Error: Connection timeout
    at connect (db.ts:45:12)
    at initialize (db.ts:23:5)
    at startServer (app.ts:12:3)
    at main (index.ts:8:1)`;

    errorLogger.error('Database connection failed', dbError, {
        requestId: 'req-xyz789',
        host: 'localhost',
        port: 5432,
        retry: true,
        timeout: 5000,
    });

    console.log('\n');
}

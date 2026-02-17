// examples/visual-formatter-compact.ts
//
// 3. COMPACT MODE (High volume)

import { createAdvancedFormatter, createLogger } from '../src';

export function runCompactModeDemo(): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📦 MODE 3: COMPACT\n');
    console.log('Best for: High-volume logs, production, grep-friendly\n');

    const compactLogger = createLogger({
        formatter: createAdvancedFormatter({
            mode: 'compact',
            colors: true,
            timestamp: true,
        }),
        context: {
            service: 'api-gateway',
        },
    });

    compactLogger.info('Request received', {
        requestId: 'req-001',
        method: 'GET',
        path: '/api/users',
        ip: '10.0.1.5',
    });

    compactLogger.info('Database query executed', {
        requestId: 'req-001',
        query: 'SELECT * FROM users',
        duration: 45,
    });

    compactLogger.info('Response sent', {
        requestId: 'req-001',
        statusCode: 200,
        duration: 52,
    });

    console.log('\n');
}

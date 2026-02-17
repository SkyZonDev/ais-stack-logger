// examples/visual-formatter-minimal.ts
//
// 4. MINIMAL MODE (Ultra clean - Vercel/Raycast style)

import { createAdvancedFormatter, createLogger } from '../src';

export function runMinimalModeDemo(): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ MODE 4: MINIMAL\n');
    console.log('Best for: Clean terminal output, CI/CD logs\n');

    const minimalLogger = createLogger({
        formatter: createAdvancedFormatter({
            mode: 'minimal',
            colors: true,
            timestamp: true,
        }),
    });

    minimalLogger.info('Server started', {
        service: 'web-server',
        port: 3000,
    });

    minimalLogger.info('Database connected', {
        service: 'database',
        host: 'localhost',
    });

    minimalLogger.warn('Cache miss detected', {
        service: 'cache-service',
        key: 'user:123',
    });

    minimalLogger.error('Rate limit exceeded', {
        service: 'rate-limiter',
        ip: '192.168.1.100',
    });

    console.log('\n');
}

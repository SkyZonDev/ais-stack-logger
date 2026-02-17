// examples/visual-formatter-comparison.ts
//
// 8. COMPARISON DEMO

import { createAdvancedFormatter, createLogger } from '../src';

export function runComparisonDemo(): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔍 SIDE-BY-SIDE COMPARISON\n');

    const testData = {
        requestId: 'req-comparison',
        userId: 999,
        action: 'login',
        duration: 234,
        success: true,
    };

    console.log('\n→ PRETTY MODE:');
    const logger1 = createLogger({
        formatter: createAdvancedFormatter({
            mode: 'pretty',
            showSeparators: true,
        }),
    });
    logger1.info('Action completed', testData);

    console.log('\n→ COMPACT MODE:');
    const logger2 = createLogger({
        formatter: createAdvancedFormatter({ mode: 'compact' }),
    });
    logger2.info('Action completed', testData);

    console.log('\n→ MINIMAL MODE:');
    const logger3 = createLogger({
        formatter: createAdvancedFormatter({ mode: 'minimal' }),
    });
    logger3.info('Action completed', testData);

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('                   End of Demo');
    console.log('═══════════════════════════════════════════════════════\n');
}

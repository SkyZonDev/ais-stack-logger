// examples/visual-formatter-global-config.ts
//
// 6. GLOBAL CONFIGURATION

import { configure } from '../src';

export function runGlobalConfigDemo(): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚙️  GLOBAL CONFIGURATION\n');
    console.log('Configure all loggers at once using configure()\n');

    // Configure globally
    configure({
        mode: 'pretty',
        emphasisErrors: true,
        alignContext: true,
        groupByRequest: false,
        showSeparators: true,
        colors: true,
        timestamp: true,
        flowTracking: false,
    });

    console.log('Configuration applied globally!\n');
}

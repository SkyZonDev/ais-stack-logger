// examples/visual-formatter-presets.ts
//
// 7. PRESETS

import { presets } from '../src';

export function runPresetsDemo(): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎨 PRESETS\n');
    console.log('Quick configurations for common scenarios\n');

    console.log('Available presets:');
    console.log('  • presets.development() - Pretty mode with debug level');
    console.log('  • presets.production()  - JSON mode with info level');
    console.log('  • presets.compact()     - Compact mode for high volume');
    console.log('  • presets.minimal()     - Minimal mode, ultra clean');
    console.log('  • presets.testing()     - Error level only');
    console.log('  • presets.silent()      - No output');

    console.log('\n');

    // Optionally instantiate each preset once to showcase usage
    const devLogger = presets.development();
    const prodLogger = presets.production();
    const compactLogger = presets.compact();
    const minimalLogger = presets.minimal();
    const testingLogger = presets.testing();
    const silentLogger = presets.silent();

    devLogger.debug('Development preset active');
    prodLogger.info('Production preset active');
    compactLogger.info('Compact preset active');
    minimalLogger.info('Minimal preset active');
    testingLogger.error('Testing preset active');
    silentLogger.fatal('Silent preset active (no output expected)');

    console.log('\n');
}

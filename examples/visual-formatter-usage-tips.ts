// examples/visual-formatter-usage-tips.ts
//
// USAGE TIPS

export function printUsageTips(): void {
    console.log('💡 USAGE TIPS:\n');
    console.log('1. Use PRETTY mode during development for best readability');
    console.log('2. Use COMPACT mode in production for high-volume services');
    console.log('3. Use MINIMAL mode for clean CI/CD output');
    console.log('4. Errors automatically get emphasis - no config needed');
    console.log('5. Enable flowTracking to visualize request flows');
    console.log('6. Use presets for quick setup: presets.development()');
    console.log('7. Configure globally with configure({ mode: "pretty" })');
    console.log('\n');
}

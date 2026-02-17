// examples/visual-formatter-demo.ts
//
// Demo: Advanced Visual Formatting
//
// Ce fichier orchestre plusieurs petits fichiers de démo,
// chacun dédié à un mode / une fonctionnalité.
//
// Utilisation :
//   - ts-node examples/visual-formatter-demo.ts           → toutes les démos
//   - ts-node examples/visual-formatter-demo.ts pretty    → seulement PRETTY
//   - ts-node examples/visual-formatter-demo.ts compact   → seulement COMPACT
//   - ts-node examples/visual-formatter-demo.ts presets   → seulement PRESETS
//   - etc.

import { runCompactModeDemo } from './visual-formatter-compact';
import { runComparisonDemo } from './visual-formatter-comparison';
import { runErrorAttentionDemo } from './visual-formatter-error';
import { runFlowTrackingDemo } from './visual-formatter-flow-tracking';
import { runGlobalConfigDemo } from './visual-formatter-global-config';
import { runMinimalModeDemo } from './visual-formatter-minimal';
import { runPresetsDemo } from './visual-formatter-presets';
import { runPrettyModeDemo } from './visual-formatter-pretty';
import { printUsageTips } from './visual-formatter-usage-tips';

type DemoName =
    | 'pretty'
    | 'error'
    | 'compact'
    | 'minimal'
    | 'flow'
    | 'global-config'
    | 'presets'
    | 'comparison'
    | 'tips'
    | 'all';

const demos: Record<Exclude<DemoName, 'all'>, () => void> = {
    pretty: runPrettyModeDemo,
    error: runErrorAttentionDemo,
    compact: runCompactModeDemo,
    minimal: runMinimalModeDemo,
    flow: runFlowTrackingDemo,
    'global-config': runGlobalConfigDemo,
    presets: runPresetsDemo,
    comparison: runComparisonDemo,
    tips: printUsageTips,
};

export function runFullVisualDemo(): void {
    runPrettyModeDemo();
    runErrorAttentionDemo();
    runCompactModeDemo();
    runMinimalModeDemo();
    runFlowTrackingDemo();
    runGlobalConfigDemo();
    runPresetsDemo();
    runComparisonDemo();
    printUsageTips();
}

function printHelp(): void {
    console.log('\n@ais-forge/logger - Visual Demo\n');
    console.log('Usage:');
    console.log('  ts-node examples/visual-formatter-demo.ts [demo]');
    console.log('');
    console.log('Démos disponibles :');
    console.log('  pretty         → Mode PRETTY (développement)');
    console.log('  error          → Error Attention (erreurs mises en avant)');
    console.log('  compact        → Mode COMPACT (haut volume)');
    console.log('  minimal        → Mode MINIMAL (CI/CD, sortie épurée)');
    console.log(
        '  flow           → Flow Tracking (visualisation des requêtes)'
    );
    console.log('  global-config  → Configuration globale avec configure()');
    console.log('  presets        → Présets (development, production, etc.)');
    console.log('  comparison     → Comparaison côte à côte des modes');
    console.log('  tips           → Conseils d’utilisation');
    console.log('  all            → Toutes les démos (valeur par défaut)');
    console.log('');
}

function runSelectedDemo(name: DemoName): void {
    if (name === 'all') {
        runFullVisualDemo();
        return;
    }

    const demo = demos[name];
    if (!demo) {
        printHelp();
        return;
    }

    demo();
}

// Si le fichier est exécuté directement (via ts-node ou compilé),
// on lit l’argument de la CLI pour choisir la démo.
const arg = (process.argv[2] as DemoName | undefined) ?? 'all';
runSelectedDemo(arg);

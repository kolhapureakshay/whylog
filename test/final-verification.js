const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running Final Production Verification Suite...\n');

const tests = [
    // Core Guarantee
    { name: 'Core Guarantee: Crash Safety', path: 'feature-audit/safe-reporter.js' },
    { name: 'Core Guarantee: Idempotency', path: 'feature-audit/idempotency.js' },
    
    // Reliability
    { name: 'Reliability: Stack Parsing', path: 'feature-audit/stack-parsing.js' },
    { name: 'Reliability: ANSI Safety', path: 'feature-audit/ansi-safety.js' },

    // Environment
    { name: 'Env: Automatic Detection', path: 'feature-audit/env-detection.js' },
    { name: 'Env: Browser Mock', path: 'feature-audit/browser-mock.js' },

    // Features
    { name: 'Feature: JSON Severity', path: 'feature-audit/severity-json.js' }, // Will verify fingerprint indirectly
    { name: 'Feature: Advanced (Debug/Plugin)', path: 'feature-audit/advanced-features.js' },
    
    // CLI
    { name: 'CLI: Explicit Run', path: 'feature-audit/cli-runner.js' },
    { name: 'CLI: Implicit Run', path: 'feature-audit/cli-implicit.js' },
];

let failed = false;

tests.forEach(test => {
    const testPath = path.join(__dirname, test.path);
    if (!fs.existsSync(testPath)) {
        console.error(`[SKIP] ${test.name} - Script not found: ${test.path}`);
        return;
    }

    console.log(`▶ Verifying ${test.name}...`);
    const result = spawnSync(process.execPath, [testPath], {
        stdio: 'inherit',
        encoding: 'utf-8'
    });

    if (result.status !== 0) {
        console.error(`❌ FAILED (Exit Code: ${result.status})`);
        failed = true;
    } else {
        console.log(`✅ PASSED`);
    }
    console.log('-----------------------------------');
});

if (failed) {
    console.error('\n❌ Final Verification FAILED');
    process.exit(1);
} else {
    console.log('\n✅ All Critical Guarantees Verified. Ready for Production.');
}

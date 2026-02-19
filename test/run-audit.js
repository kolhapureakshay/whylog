const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tests = [
    'stack-parsing.js',
    'env-detection.js',
    'browser-mock.js',
    'ansi-safety.js',
    'idempotency.js',
    'severity-json.js',
    'advanced-features.js',
    'cli-runner.js',
    'cli-implicit.js'
];

console.log('Running Feature Audit Suite...\n');

let failed = false;

tests.forEach(test => {
    const testPath = path.join(__dirname, 'feature-audit', test);
    if (!fs.existsSync(testPath)) {
        console.error(`[SKIP] ${test} not found`);
        return;
    }

    console.log(`▶ Running ${test}...`);
    const result = spawnSync(process.execPath, [testPath], {
        stdio: 'inherit',
        encoding: 'utf-8'
    });

    if (result.status !== 0) {
        console.error(`❌ ${test} FAILED (Exit Code: ${result.status})`);
        failed = true;
    } else {
        console.log(`✅ ${test} PASSED`);
    }
    console.log('-----------------------------------');
});

if (failed) {
    console.error('\n❌ Audit Suite FAILED');
    process.exit(1);
} else {
    console.log('\n✅ Audit Suite PASSED');
}

const { getEnvInfo } = require('../../dist/platform/env');
const { ConfigManager } = require('../../dist/core/config');

console.log('Testing Environment Detection...');

// 1. Runtime Detection
const env = getEnvInfo();
if (env.runtime === 'Node') {
    console.log('[PASS] Runtime detected as Node');
} else {
    console.error(`[FAIL] Runtime detected as ${env.runtime}`);
    process.exit(1);
}

// 2. Serverless Detection (Mocking)
// We need to access the singleton or create a new instance if valid.
// ConfigManager is a singleton. We can't easily reset it fully without private access,
// but we can try to call update or check if we can mock process.env before it loads?
// It loads env in getInstance(). It might have already been loaded by other requires.
// Let's see if we can trick it or if we need to rely on `update` logic which also checks env.
// Wait, `update` in `config.ts` has:
// if (this.options.serverless === 'auto') { ... check process.env ... }

process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-func';
const config = ConfigManager.getInstance();

// Reset to auto to trigger detection logic if it runs on update?
// Actually update() re-evaluates if option is 'auto'.
config.update({ serverless: 'auto' });

if (config.isServerless) {
    console.log('[PASS] Serverless detected via AWS_LAMBDA_FUNCTION_NAME');
} else {
    console.error('[FAIL] Serverless NOT detected');
    process.exit(1);
}

// 3. Cleanup
delete process.env.AWS_LAMBDA_FUNCTION_NAME;
config.update({ serverless: 'auto' }); // Re-evaluate

if (!config.isServerless) {
    console.log('[PASS] Serverless correctly unset');
} else {
    console.error('[FAIL] Serverless still detected after cleanup');
    process.exit(1);
}

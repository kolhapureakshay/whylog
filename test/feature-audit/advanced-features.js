const { init, use } = require('../../dist/index');

console.log('Testing Advanced Features (Debug & Plugins)...');

const logs = [];
const originalLog = console.log;
console.log = (msg) => logs.push(msg);

// 1. Test Debug Mode
init({ debug: true });

// 2. Test Plugin
use({
    id: 'test-plugin',
    setup: (ctx) => {
        ctx.on('error', () => {});
        console.log('[whylog] Plugin initialized');
    }
});

// Restore console
console.log = originalLog;

// Verify
const debugMsg = logs.find(l => l.includes('Initializing and attaching listeners'));
const pluginMsg = logs.find(l => l.includes('Plugin initialized'));

if (debugMsg) {
    console.log('[PASS] Debug logging confirmed');
} else {
    console.error('[FAIL] Debug logging missing');
    logs.forEach(l => console.error('Log:', l));
    process.exit(1);
}

if (pluginMsg) {
    console.log('[PASS] Plugin system confirmed');
} else {
    console.error('[FAIL] Plugin initialization missing');
    process.exit(1);
}

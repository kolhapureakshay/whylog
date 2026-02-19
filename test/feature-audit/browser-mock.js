// Simulate Browser Environment
global.window = {
    onerror: null,
    onunhandledrejection: null
};

// We need to reload platform/index to pick up the new environment
// In CommonJS, we can delete from cache.
delete require.cache[require.resolve('../../dist/platform/index')];
delete require.cache[require.resolve('../../dist/core/bootstrap')];

const { attachListeners } = require('../../dist/platform/index');

console.log('Testing Browser Hooks...');

attachListeners();

if (typeof window.onerror === 'function') {
    console.log('[PASS] window.onerror hooked');
} else {
    console.error('[FAIL] window.onerror NOT hooked');
    process.exit(1);
}

if (typeof window.onunhandledrejection === 'function') {
    console.log('[PASS] window.onunhandledrejection hooked');
} else {
    console.error('[FAIL] window.onunhandledrejection NOT hooked');
    process.exit(1);
}

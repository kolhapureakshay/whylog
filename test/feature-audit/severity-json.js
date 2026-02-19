const { report } = require('../../dist/reporters/pretty');
const { config } = require('../../dist/core/config');

console.log('Testing JSON Severity...');

// Mock console.log to capture output
const originalLog = console.log;
let capturedOutput = '';
console.log = (msg) => { capturedOutput = msg; };

async function test() {
    config.update({ format: 'json', mode: 'prod' });

    // 1. Test Error
    await report(new Error('Test Error'), 'error');
    let json = JSON.parse(capturedOutput);
    
    if (json.severity === 'CRITICAL' && json.level === 'error' && json.fingerprint) {
        originalLog('[PASS] Error mapped to CRITICAL/error with fingerprint: ' + json.fingerprint);
    } else {
        originalLog('[FAIL] Error mapping wrong or missing fingerprint:', json);
        process.exit(1);
    }

    // 2. Test Warning
    await report(new Error('Test Warning'), 'warning');
    json = JSON.parse(capturedOutput);

    if (json.severity === 'WARNING' && json.level === 'warning') {
        originalLog('[PASS] Warning mapped to WARNING/warning');
    } else {
        originalLog('[FAIL] Warning mapping wrong:', json);
        process.exit(1);
    }
}

test().catch(e => {
    originalLog(e);
    process.exit(1);
}).finally(() => {
    console.log = originalLog;
});

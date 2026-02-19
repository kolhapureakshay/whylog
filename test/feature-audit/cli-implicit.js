const { spawn } = require('child_process');
const path = require('path');

console.log('Testing CLI Implicit Run...');

const cliPath = path.resolve(__dirname, '../../bin/whylog.js');
const scriptPath = path.resolve(__dirname, 'dummy-crash.js');

// Run WITHOUT 'run' command: whylog dummy-crash.js
const child = spawn(process.execPath, [cliPath, scriptPath], {
    stdio: 'pipe',
    env: { ...process.env, WHYLOG_MODE: 'dev', WHYLOG_COLOR: 'false' }
});

let output = '';
child.stdout.on('data', d => output += d.toString());
child.stderr.on('data', d => output += d.toString());

child.on('close', (code) => {
    if (code === 0) {
        console.error('[FAIL] CLI exited with 0 but script crashed');
        process.exit(1);
    }

    if (output.includes('CLI Crash Test') && output.includes('Why:')) {
        console.log('[PASS] CLI Implicit Run successful');
    } else {
        console.error('[FAIL] CLI output missing whylog content');
        console.error('Output:', output);
        process.exit(1);
    }
});

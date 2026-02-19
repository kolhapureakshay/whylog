const { getStyle } = require('../../dist/reporters/style');

console.log('Testing ANSI Safety...');

// 1. Default (TTY)
const ttyStyle = getStyle();
console.log('TTY Style Red:', ttyStyle.red('test').includes('\x1b') ? 'Has ANSI' : 'No ANSI');

// 2. Forced False
const noColorStyle = getStyle({ color: false });
if (noColorStyle.red('test') === 'test') {
    console.log('SUCCESS: Color:false disables ANSI');
} else {
    console.error('FAILURE: Color:false did not disable ANSI');
    process.exit(1);
}

// 3. Env Var
process.env.WHYLOG_COLOR = 'false';
const envNoColorStyle = getStyle();
if (envNoColorStyle.red('test') === 'test') {
    console.log('SUCCESS: WHYLOG_COLOR=false disables ANSI');
} else {
    console.error('FAILURE: WHYLOG_COLOR=false did not disable ANSI');
    process.exit(1);
}

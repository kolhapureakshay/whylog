const { parseStack } = require('../../dist/parsers/stack');

console.log('Testing Stack Parsing...');

const tests = [
    {
        name: 'Standard V8',
        stack: 'Error: foo\n    at Object.<anonymous> (G:\\projects\\whylog\\test.js:10:5)',
        check: (f) => f[0].file.includes('test.js') && f[0].line === 10
    },
    {
        name: 'Async',
        stack: 'Error: bar\n    at async main (file:///app/index.mjs:5:10)',
        check: (f) => f[0].file === 'file:///app/index.mjs' && f[0].line === 5
    },
    {
        name: 'Node Internal',
        stack: 'Error: baz\n    at node:internal/process/task_queues:96:5',
        check: (f) => f[0].isInternal === true
    },
    {
        name: 'No Function Name',
        stack: 'Error: qux\n    at G:\\projects\\whylog\\script.js:1:1',
        check: (f) => f[0].fn === '<anonymous>' && f[0].file.includes('script.js')
    }
];

let failed = false;

tests.forEach(t => {
   const frames = parseStack(t.stack);
   if (frames.length === 0) {
       console.error(`[FAIL] ${t.name}: No frames parsed`);
       failed = true;
       return;
   }
   
   if (t.check(frames)) {
       console.log(`[PASS] ${t.name}`);
   } else {
       console.error(`[FAIL] ${t.name}`);
       console.error('Parsed:', frames[0]);
       failed = true;
   }
});

if (failed) process.exit(1);

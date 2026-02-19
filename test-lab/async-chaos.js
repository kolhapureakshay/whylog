// test-lab/async-chaos.js
// Emits multiple types of errors rapidly

const EventEmitter = require('events');
const chaos = new EventEmitter();

// 1. Unhandled Rejection
setTimeout(() => {
    Promise.reject(new Error('Async Promise Rejection 1'));
}, 100);

// 2. Uncaught Exception just after
setTimeout(() => {
    throw new Error('Main Loop Crash!');
}, 200);

// 3. Warning
process.emitWarning('Memory leak detected', 'MemoryWarning');

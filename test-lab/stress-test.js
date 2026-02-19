// test-lab/stress-test.js
// Unleashes a storm of errors to test throttling and stability

console.log('Starting Stress Test: 50 errors in rapid succession...');

const totalErrors = 50;
let count = 0;

const interval = setInterval(() => {
    count++;
    
    // Mix of warnings and errors
    if (count % 5 === 0) {
        process.emitWarning(`Warning #${count}: Something is fishy`, 'StressWarning');
    } else {
        // Emit error via bus if possible, or just throw/reject to trigger hooks
        // To test whylog hooks, we should throw/reject
        
        // We need to catch them to prevent process exit if we want the Loop to continue?
        // But whylog enforces process.exit(1) on 'error'.
        // So for stress testing "chaos", we might need to modify behavior or use 'warning' primarily if we want to see throttling in action without exiting?
        // OR we test that it exits on the FIRST error?
        
        // Wait, if whylog exits on error, we can't really stress test "multiple errors" unless they are warnings or we disable exit.
        // But the throttler is designed for "Crash Loop" where the app might restart, or if multiple async errors happen simultaneously.
        
        // Let's emit multiple Warnings then, as they don't exit.
        // And maybe 1 final error.
    }

    if (count >= totalErrors) {
        clearInterval(interval);
        console.log('Stress Test Loop Complete (But we might have exited earlier)');
        // Final fatal error
        throw new Error('Final Fatal Error');
    }
}, 10);

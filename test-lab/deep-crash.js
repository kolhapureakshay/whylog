// test-lab/deep-crash.js
// Triggers a crash deep within a call stack to test frame filtering and context

function init() {
    layer1();
}

function layer1() {
    const config = { data: null };
    layer2(config);
}

function layer2(conf) {
    // Some logic
    process.nextTick(() => {
        layer3(conf);
    });
}

function layer3(conf) {
    // Array iteration to add noise to stack
    [1, 2, 3].forEach(n => {
        runner(n, conf);
    });
}

function runner(n, conf) {
    if (n === 3) {
        criticalOperation(conf);
    }
}

function criticalOperation(data) {
    // The Crash: Accessing property of null
    // Common "Cannot read properties of null (reading 'user')" error
    console.log(data.data.user.name);
}

init();

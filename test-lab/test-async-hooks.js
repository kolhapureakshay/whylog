const whylog = require('../dist/index');

whylog.init({
    mode: 'dev',
    format: 'pretty',
    asyncHooks: true // Enable native async stack stitching
});

function triggerAsyncCrash() {
    console.log("Testing Async Stack Stitching (v8 hooks)...");
    console.log("Wait 500ms for crash...");
    
    // Initial call site
    setTimeout(() => {
        processStageTwo();
    }, 200);
}

function processStageTwo() {
    // Another async boundary
    Promise.resolve().then(() => {
        // Deep nested crash
        throw new TypeError("undefined is not a function (async deep)");
    });
}

// Kickoff
triggerAsyncCrash();

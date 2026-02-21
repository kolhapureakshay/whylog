const http = require('http');
const whylog = require('../dist/index');
const { report } = require('../dist/reporters/pretty');

// Helper to gracefully check if Ollama is running on the local port
async function isOllamaRunning() {
    return new Promise((resolve) => {
        const req = http.get('http://127.0.0.1:11434/', (res) => {
            resolve(res.statusCode === 200); // Ollama returns 200 "Ollama is running"
        });
        req.on('error', () => resolve(false));
    });
}

// Reusable test case runner based on AI config
async function runAiTestCase(testCategory, testName, errorObj, aiConfig) {
    console.log(`\n======================================================`);
    console.log(`🤖 STARTING AI TEST: [${testCategory}] ${testName}`);
    console.log(`======================================================\n`);
    
    // Dynamically inject the AI settings to whylog
    whylog.init({
        mode: 'dev',
        format: 'pretty',
        ai: aiConfig
    });

    const modelName = aiConfig.model || 'default model';
    console.log(`Sending trace to [${aiConfig.provider.toUpperCase()}] Model: ${modelName}...\n`);
    
    // We use await to ensure chronological logging
    await report(errorObj, 'error');
    console.log(`\n✅ TEST COMPLETE: ${testName}\n`);
}

async function main() {
    console.log("🔍 Scanning for available AI Environments...\n");
    let aiConfig = null;

    // Determine the best available AI environment dynamically
    const ollamaActive = await isOllamaRunning();
    
    if (ollamaActive) {
        console.log("✅ Using Local Ollama (llama3) for tests");
        aiConfig = {
            enabled: true,
            provider: 'custom',
            endpoint: 'http://127.0.0.1:11434/v1/chat/completions',
            model: 'llama3:latest'
        };
    } else if (process.env.OPENAI_API_KEY) {
        console.log("✅ Using OpenAI (gpt-3.5-turbo) for tests");
        aiConfig = {
            enabled: true,
            provider: 'openai',
            apiKey: process.env.OPENAI_API_KEY
        };
    } else if (process.env.GEMINI_API_KEY) {
        console.log("✅ Using Google Gemini for tests");
        aiConfig = {
            enabled: true,
            provider: 'gemini',
            apiKey: process.env.GEMINI_API_KEY
        };
    } else if (process.env.ANTHROPIC_API_KEY) {
        console.log("✅ Using Anthropic Claude for tests");
        aiConfig = {
            enabled: true,
            provider: 'anthropic',
            apiKey: process.env.ANTHROPIC_API_KEY
        };
    } else {
         console.log("\n❌ No AI environments were available to test.");
         console.log("💡 Fix: Export an API key (e.g. `export OPENAI_API_KEY=sk-...`) OR start your local Ollama desktop app!");
         return;
    }

    // --- TEST 1: FRONTEND REACT ERROR ---
    const reactHooksError = new Error("Rendered more hooks than during the previous render.");
    reactHooksError.name = "ReactError";
    reactHooksError.stack = `ReactError: Rendered more hooks than during the previous render.
    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:14933:13)
    at mountIndeterminateComponent (node_modules/react-dom/cjs/react-dom.development.js:17811:13)
    at beginWork$1 (node_modules/react-dom/cjs/react-dom.development.js:19049:16)
    at performUnitOfWork (node_modules/react-dom/cjs/react-dom.development.js:22776:12)`;

    await runAiTestCase("FRONTEND", "React Hooks Misalignment", reactHooksError, aiConfig);

    // --- TEST 2: BACKEND DATABSE ERROR (PRISMA/SQL) ---
    const prismaError = new Error("Invalid `prisma.user.findUnique()` invocation:\n\nInconsistent column data: Conversion failed: Cannot parse \"2023-14-50\" as Date.");
    prismaError.stack = `Error: Invalid \`prisma.user.findUnique()\` invocation:
    at RequestHandler.handleRequestError (node_modules/@prisma/client/runtime/library.js:122:15)
    at RequestHandler.request (node_modules/@prisma/client/runtime/library.js:345:12)
    at async fetchUserMetrics (src/services/userService.ts:44:21)`;

    await runAiTestCase("BACKEND", "Prisma ORM Invalid Date Parse", prismaError, aiConfig);

    // --- TEST 3: BACKEND C++ NATIVE BINDING ERROR ---
    const nativeError = new Error("WebGL: INVALID_OPERATION: drawElements: attempt to access out of bounds arrays");
    nativeError.name = "WebGLCrash";
    nativeError.stack = `WebGLCrash: WebGL: INVALID_OPERATION: drawElements: attempt to access out of bounds arrays
    at renderLoop (src/graphics/glContext.js:412:12)
    at animate (src/graphics/engine.js:55:9)
    at window.requestAnimationFrame (browser/dom.js:10:4)`;

    await runAiTestCase("FRONTEND", "Three.js WebGL Bound Crash", nativeError, aiConfig);
    
    // --- TEST 4: JAVASCRIPT MEMORY HEAP ---
    const heapError = new Error("process out of memory");
    heapError.name = "FatalError";
    heapError.stack = `FatalError: process out of memory
    at Array.push (<anonymous>)
    at loadMassiveJSON (src/utils/fileLoader.js:88:24)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

    await runAiTestCase("BACKEND", "V8 Engine Heap OOM", heapError, aiConfig);

    console.log(`\n🎉 Test Suite Finished! All generic environments were successfully modeled through the AI engine.`);
}

main();

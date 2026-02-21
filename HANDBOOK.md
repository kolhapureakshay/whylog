# 📖 The Whylog Contributor & Architecture Handbook

Welcome to the internal mechanics of `whylog`. If you are completely new to the codebase, want to understand how the diagnostics engine works, or need to debug/extend its functionality, this is your ultimate guide.

This handbook explains the entire lifecycle of an error from the exact millisecond it is thrown, all the way to its beautiful terminal output or webhook delivery.

---

## 🏗️ 1. High-Level Architecture Flow

Before diving into files, it is crucial to understand the **Path of a Crash**. When an error occurs in an application using `whylog`, this is the exact journey it takes securely through the engine:

1. **The Interception**: Node.js globally emits an `uncaughtException` (or a framework like Express catches an error in middleware).
2. **Context Enrichment**: `whylog` pauses the crash to scrape the surrounding environment (What OS? What Node version? What HTTP request caused this? What were the last 15 UI clicks?).
3. **The Heuristic Mapper**: The error and its stack trace are passed through an array of RegEx/String rules. The engine attempts to find a deterministic match to explain _why_ it crashed.
4. **The AI Fallback**: If no static rules match _and_ AI is enabled, `whylog` securely POSTs the trace to a local or cloud LLM.
5. **Data Masking**: Before the data ever leaves the core engine, the Context and Payload are recursively scrubbed to obliterate passwords and tokens.
6. **The Reporter**: The engine formats the masked payload (either as a colorful Terminal UI with source code snippets, a JSON blob, or an HTML DOM overlay) and prints it.
7. **The Transports**: The final JSON payload is seamlessly shipped to any custom webhooks the user configured (e.g. Slack/Discord).

---

## 📂 2. Directory Breakdown & File Guide

Everything lives inside the `src/` directory.

### `src/index.ts` (The Entry Point)

This is the public API of the library. When a user runs `import { whylog } from 'whylog'`, this is what they are importing. It simply exports the `init()` function and the framework-specific adapters (Express, Koa, Fastify error handlers).

### `src/core/config.ts` (The Brain)

- **What it does:** A Singleton class that aggressively manages user configurations, environment variables (`process.env.WHYLOG_MODE`), and remote configuration fetching.
- **How to modify:** If you ever need to add a new option to `whylog.init({ ... })`, you must add it to the `WhylogOptions` typescript interface here and set a default value in the `ConfigManager`.

### `src/core/bootstrap.ts` (The Interceptor)

- **What it does:** This file contains the actual `init()` initialization logic. When a user calls `init()`, this file attaches native event listeners to the `process` (Node) or `window` (Browser) to globally intercept unhandled crashes and promises.
- **Code Flow:**
  1.  `init()` is called.
  2.  Sets up `process.on('uncaughtException', ...)` or `window.onerror`.
  3.  If configured, it calls `initAsyncTracker()` or `initBrowserTracker()`.
  4.  When an error fires, it passes the error directly to the `report()` function.

### `src/core/heuristics.ts` (The Translator)

- **What it does:** The heaviest logic piece of the codebase. It takes a raw `Error` object and maps it into an `InsightCard` (a plain-English explanation + an array of fix steps).
- **Code Flow:**
  1.  It loops through the user's `customRules` array first.
  2.  If no match, it loops through Whylog's built-in `rules` array.
  3.  If no match, it calls the **AI Explainer** (`explainWithAI`).
  4.  If the AI is disabled, it falls back to the generic `unknownRule`.

### `src/core/rules.ts` (The Dictionary)

- **What it does:** An enormous array of hard-coded heuristic definitions.
- **How to modify:** Whenever a new Javascript framework bug becomes popular (e.g., a specific Next.js caching crash), you open this file, add a new `Rule` object with a `pattern: (err) => boolean` matcher, and write a helpful `explanation` and `fix`.

### `src/core/breadcrumbs.ts` (The Historian)

- **What it does:** Manages a highly-performant Ring Buffer (an array with a maximum limit that overwrites old data). It tracks the timeline of application events.
- **How to modify:** The `addBreadcrumb()` function lives here. If you need to change how breadcrumbs are formatted or stored, this is the file.

### `src/core/context.ts` (The Detective)

- **What it does:** Scrapes system information (Node version, OS, browser user-agent) and provides a secure `maskData` utility.
- **How to modify:** If you want Whylog to automatically detect if a user is running inside Docker or Kubernetes, you would add the environment scraping logic to this file's `globalContext`.

### `src/core/fetch.ts` (The Cross-Platform Network Bridge)

- **What it does:** Because `whylog` strictly enforces a "Zero External Dependencies" rule, it cannot install `node-fetch`. This file provides a wildly clever native `makeRequest` wrapper. If the user is on a modern environment (Browser or Node 18+), it natively executes `fetch()`. If the user is on legacy Node 14 or 16, it dynamically falls back to the low-level C++ `require('http')`/`require('https')` core modules to reconstruct network requests perfectly. This ensures `whylog` runs safely on older servers without crashing.

---

## 🔌 3. The Plugin Architecture (`src/plugins/`)

Plugins are completely decoupled features that are conditionally loaded based on user configuration.

### `src/plugins/ai.ts` (The AI Engine)

- **What it does:** Contains the `explainWithAI()` function. It receives a trace, constructs a lightweight native `fetch` POST request, routes it based on the provider (`openai`, `gemini`, `anthropic`, `custom`), and parses the JSON response to extract the LLM's explanation and fix.

### `src/plugins/async-tracker.ts` (Node.js Stitcher)

- **What it does:** A highly advanced module utilizing Node's native `async_hooks` C++ API. It attaches a tracker to every single asynchronous operation (Timers, Promises, File IO). When a Promise crashes deeply inside a `.then()`, this file looks up the original function call ID in a Map and stitches the trace back together.

### `src/plugins/browser-tracker.ts` (Frontend Spy)

- **What it does:** Attaches passive listeners to the browser DOM (`document.addEventListener('click')`) and globally intercepts `window.fetch`. It pushes these actions directly into the `BreadcrumbTracker` array.

---

## 🎨 4. Reporters (`src/reporters/`)

Reporters take the fully enriched, explained, and masked `InsightCard` and display it to the user.

### `src/reporters/pretty.ts` (The Terminal UI)

- **What it does:** The most complex visual file. It handles parsing the stack trace, reading absolute File Paths from the user's hard drive to extract actual Source Code snippets (Smart Gutter), colorizing text using ANSI escape codes natively (no external chalk libraries), formatting breadcrumbs, and handling throttling.

### `src/reporters/json.ts` (The Production Wrapper)

- **What it does:** For production bounds, it bypasses terminal colors completely. It formats the crash into a strict JSON schema natively, and then asynchronously loops through the user configured `transports: []` array to fire off webhooks.

### `src/reporters/overlay.ts` (The Browser Modal)

- **What it does:** Since browsers don't have terminals, this file dynamically generates raw HTML DOM elements (`document.createElement('div')`), styles them via inline-CSS to look like a "Red Box of Death", injects the AI explanations and Breadcrumb trails into the HTML, and appends it globally to `document.body`.

---

## 🔧 Troubleshooting & Modifying the Codebase

### Q: Why isn't a webhook firing in Production?

1. Open `src/reporters/pretty.ts` and `src/reporters/json.ts`.
2. Ensure `transports` are securely mapped and wrapped in `try/catch`.
3. Check if the environment config `mode` is correctly resolving to `'prod'` inside `src/core/config.ts`. (Webhooks usually only fire via the JSON reporter payload engine).

### Q: I added a new Heuristic Rule, but it's not triggering.

1. Open `src/core/rules.ts` and ensure your `priority` number is higher than the fallback rules.
2. Check your RegEx in the `pattern` function. Remember that some errors come through as just standard `Error` instances, while others are typed (like `TypeError` or `SyntaxError`). Make sure you are checking `err.message` safely.

### Q: How do I test local changes without publishing to NPM?

1. Open up `/test-lab/` and modify `lab.js` or `test-ai-suite.js`.
2. Run `npm run build` to compile the TypeScript inside `/src/` into the `/dist/` folder.
3. Run `npm run lab` or `npm run test:ai` to immediately verify your changes without leaving the repository!

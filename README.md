# whylog

📦 npm: https://www.npmjs.com/package/whylog  
🐙 GitHub: https://github.com/kolhapureakshay/whylog

> **A deterministic, lightweight, universal diagnostic engine.**
> whylog intercepts runtime errors, explains the root cause in plain English, and provides actionable fixes—all with zero configuration.

![npm version](https://img.shields.io/npm/v/whylog?style=flat-square)
![npm downloads](https://img.shields.io/npm/dm/whylog?style=flat-square)
![License](https://img.shields.io/npm/l/whylog?style=flat-square)
![Build Status](https://img.shields.io/github/actions/workflow/status/whylog/whylog/ci.yml)

---

## 📑 Table of Contents

- [Features](#-features)
- [Diagnostic Gallery](#-diagnostic-gallery)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Reliability & Performance](#-reliability--performance)
- [Advanced Features](#-advanced-features)
- [Contributing](#-contributing)

---

## ✨ Features

- **Universal & Framework Agnostic**: Works consistently in Node.js (14+), Browsers, and Serverless (AWS/Vercel). Native adapters included for Express, Fastify, Koa, and React.
- **Zero Config**: Smart defaults auto-detect your environment (Dev vs. Prod).
- **Production Optimized**:
  - **Dev**: Beautiful, interactive output with code snippets and stack analysis.
  - **Prod**: Minimal, JSON-structured logs for ingestion tools (Datadog, Splunk).
  - **Serverless**: Zero-latency synchronous logging to ensure no logs are lost on freeze.
- **Chaos Management**:
  - **Data Masking**: Automatically scrubs sensitive `secrets` (`password`, `token`) from request contexts before they log.
  - **Remote Config Toggles**: Dynamically silence noisy crashes without tearing down internal Node processes via remote fetch URLs.
  - **Throttling**: Prevents log spam during burst failures.
  - **Deduplication**: Silences repetitive errors.
  - **Fingerprinting**: Generates unique hashes for error tracking.
  - **Warning Interception**: Captures and explains `process.emitWarning`.
- **Advanced Context Enrichment & Breadcrumbs**: Track up to N breadcrumbs/actions leading up to the crash and automatically extract HTTP context via framework adapters.
  - **DOM Timeline Replay (Browser)**: Instantly logs all user clicks and network fetches via a native tracker!
- **State-of-The-Art Trace Stitching**: Utilize V8 `async_hooks` to natively magically stitch broken async/await boundaries back together!
- **Customized Diagnostics**: Bring your own `customRules` to generate team-specific fixes, or fallback to the built-in **AI LLM Explainer** (`openai`) plugin for obscure framework crashes.
- **In-Browser Overlay**: An optional React/Vanilla 'Red Box of Death' floating modal that renders diagnostics right on the user's screen in development.
- **Pluggable Transports**: Send structured error reports automatically to Webhooks, Slack, or Datadog without heavy third-party shippers.
- **Deterministic Intelligence**: Modular heuristic engine that explains _why_ an error happened.

---

## 🖼 Diagnostic Gallery

### Recursion Limit Exceeded

```text
 ❌ RECURSION LIMIT EXCEEDED  Maximum call stack size exceeded

 📍 Location:
 src/recursion.js:5:3

 🧠 Why:
 The application is stuck in an infinite loop of function calls (recursion), consuming all available stack memory.

 📄 Source:
    4 | function infinite() {
    5 |   infinite();
      |   ^
    6 | }

 💡 How to Fix:
 • Check your recursive functions for a base case (exit condition).
 • Look for accidental circular calls between two functions.

 🪵 Stack:
    ↺ repeated 14392 times
 infinite (src/recursion.js:5:3)
```

---

## 📦 Installation

```bash
npm install whylog
```

### 🔧 Compatibility

| Platform       | Supported Versions  | Notes                          |
| :------------- | :------------------ | :----------------------------- |
| **Node.js**    | v14, v16, v18, v20+ | ESM & CommonJS supported.      |
| **Browsers**   | All Modern Browsers | Chrome, Firefox, Safari, Edge. |
| **Serverless** | AWS Lambda, Vercel  | Auto-detects environment.      |

---

## 🚀 Usage

### 1. CLI Runner (Zero-code Integration)

The easiest way to use whylog without changing your code.

```bash
npx whylog app.js
```

### 2. Zero-Config (ESM)

Import at the top of your entry file.

```javascript
import "whylog/register";

// Your application code...
```

### 3. Manual Initialization (CommonJS)

For more control over configuration.

```javascript
const whylog = require("whylog");

whylog.init({
  mode: "auto", // 'dev' | 'prod' | 'auto'
  showWarnings: true, // Capture process warnings
});
```

### 4. Serverless (AWS Lambda / Vercel)

Whylog automatically detects serverless environments and switches to synchronous logging to prevent data loss.

**Why wrap?** AWS Freeze / Thaw cycles can kill async logs. The wrapper ensures flushing.

```javascript
import { wrap } from "whylog";

export const handler = wrap(async (event) => {
  // Your lambda code
  // Errors thrown here are intercepted, explained, and logged synchronously before exit.
});
```

### 5. Browser Usage

Whylog hooks into `window.onerror` and `window.onunhandledrejection`.

````javascript
import "whylog/register";

### 6. Backend Framework Integrations (Express, Koa, Fastify)

Whylog provides dedicated middleware for modern backend frameworks. These wrappers safely intercept routing errors, print beautiful diagnostic reports on the server, automatically extract HTTP Context (URLs, Methods, Headers), and prevent leaking stack traces to the client by responding with a secure `500 Internal Server Error`.

#### Express.js
```javascript
import express from "express";
import { expressErrorHandler } from "whylog";

const app = express();
// Add the Whylog error handler AFTER all your routes
app.use(expressErrorHandler);
app.listen(3000);
```

#### Fastify
```javascript
import fastify from "fastify";
import { fastifyErrorHandler } from "whylog";

const app = fastify();
app.setErrorHandler(fastifyErrorHandler);
```

#### Koa
```javascript
import Koa from "koa";
import { koaErrorHandler } from "whylog";

const app = new Koa();
// Add BEFORE your routes
app.use(koaErrorHandler);
```

### 7. Frontend Frameworks (React & Vue)

**React Error Boundary** (To catch rendering errors):
```jsx
import React from 'react';
import { report } from 'whylog/dist/reporters/pretty';

export class WhylogErrorBoundary extends React.Component {
  componentDidCatch(error) {
    report(error, 'error'); // Processes the React error through Whylog
  }
  render() { return this.props.children; }
}
```

**Note**: Source snippets (Smart Gutter) are not available in the browser due to lack of filesystem access.

---

## 🗺 Source Maps & Async Stacks (Built-in)

Whylog stays incredibly lightweight by utilizing Node.js's powerful native V8 features instead of bloating the package with heavy transpilers parser libraries.

* **Source Map Support:** Node.js (v12.12+) supports source maps natively. To ensure Whylog displays the original TypeScript or Webpack code instead of compiled output, simply start your app with the `--enable-source-maps` flag:
  `node --enable-source-maps dist/app.js`
* **Async Stack Traces:** Node natively stitches asynchronous promises together (Zero-cost async stack traces). Whylog parses these seamlessly as long as you use standard `async/await`.

---

## ⚙️ Configuration

Pass these options to `whylog.init(options)`.

| Option         | Type                                       | Default  | Description                                                 |
| :------------- | :----------------------------------------- | :------- | :---------------------------------------------------------- |
| Option         | Type                                       | Default  | Description                                                 |
| :------------- | :----------------------------------------- | :------- | :---------------------------------------------------------- |
| `mode`         | `'auto' \| 'dev' \| 'prod'`                | `'auto'` | Force a specific mode. `auto` uses `NODE_ENV`.              |
| `format`       | `'auto' \| 'pretty' \| 'json' \| 'plain'`  | `'auto'` | Output style. `json` is best for log aggregators.           |
| `serverless`   | `'auto' \| boolean`                        | `'auto'` | If `true`, enables sync logging and disable exit delays.    |
| `ignore`       | `(string \| RegExp)[] \| (err) => boolean` | `[]`     | Filter out errors. Supports patterns or predicate function. |
| `showWarnings` | `boolean`                                  | `true`   | Intercepts `process.emitWarning`.                           |
| `dedupe`       | `boolean`                                  | `true`   | Silences identical sequential errors.                       |
| `throttle`     | `{ enabled, windowMs, max }`               | `--`     | Limits log rate (Default: 5 errs / 1 sec).                  |
| `masking`      | `{ secrets }`                              | `[...]`  | Scrub sensitive keys from Context logs (e.g., password).    |
| `breadcrumbs`  | `{ enabled, maxItems }`                    | `--`     | Capture a trailing list of actions leading up to the crash. |
| `browserTracker`| `boolean`                                 | `false`  | (Browser) Auto-track DOM Clicks and `fetch` interception.   |
| `overlay`      | `boolean`                                  | `false`  | (Browser) Trigger the Red-Box-of-Death on unhandled crashes.|
| `asyncHooks`   | `boolean`                                  | `false`  | (Node) Use native V8 APIs to stitch async stacks together.  |
| `customRules`  | `Rule[]`                                   | `[]`     | Add your own custom Heuristic Definitions.                  |
| `ai`         | `{ enabled: boolean, apiKey: string }`       | `--`     | Use GPT to explain unknown runtime errors on the fly.       |
| `transports`   | `Array<Function>`                          | `[]`     | Add asynchronous Webhooks for crash data.                   |
| `remoteConfigUrl`| `string`                                 | `--`     | Hit a JSON endpoint on startup to dynamically sync modes!   |
| `exit`         | `{ blockInDev, delayMs }`                  | `--`     | In Dev, slightly delays exit to flush output.               |

---

## 🛡 Reliability & Performance

### Crash Safety Guarantee

Whylog is designed to **never** crash your application.

1. **Safe Reporter**: The reporting logic is wrapped in a `try/catch` block. If `whylog` itself fails, it falls back to `console.error(originalError)` to ensure you never lose visibility.
2. **Listener Guard**: Initialization is idempotent. Calling `init()` multiple times is safe.

### ⚡ Performance Design (Kernel & Satellite)

Whylog uses a split architecture to ensure **zero overhead** during normal operation.

1. **Kernel**: A tiny (<1KB) observer hooks into global error events. It does nothing until a crash occurs.
2. **Satellite**: Only when an error is detected, the heavy "Satellite" (Parser, Heuristic Engine, Reporter) is lazy-loaded.

---

## 🧪 Advanced Features (In-Depth Guides)

Whylog is packed with powerful, zero-dependency tools. Click below to read the comprehensive, step-by-step documentation for each feature:

* **[🛡️ Data Masking & Secret Scrubbing](./docs/features/data-masking.md)**: Automatically scrub passwords and API keys from crash contexts before they log.
* **[🍞 Breadcrumbs & Frontend Timeline Tracking](./docs/features/breadcrumbs.md)**: Track a rolling 15-event history of user clicks, fetches, and state changes leading up to a crash.
* **[⏱️ Async Stack Stitching (Node.js)](./docs/features/async-stack-stitching.md)**: Use native V8 hooks to map disconnected Promise `.then()` chains back to their original `fetch` calls.
* **[🧠 AI Error Explainer (LLM Plugin)](./docs/features/ai-explainer.md)**: Optionally ask ChatGPT, Claude, Gemini, or Grok to debug obscure framework errors on the fly using native `fetch`.
* **[🧩 Custom Heuristics](./docs/features/custom-heuristics.md)**: Inject your own domain-specific logic rules (e.g. Stripe API Rate Limits) directly into Whylog's deterministic engine.
* **[🚀 Pluggable Transports (Webhooks)](./docs/features/pluggable-transports.md)**: Push perfectly structured, masked JSON crash reports directly to Slack, Datadog or Discord without third-party SDKs.
* **[🚨 In-Browser Red-Box Overlay](./docs/features/frontend-overlay.md)**: Replace the standard console with a dismissible, fullscreen DOM modal to display errors visually to frontend devs.
* **[📸 Visual Output Snapshots Gallery](./docs/SNAPSHOTS.md)**: See exactly what each feature (Masking, AI, Breadcrumbs) looks like in the terminal before implementing!

---

### JSON Output Schema & Fingerprinting

In production (`format: 'json'`), whylog outputs structured JSON stable for ingestion.

```json
{
  "timestamp": "2023-10-27T10:00:00.000Z",
  "level": "error",          // "error" | "warning"
  "severity": "CRITICAL",    // "CRITICAL" | "ERROR" | "WARNING"
  "category": "ReferenceError",
  "message": "foo is not defined",
  "explanation": "You tried to use a variable that hasn't been declared.",
  "heuristicId": "reference-error",
  "fingerprint": "a1b2c3d4", // Hash of message + file + line for tracking
  "fix": ["Declare 'foo' before using it."],
  "location": "app.js:10:5",
  "context": {               // Custom context injection (e.g. from Express)
     "url": "/api/users",
     "method": "POST",
     "headers": { "authorization": "[REDACTED]" }
  },
  "breadcrumbs": [
     { "timestamp": "...", "message": "User clicked login", "category": "ui" }
  ],
  "stack": ["..."],         // Omitted in Prod/Simple mode
  "environment": { ... }    // Omitted in Prod/Simple mode
}
```

### AI Explainer Plugin

When static heuristics fail, `whylog` can optionally use ChatGPT or any Local LLM (via Ollama/LMStudio) to read the trace and generate an explanation on the fly.

```javascript
import { whylog } from 'whylog';

whylog.init({
    ai: {
        enabled: true,                       // Toggle ON explicitly
        provider: 'gemini',                  // 'openai', 'anthropic', 'gemini', 'grok', 'custom'
        apiKey: process.env.GEMINI_API_KEY,  // Automatically formats requests natively!

        // For local offline models (Ollama, LM Studio, vLLM) you can override:
        // provider: 'custom',
        // endpoint: 'http://localhost:11434/v1/chat/completions',
        // model: 'llama3',
        // headers: { 'Custom-Auth': 'Token' }
    }
});
```
### Pluggable Export Destinations (Webhooks)

You don't need heavy third-party shippers to send errors to Slack or Datadog. Whylog invokes custom `transports` functions instantly.

```javascript
whylog.init({
  transports: [
    async (payload) => {
      // payload is the structured JSON output
      await fetch('https://discord.com/api/webhooks/YOUR_WEBHOOK', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `Crash: ${payload.explanation}` })
      });
    }
  ]
})
```

### Plugin System

Extend whylog with custom integrations.

```javascript
import { use } from "whylog";

use({
  id: "my-plugin",
  setup: (context) => {
    console.log("Whylog plugin active");
  },
});
```

### Debug Mode

```javascript
whylog.init({ debug: true }); // Logs internal state to console
```

---

## 🤝 Contributing

We welcome new heuristics!

1.  Open `src/core/rules.ts`
2.  Add a `Rule` object to the `rules` array.
3.  Run `npm run lab` to verify.

---

[npm](https://www.npmjs.com/package/whylog) | [GitHub](https://github.com/kolhapureakshay/whylog)

MIT © whylog
````

# whylog

📦 npm: https://www.npmjs.com/package/whylog  
🐙 GitHub: https://github.com/kolhapureakshay/whylog

> **A deterministic, lightweight, universal diagnostic engine.**
> whylog intercepts runtime errors, explains the root cause in plain English, and provides actionable fixes—all with zero configuration.

![NPM Version](https://img.shields.io/npm/v/whylog)
![License](https://img.shields.io/npm/l/whylog)
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

- **Universal**: Works consistently in Node.js (14+), Browsers, and Serverless (AWS/Vercel).
- **Zero Config**: Smart defaults auto-detect your environment (Dev vs. Prod).
- **Production Optimized**:
  - **Dev**: Beautiful, interactive output with code snippets and stack analysis.
  - **Prod**: Minimal, JSON-structured logs for ingestion tools (Datadog, Splunk).
  - **Serverless**: Zero-latency synchronous logging to ensure no logs are lost on freeze.
- **Chaos Management**:
  - **Throttling**: Prevents log spam during burst failures.
  - **Deduplication**: Silences repetitive errors.
  - **Fingerprinting**: Generates unique hashes for error tracking.
  - **Warning Interception**: Captures and explains `process.emitWarning`.
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

```javascript
import "whylog/register";

// That's it! Open your DevTools console to see enhanced errors.
```

**Note**: Source snippets (Smart Gutter) are not available in the browser due to lack of filesystem access.

---

## ⚙️ Configuration

Pass these options to `whylog.init(options)`.

| Option         | Type                                       | Default  | Description                                                 |
| :------------- | :----------------------------------------- | :------- | :---------------------------------------------------------- |
| `mode`         | `'auto' \| 'dev' \| 'prod'`                | `'auto'` | Force a specific mode. `auto` uses `NODE_ENV`.              |
| `format`       | `'auto' \| 'pretty' \| 'json' \| 'plain'`  | `'auto'` | Output style. `json` is best for log aggregators.           |
| `serverless`   | `'auto' \| boolean`                        | `'auto'` | If `true`, enables sync logging and disable exit delays.    |
| `ignore`       | `(string \| RegExp)[] \| (err) => boolean` | `[]`     | Filter out errors. Supports patterns or predicate function. |
| `showWarnings` | `boolean`                                  | `true`   | Intercepts `process.emitWarning`.                           |
| `dedupe`       | `boolean`                                  | `true`   | Silences identical sequential errors.                       |
| `throttle`     | `{ enabled, windowMs, max }`               | `--`     | Limits log rate (Default: 5 errs / 1 sec).                  |
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

## 🧪 Advanced Features

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
  "stack": ["..."],         // Omitted in Prod/Simple mode
  "environment": { ... }    // Omitted in Prod/Simple mode
}
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

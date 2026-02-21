# 🧠 AI Error Explainer (LLM Fallback Plugin)

## Why it's needed

Despite possessing dozens of static heuristic rules, the Javascript ecosystem is massive. You or your team will inevitably hit a completely obscure third-party library error (like a Webpack memory buffer leak or a highly obscure Three.js WebGL error) that Whylog's deterministic engine cannot accurately explain on its own.

## How Whylog handles it

Instead of shrugging its shoulders and dropping a random stack trace on your desk, Whylog features a **Zero-Dependency Native AI Plugin**.

If Whylog catches an error and _cannot_ match it against any built-in or custom heuristics, it will establish an ultra-lightweight HTTP POST request (using native `fetch()`, no bloated SDKs) to an AI provider (like ChatGPT, Claude, Gemini, or Grok). It packages the broken code snippet and the stack trace, asks for a strictly formatted JSON diagnosis, and seamlessly displays the AI's wisdom in your terminal natively as if it were a built-in rule.

## Configuration & Usage

```javascript
import { whylog } from "whylog";

whylog.init({
  ai: {
    enabled: true, // Toggle ON explicitly
    provider: "gemini", // 'openai', 'anthropic', 'gemini', 'grok', 'custom'
    apiKey: process.env.GEMINI_API_KEY, // Automatically formats requests natively!

    // For local offline models (Ollama, LM Studio, vLLM) you can override:
    // provider: 'custom',
    // endpoint: 'http://localhost:11434/v1/chat/completions',
    // model: 'llama3',
    // headers: { 'Custom-Auth': 'Token' }
  },
});
```

### Step-by-Step Flow

1. **The Crash:** An obscure error (`THREE.WebGLRenderer: Context Lost`) fires unhandled.
2. **The Failure Map:** The `HeuristicMapper` scans its internal JSON lookup table and finds `0` matches.
3. **The Interception:** Because `ai.enabled` is `true`, Whylog puts the terminal output on a brief hold.
4. **The Request:** Whylog strips out massive payload bloat and fires an HTTP POST to `api.openai.com/v1/chat/completions` using the `gpt-3.5-turbo` high-speed model. The prompt is meticulously structured to return only a JSON blob containing a `why` and a `fix` array.
5. **The Safe Return:** Whylog parses the AI JSON, mounts it into an `InsightCard`, and prints it beautifully in the exact same format as native rules.

### Safety Guarantee

If you are running in restricted network environments, or the OpenAI API experiences an outage, or if you run out of credits, Whylog will **never crash your app**. The plugin implements standard try/catches. If the AI fetch fails, Whylog immediately falls back to displaying the generic, non-AI error output without hesitation!

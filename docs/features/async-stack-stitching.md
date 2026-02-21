# ⏱️ Async Stack Stitching (Node.js)

## Why it's needed (The Broken Thread Problem)

One of the most notoriously annoying problems natively inside Node.js is debugging asynchronous `Promise` chains or `setTimeout` timeouts.

If you make an API call using a Promise, and it crashes inside a deep `.then()` resolving block 3 seconds later... the stack trace is chopped in half! It shows you where the code crashed, but the trace _does not_ show you the original file or line of code that triggered the fetch initially. This is because V8 drops the call stack context across tick boundaries.

## How Whylog handles it

Whylog implements an incredible development feature utilizing Node.js's native `async_hooks` module.

When enabled, Whylog essentially acts as a thread surveillance system. As asynchronous executions are spawned, it temporarily buffers their origin stacks in memory. If a thread unexpectedly fatally crashes, Whylog will extract that thread's ID, match it against the buffered origins, and dynamically "stitch" the broken stack trace halves back together.

## Configuration & Usage

This feature only works for Node.js (not browsers). Since `async_hooks` can have a small baseline memory/performance hit, it is **highly recommended to only use this in development mode**.

```javascript
import { whylog } from "whylog";

whylog.init({
  mode: "dev",
  asyncHooks: true, // Turns on the v8 magical stitcher!
});
```

### The Visual Output

Instead of getting a useless 2-line trace ending in `processTicksAndRejections`, you will get a trace output that looks like this:

```text
 🪵 Stack:
   processStageTwo (test-lab/test-async-hooks.js:20:15)
   <anonymous> (test-lab/test-async-hooks.js:14:9)
    --- async boundary ---
   triggerAsyncCrash (test-lab/test-async-hooks.js:13:5)
   Object.<anonymous> (test-lab/test-async-hooks.js:25:1)
```

The `--- async boundary ---` is injected gracefully by Whylog so you know exactly which original function (`triggerAsyncCrash`) scheduled the future payload that eventually threw an exception!

# 📸 Whylog Visual Snapshots

Since Whylog heavily manages UI logic in the terminal across different features, this gallery provides snapshots of exactly what the output logic looks like for each major implementation.

## 1. Local AI Explainer (Ollama Llama3)

If a crash trace cannot be identified by static heuristics, it is routed to the configured AI payload (e.g. Ollama). The output explicitly marks the insights with `✨ (CUSTOM AI)`.

```text
 ❌ ERROR:  WebGL: INVALID_OPERATION: drawElements: out of bounds arrays

 📍 Location:
 src\graphics\glContext.js:412:12

 🧠 Why:
 The arrays containing your polygon vertex data hold fewer elements than what you requested the GPU to draw. ✨ (CUSTOM AI)

 💡 How to Fix:
 • Ensure the element buffer array length precisely matches the vertex data.
 • Check your `gl.drawElements` counter loop limit.

 🪵 Stack:
 renderLoop (src\graphics\glContext.js:412:12)
```

## 2. Universal Data Masking

Whylog recursively intercepts objects in the Context. If an HTTP request crashes, here is what is generated directly into the terminal _before_ it leaves the container.

```text
 ❌ ERROR:  Database connection completely dropped during login.

 📍 Location:
 api/auth.js:22:9

 🧠 Why:
 The server unexpectedly severed the connection stream.

 💡 How to Fix:
 • Verify database is active and check network topology.

 🪵 Context:
  method: POST
  url: /api/v1/auth/login
  headers:
    authorization: *** HIDDEN ***
    content-type: application/json
  body:
    username: admin
    password: *** HIDDEN ***

 🪵 Stack:
 handleLogin (api/auth.js:22:9)
```

## 3. Breadcrumbs Timeline Tracking

If you append `addBreadcrumb()` or enable the browser tracker, Whylog maintains a rolling event ring-buffer. Upon crash, notice the `🍞 Trail:` section added automatically.

```text
 ❌ ERROR:  Failed to parse chart metrics from payload!

 📍 Location:
 ui/dashboard.js:105:13

 🧠 Why:
 The requested index property is undefined on the targeted mapping object.

 🍞 Trail:
  12:00:01 - [ui]       User navigated to /dashboard
  12:00:02 - [lifecycle] Component <ChartWidget> mounted successfully
  12:00:03 - [network]  Initializing fetch to /api/metrics
  12:00:04 - [network]  fetch() resolved with status 500

 💡 How to Fix:
 • Use optional chaining (`?.`) when attempting to parse unpredictable JSON.
```

## 4. Async Stack Stitching (Node.js)

Because Node.js drops original callback stacks, Whylog buffers them and injects `--- async boundary ---` to trace where the fatal crash was originally spawned.

```text
 ❌ ERROR:  undefined is not a function (async deep)

 📍 Location:
 test-lab\test-async-hooks.js:20:15

 🧠 Why:
 The code tried to call a property as a function, but it is not callable.

 💡 How to Fix:
 • Log the variable before the call to verify its value.

 🪵 Stack:
 processStageTwo (test-lab\test-async-hooks.js:20:15)
 <anonymous> (test-lab\test-async-hooks.js:14:9)
  --- async boundary ---
 triggerAsyncCrash (test-lab\test-async-hooks.js:13:5)
 Object.<anonymous> (test-lab\test-async-hooks.js:25:1)
```

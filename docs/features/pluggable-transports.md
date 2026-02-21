# 🚀 Pluggable Transports (Webhooks)

## Why it's needed

You shouldn't have to install massive, 14MB SDKs containing 50 sub-dependencies just to send an HTTP JSON object of a crash trace to your company's Slack channel or your preferred Cloud Aggregator (like Datadog/Splunk).

## How Whylog handles it

Whylog generates an incredibly tight, strictly-structured JSON `Payload` natively. You can completely bypass installing giant third-party log-shippers by merely supplying a custom `transports` array filled with simple async functions. Whylog will execute your array of functions invisibly in the background every time a crash happens!

## Configuration & Usage

### Sending Errors to Slack or Discord

You can use the native Javascript `fetch()` command inside your transport array to beam Whylog's curated JSON explanations to a chat webhook instantly:

```javascript
import { whylog } from "whylog";

whylog.init({
  transports: [
    async (payload) => {
      // payload inherently contains the fully parsed, Masked, and mapped crash object!
      const message = `🚨 CRASH: ${payload.explanation} \n Fix: ${payload.fix[0]}`;

      await fetch("https://discord.com/api/webhooks/YOUR_WEBHOOK_URL", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
    },
  ],
});
```

### Writing Custom Files

Transports don't have to be network calls. You can use it to map Whylog to custom file outputs.

```javascript
import fs from "fs";
import { whylog } from "whylog";

whylog.init({
  transports: [
    (payload) => {
      fs.appendFileSync(
        "/var/log/my-app/crashes.log",
        JSON.stringify(payload) + "\n",
      );
    },
  ],
});
```

## The Payload Schema

When writing your transport function, it is critical to know what Whylog is handing you. The `payload` object passed to your transport function follows this rigid schema:

```json
{
  "timestamp": "2023-10-27T10:00:00.000Z",
  "level": "error",
  "severity": "CRITICAL",
  "category": "ReferenceError",
  "message": "foo is not defined",
  "explanation": "You tried to use a variable that hasn't been declared.",
  "heuristicId": "reference-error",
  "fingerprint": "a1b2c3d4", // Hash of message + file + line (Used by Datadog to stack identical errors)
  "fix": ["Declare 'foo' before using it."],
  "location": "app.js:10:5",
  "context": {
    // Custom framework context (Headers/Query)
    "url": "/api/users",
    "method": "POST",
    "headers": { "authorization": "[REDACTED]" }
  },
  "breadcrumbs": [
    { "timestamp": "...", "message": "User clicked login", "category": "ui" }
  ],
  "stack": ["..."],
  "environment": { "runtime": "Node", "os": "Windows", "arch": "x64" }
}
```

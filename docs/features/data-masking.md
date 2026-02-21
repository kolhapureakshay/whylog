# 🛡️ Data Masking & Secret Scrubbing

## Why it's needed

When error logging in production, catching sensitive information like passwords, credit card numbers, or API keys in the stack trace or HTTP context is a massive security risk. Aggregators (like Datadog, Sentry, or CloudWatch) are usually not compliance-focused, and leaking PII or secrets can lead to serious compliance violations (GDPR, SOC2).

## How Whylog handles it

Whylog features a **Zero-Dependency Recursive Data Masker** built right into its core payload engine. When your application throws an error, Whylog often intercepts the Context (like an Express request object containing headers and a body). Before that payload is printed to the terminal or shipped to an external Webhook, the `masking` algorithm scans every single key in the object deeply. If a key name loosely matches one of your designated "secrets", the value is permanently overwritten with a safe placeholder string.

## Configuration & Usage

By default, Whylog automatically masks keys matching `['password', 'token', 'authorization', 'secret', 'apikey']` with the string `'[REDACTED]'`.

However, you can completely customize this list to match your exact domain models:

```javascript
import { whylog } from "whylog";

whylog.init({
  masking: {
    secrets: [
      "password",
      "cc_number", // Custom Stripe model
      "social_sec", // Custom PII model
      "authorization",
      "client_secret",
    ],
    maskString: "*** HIDDEN FOR COMPLIANCE ***",
  },
});
```

### Deep Recursive Scanning

The algorithm does not just check top-level keys. It safely traverses arrays and endlessly nested objects inside your context payload:

```json
// If your Express app crashes with this raw body:
{
  "user": "akshay@example.com",
  "metadata": {
      "oauth": {
          "token": "live_eyjhbGciojiasdf123..."
      }
  }
}

// Whylog will export this inherently safe payload:
{
  "user": "akshay@example.com",
  "metadata": {
      "oauth": {
          "token": "*** HIDDEN FOR COMPLIANCE ***"
      }
  }
}
```

## Disabling

If you are running in a purely offline development environment and absolutely need to see the raw tokens for debugging, you can safely turn off masking locally:

```javascript
whylog.init({
  masking: {
    secrets: [], // An empty array defeats the masker
  },
});
```

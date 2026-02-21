# 🧩 Custom Heuristics

## Why it's needed

Every company has unique domain logic. While Whylog provides a brilliant baseline of rules to catch generic Node.js and Browser errors (like `ECONNRESET` or `Cannot read properties of undefined`), those rules don't know anything about _your_ specific business ecosystem. What if a user crashes because they hit a Stripe API Rate Limit? A standard tool just shows a 429 status code.

## How Whylog handles it

Whylog exposes its deterministic analysis engine directly to you. You can inject an array of `customRules`—which are essentially custom diagnostic definitions—into the engine during initialization.

When a crash happens, Whylog will check _your_ custom rules **first**. If an error strictly matches the string/regex patterns you defined, Whylog will display your custom explanation and fix instructions instead of a generic fallback!

## Configuration & Usage

A heuristic rule is a simple Javascript object requiring a few keys:

1. `id`: A unique string identifier.
2. `title`: The header for the error box.
3. `category`: Used for grouping/sorting.
4. `pattern`: A function `(error) => boolean` that returns true if the error matches this rule.
5. `explanation`: A function returning the plain-English context.
6. `fix`: A function returning an array of string bullet points to solve it.

### Step-by-Step Implementation

Let's imagine you maintain a billing microservice that frequently fails because of a third-party library.

```javascript
import { whylog } from "whylog";

const myStripeRule = {
  id: "stripe-rate-limit",
  title: "Stripe API Limit Exceeded",
  category: "Billing Error",

  // 1. The Trap: Only trigger this rule if the error message and stack trace match exactly
  pattern: (err) =>
    err.message.includes("Rate limit exceeded") && err.stack.includes("stripe"),

  // 2. The Diagnosis: What happened?
  explanation: () =>
    "The customer hit the checkout button too many times, triggering Stripe's anti-fraud locks.",

  // 3. The Cure: Tell your junior developers exactly how to fix it instead of debugging!
  fix: () => [
    "Ignore the error; the lock lifts in 60s natively.",
    "Ensure the frontend team disables the checkout button via React state immediately on first click to prevent this.",
  ],
};

// Inject it ahead of Whylog's built-in rules!
whylog.init({
  customRules: [myStripeRule],
});
```

### Advanced Patterns

You can pass the actual `error` object into the `explanation` and `fix` functions to pull dynamic numbers or URLs directly out of the crash message and display them beautifully in the terminal UI!

```javascript
explanation: (err) => {
  // Dynamically pull a specific user ID from the error string!
  const userId = err.message.split("UID:")[1];
  return `User ${userId} tried to access a restricted database table.`;
};
```

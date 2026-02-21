# 🍞 Breadcrumbs & Frontend Timeline Tracking

## Why it's needed

A standard stack trace shows you precisely _where_ the code broke (e.g., `app.js line 45`). However, it rarely tells you _how_ the application arrived there. Did the user click the checkout button first, or did a background interval fetch trigger it? Without a timeline of actions leading up to the crash, reproducing complex state bugs is nearly impossible.

## How Whylog handles it

Whylog implements a highly-performant, circular buffer called the `BreadcrumbTracker`. It quietly records a timeline of application events (up to a configured maximum limit, avoiding memory leaks). When a fatal crash finally occurs, Whylog automatically dumps this timeline into a gorgeous **🍞 Trail** panel directly inside the error output!

## Configuration & Usage

Enable breadcrumbs by adjusting your setup configuration:

```javascript
import { whylog } from "whylog";

whylog.init({
  breadcrumbs: {
    enabled: true,
    maxItems: 15, // Only keeps the last 15 actions in memory
  },
});
```

### 1. Manual Backend/Frontend Tracking

You can manually hook Whylog into your application logic anywhere using the `addBreadcrumb` utility.

```javascript
import { addBreadcrumb } from "whylog";

function processUserLogin(req, res) {
  addBreadcrumb("User clicked Login button", "ui");

  db.connect()
    .then(() => addBreadcrumb("Connecting to Postgres...", "db"))
    .catch((err) => {
      // If this crashes, the previous breadcrumbs will be embedded in the trace!
      throw new Error("DB Drop!");
    });
}
```

### 2. Auto-magical Browser Tracking (Frontend Only)

Instead of manually typing `addBreadcrumb` around every UI interaction, Whylog can natively inject passive trace listeners directly into the DOM and the `window.fetch` API!

Enable the `browserTracker` in your initialization config:

```javascript
whylog.init({
  breadcrumbs: { enabled: true },
  browserTracker: true,
});
```

**What it does automatically:**

1. **Network Spying:** Every `fetch()` request going out of your app is tracked (`category: 'network'`).
2. **Click Spying:** Every click on the `document` registers the exact HTML Tag, ID, and Class name of what the user interacted with immediately prior to the crash (`category: 'ui'`).

Now, if a user causes a crash, your terminal (or Webhook payload) will look like this:

```text
❌ ERROR: Cannot read property 'map' of undefined

🧠 Why: The component attempted to render missing array data.

🍞 Trail:
 10:04:12 - [network] fetch: /api/v1/users/14
 10:04:13 - [ui]      Clicked on button#load-profile.btn-primary
```

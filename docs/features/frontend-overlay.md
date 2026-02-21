# 🚨 In-Browser Red-Box Overlay

## Why it's needed

When developing modern React, Vue, or Vanilla frontend applications, catching an unhandled error natively inside a browser creates a massive problem: **the error is hidden in the `F12` Developer Console.**

If a non-technical product manager is testing your web app locally and clicks a broken button, the screen simply freezes. To understand what happened, they have to open Chrome DevTools, try to parse a minified stack trace, and take a screenshot for you.

## How Whylog handles it

Whylog fixes this friction by mimicking the "Red Box of Death" popularized by massive meta-frameworks like Next.js or Vite.

When your frontend application triggers an unhandled `window.onerror` event, Whylog catches it, generates a plain-English explanation of why the crash happened, and dynamically injects a beautiful **dismissible DOM modal** right into the center of the viewport, obscuring the application and presenting the crash natively on-screen.

## Configuration & Usage

This is fundamentally a browser-only feature. Simply add `overlay: true` to your initialization!

```html
<script type="module">
  import { whylog } from "whylog";

  whylog.init({
    mode: "dev",
    overlay: true, // Flashes the crash directly onto the webpage DOM!
  });
</script>
```

### Combined with React Error Boundaries

If you are using React, you should catch rendering crashes inside an Error Boundary and manually pipe them to Whylog to trigger the overlay:

```jsx
import React from "react";
import { report } from "whylog/dist/reporters/pretty";

export class WhylogErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    // This will format the error, print it to the console, AND trigger the DOM overlay!
    report(error, "error");
  }

  render() {
    // Optionally render a blank page since the Overlay handles the visual error state
    if (this.state.hasError) return <h1>Something went wrong.</h1>;
    return this.props.children;
  }
}
```

### Visual Specifications

The Overlay handles extremely complex payloads elegantly:

- It creates a fixed, high z-index darkened backdrop (`rgba(0,0,0,0.85)`).
- It injects a styled div containing the Error Header (❌), the Explanation (🧠), and the Fix array (💡).
- If your configuration also includes `browserTracker: true`, the Overlay will natively list the exact timeline of DOM clicks leading up to the crash directly in the UI!

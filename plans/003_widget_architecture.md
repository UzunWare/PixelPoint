# AI Agent Prompt: Step 3 - Widget Architecture (Vite & Shadow DOM)

**Role**: You are a Frontend Infrastructure Engineer.
**Task**: Configure the build system and entry point for the PixelPoint Widget.
**Goal**: Create a self-contained Javascript bundle that injects a Shadow DOM host into the page and renders the Preact app inside it, completely isolated from the host page's styles.

## Context
The widget is a "guest" on client websites. It must not be affected by their CSS, nor should it affect theirs. We use **Shadow DOM** for this.

## 1. Vite Configuration (`apps/widget/vite.config.ts`)
Configure Vite to build in **Library Mode**.
*   **Entry**: `src/main.tsx`
*   **Formats**: `iife` (Immediately Invoked Function Expression) - we want a script that just runs when included.
*   **Name**: `PixelPoint`
*   **FileName**: `pixelpoint.js`
*   **CSS Injection**: This is the critical part. Standard Vite emits a `style.css`. We need the CSS to be **injected** into our Shadow DOM, not the document head.
    *   *Strategy*: Use a plugin like `vite-plugin-css-injected-by-js` OR manually import the CSS as a string (if using PostCSS/Tailwind, this is tricky).
    *   *Preferred Strategy for MVP*: Configure Vite to emit `style.css` alongside the JS. Then, in our `main.tsx` loader logic, we will manually fetch `style.css` (or expect it to be passed via configuration) and inject it into the Shadow Root `<style>` tag.
    *   *Alternative*: Use `vite-plugin-lib-inject-css` but ensure it targets the shadow root (unlikely to work out of box).
    *   *Simplest approach*: In `main.tsx`, import the CSS file `import './index.css?inline'`. Vite support `?inline` query for CSS which gives you the string content! **Use this approach.**

## 2. The Injection Harness (`apps/widget/src/main.tsx`)
This file is the "Loader". It should not just render the App; it needs to prepare the environment.

1.  **Check for existence**: If `#pixelpoint-widget-host` exists, abort (prevent double loading).
2.  **Create Host**: Create a `div` with id `pixelpoint-widget-host`.
3.  **Z-Index**: Set `host.style.position = 'fixed'`, `z-index = 2147483647`.
4.  **Shadow Root**: Call `host.attachShadow({ mode: 'open' })`.
5.  **Inject Styles**:
    *   Import Tailwind styles: `import styles from './index.css?inline'` (Ensure `import type` assertions or `.d.ts` are handled if typescript complains).
    *   Create a `<style>` element, set `.textContent = styles`, and append to Shadow Root.
6.  **Mount Preact**:
    *   `render(<App />, shadowRoot)`

## 3. Tailwind Configuration
*   Ensure Tailwind is working.
*   In `apps/widget/src/index.css`, include `@tailwind base; @tailwind components; @tailwind utilities;`.
*   *Note*: Since we are in Shadow DOM, we don't need `prefix` option necessarily, but we DO need to make sure Preflight doesn't wreck the host site (it won't, because it's inside Shadow DOM).

## 4. Verification steps
1.  Create a local HTML file `apps/widget/test-page.html`.
2.  Add some "Host" styles that would normally break things (e.g., `div { color: red; font-size: 100px; }`).
3.  Include the built script (or dev script).
4.  Verify that the Widget text is **NOT** red and large (Isolation works).
5.  Verify that the Widget's Tailwind classes (e.g., `bg-blue-500`) **DO** work.

**Deliverables**:
*   `apps/widget/vite.config.ts`
*   `apps/widget/src/main.tsx` (Logic to inject shadow root and styles)
*   `apps/widget/src/index.css` (Tailwind imports)
*   `apps/widget/test-page.html` (Verification)

**Output**: Perform the code creation and configuration.

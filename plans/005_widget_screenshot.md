# AI Agent Prompt: Step 5 - Screenshot Engine

**Role**: You are a Frontend Graphics Engineer.
**Task**: Implement the viewport capture functionality using `html2canvas`.
**Goal**: When a user selects an element, capture a screenshot of the visible viewport so the developer sees exactly what the client saw.

## Context
Visual feedback needs visual context. We use `html2canvas` to render the DOM as an image. This happens entirely client-side.

## 1. Integration (`apps/widget/src/utils/screenshot.ts`)
1.  **Install**: `npm install html2canvas`.
2.  **Function**: Create `captureViewport(): Promise<string>`.
    *   Returns a Base64 string (Data URI).

### Configuration Details
*   **Target**: Capture `document.body`.
*   **Ignore Self**: Crucial! We do NOT want to capture the PixelPoint widget UI (the sidebar/forms) in the screenshot of the website. `html2canvas` has an `ignoreElements` callback.
    *   *Rule*: Ignore the host element `#pixelpoint-widget-host`.
*   **Viewport Only**: We don't need the whole page height (which could be 5000px).
    *   Use `window.scrollTo(0, 0)` temporary? No, that's jarring.
    *   Better: Use `x`, `y`, `width`, `height` options in html2canvas to capture just the current window view.
    *   *Actually*: `html2canvas` defaults to full document. To capture just the viewport, you often need to crop the canvas result or set the `windowWidth`/`windowHeight` options carefully.
    *   *MVP approach*: Let it capture the document, but pass `ignoreElements` for the widget. If it captures full height, that's acceptable for V1, but try to limit it to the viewport if easy.
*   **CORS**: Set `useCORS: true`. This attempts to load images from other domains (like S3/Cloudinary) via a proxy or allowed headers. If it fails, `html2canvas` will log a warning/skip the image, which is fine for MVP.

## 2. Triggering
*   Update the `click` handler from Step 4.
*   When the user clicks an element:
    1.  **Hide the Highlighter**: Visually hide the highlighter border immediately (so it doesn't appear in the screenshot).
    2.  **Capture**: Await `captureViewport()`.
    3.  **Restore**: Show form/highlighter again.
    4.  **Log**: Console log the resulting Base64 string length to verify it worked.

## 3. Verification
1.  Update `test-page.html` to include an image (e.g. `https://via.placeholder.com/150`).
2.  Click an element.
3.  Check the console. Copy the Base64 string.
4.  Paste it into a browser address bar or a "Base64 to Image" converter.
5.  **Pass Criteria**:
    *   You see the website content.
    *   You DO NOT see the blue selection border (it was hidden during capture).
    *   You DO NOT see the Widget UI.
    *   External images appear (if CORS headers allowed) or are blank (if blocked), but the app didn't crash.

**Deliverables**:
*   `apps/widget/src/utils/screenshot.ts`
*   Updated `apps/widget/src/App.tsx` (to trigger capture on click)

**Output**: Perform the installation and code creation.

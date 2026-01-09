# AI Agent Prompt: Fix Pin Positioning Issue

**Role**: You are a Frontend Graphics Engineer.
**Task**: Fix the critical bug where the "Pin" in the screenshot is offset from the actual click position.
**Goal**: Ensure the visual Pin on the Dashboard screenshot matches *exactly* where the user clicked on their screen.

## Root Cause Analysis
The issue is described in `PIN_POSITIONING_ISSUE.md`.
Summary: Using `html2canvas` to capture a "DOM injected pin" (Approach 6/7) fails because `html2canvas` struggles to map `position: fixed` or `absolute` elements correctly when using `x/y` cropping options, especially with Body Margins.
Previous attempts to inject a `<div>` and capture it have consistently resulted in offsets.

## The Solution: "Draw on Canvas" (Post-Processing)
Instead of trying to force `html2canvas` to render a DOM element correctly, we will **manually draw the pin logic onto the canvas bitmap** after the capture is done.

## Implementation Details (`apps/widget/src/utils/screenshot.ts`)

Refactor the `captureViewport` function to follow this logic:

1.  **Strict Viewport Capture**:
    Configure `html2canvas` to capture `document.documentElement` (not body, to avoid margin issues) with options:
    *   `x`: `window.scrollX`
    *   `y`: `window.scrollY`
    *   `width`: `window.innerWidth`
    *   `height`: `window.innerHeight`
    *   `scale`: 1 (or allow default, but handle it below).

2.  **Calculate Scale Factor**:
    Compare the resulting `canvas.width` to `window.innerWidth`.
    `const scaleX = canvas.width / window.innerWidth;`
    This handles cases where `html2canvas` captures at Higher DPI (Retina).

3.  **Draw the Pin**:
    Get the 2D Context of the captured canvas.
    *   `const ctx = canvas.getContext('2d')`
    *   Calculate standardized coordinates: `drawX = clickX * scaleX`, `drawY = clickY * scaleY`.
    *   Use `ctx.arc()` to draw the Pin circle (color: `#ec4899` or your theme color).
    *   Use `ctx.fillText()` to draw the number "1" (or generic dot).

4.  **Clean Up**:
    Remove any code related to `document.createElement('div')` or DOM marker injection. We are strictly doing image manipulation now.

## Verification
1.  Run the widget on the test page.
2.  Click specifically on a small target (e.g., the dot of an 'i' or a specific button corner).
3.  Check the resulting screenshot in the Dashboard (or log the Data URI).
4.  **Pass Criteria**: The drawn circle should be exactly covering the target you clicked, with no vertical offset.

**Output**: Refactor the screenshot utility.

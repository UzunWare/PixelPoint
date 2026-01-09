# Analysis of Pin Positioning Issue

## Current Implementation Analysis
I have examined `apps/widget/src/utils/screenshot.ts`.
The current strategy is **"Capture All, Then Crop"**:
1.  `html2canvas(document.documentElement)` is called without size restrictions (Lines 71-78).
2.  This attempts to render the **entire document height** (potentially thousands of pixels).
3.  The code then calculates a crop region based on `window.scrollY` and manually creates a second cropped canvas (Lines 92-107).

## The Flaws

### 1. Horizontal Drift (Scrollbar Mismatch)
*   **The Click**: `clickX` comes from `MouseEvent.clientX`. This value **includes** the scrollbar width (e.g., if you click the far right edge, X = 1920).
*   **The Capture**: `html2canvas(document.documentElement)` renders the *element*. The root element width **excludes** the scrollbar (e.g., width = 1905px).
*   **The Result**: If you click at X=1910 (on the scrollbar gutter or far right), the code calculates a position, but the canvas is only 1905px wide. The pin is effectively drawn "off the edge" or compressed. As you move from left to right, the error accumulates (0px error at left, ~15px error at right).

### 2. Vertical Offset (The "Below" Bug)
*   **The Math**: `cropY = scrollY * scaleY`.
*   **The Issue**: This assumes `html2canvas` starts rendering exactly at the document top (0,0). However, if `body` has a `margin-top` (browser default is 8px) or if there are collapsing margins, `html2canvas` might render the white space differently than the browser's scroll position implies.
*   **The Result**: The "Crop Box" starts slightly higher or lower than the actual Viewport, causing the content to shift up/down in the final screenshot. The Pin is drawn at the "correct" relative Y, but the background image is shifted, making the pin look offset.

### 3. Performance Risk
Renderings the full page height (e.g., a long SaaS landing page) is extremely heavy. It can crash the browser or take 5+ seconds. We only need the visible 800px.

## Recommended Solution: "Direct Viewport Capture"
We should instruct `html2canvas` to **only** render the viewport region. This forces the Canvas (0,0) to align exactly with the Viewport (0,0).

**Why this fixes it:**
1.  **No Cropping Math**: We let `html2canvas` handle the `window.scrollY` offset internally.
2.  **1:1 Mapping**: The resulting canvas represents exactly `window.innerWidth` x `window.innerHeight`.
3.  **Click Coords**: `clickX` (relative to viewport left) maps directly to `canvasX` (relative to canvas left).

## Next Steps
The Plan `plans/014_fix_pin_positioning.md` I previously generated implements exactly this "Direct Viewport Capture" strategy. It is the correct technical fix.

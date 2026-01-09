# Pin Positioning Issue - Detailed Technical Analysis

## Project Overview

PixelPoint is a visual feedback widget (similar to BugHerd/Marker.io) that allows users to click anywhere on a webpage, leave a comment, and have a screenshot captured with a pin marker showing exactly where they clicked.

**Architecture:**
- **Widget** (`apps/widget`): Preact app injected into client websites, handles click capture and screenshot
- **Dashboard** (`apps/dashboard`): Next.js app where project owners view feedback with screenshots
- **Screenshot Library**: html2canvas

## The Problem

When a user clicks on a webpage to leave feedback, the pin marker in the captured screenshot does not align with where they actually clicked. The pin consistently appears **offset** (usually below) from the actual click position.

### User Experience:
1. User scrolls to a section of the page
2. User clicks on element X to leave feedback
3. Screenshot is captured and displayed on dashboard
4. The pin marker in the screenshot appears on element Y (below element X)

## Technical Context

### Coordinate Systems Involved

1. **Viewport Coordinates** (`clientX`, `clientY`):
   - Position relative to the visible browser window
   - What `MouseEvent.clientX/clientY` returns
   - Range: (0,0) to (window.innerWidth, window.innerHeight)

2. **Document Coordinates**:
   - Position relative to the entire document
   - Calculated as: `documentX = clientX + window.scrollX`
   - Can exceed viewport dimensions on scrollable pages

3. **Screenshot Canvas Coordinates**:
   - Position within the captured canvas
   - Should map 1:1 with either viewport or document coordinates depending on capture method

### Key Measurements

- `window.innerWidth/innerHeight`: Viewport size INCLUDING scrollbar
- `document.documentElement.clientWidth/clientHeight`: Content area EXCLUDING scrollbar
- `window.scrollX/scrollY`: Current scroll position
- Typical scrollbar width: ~15px

## Approaches Tried

### Approach 1: Draw Pin on Canvas After Capture

**Method:**
```javascript
const canvas = await html2canvas(document.body, {...})
const ctx = canvas.getContext('2d')
ctx.arc(clickX, clickY, PIN_RADIUS, 0, 2 * Math.PI)
ctx.fill()
```

**Problem:** Pin drawn at viewport coordinates, but canvas might represent different area of document.

---

### Approach 2: Full Document Capture + Manual Crop

**Method:**
```javascript
// Capture entire document
const fullCanvas = await html2canvas(document.body, { scale: 1 })

// Calculate document position
const docY = clickY + scrollY

// Draw pin at document position
ctx.arc(clickX, docY, PIN_RADIUS, ...)

// Crop to viewport region
croppedCtx.drawImage(fullCanvas, 0, scrollY, width, height, 0, 0, width, height)
```

**Problem:** Pin still appeared offset. The crop coordinates didn't align with where html2canvas actually rendered content.

---

### Approach 3: Use html2canvas x/y Options

**Method:**
```javascript
const canvas = await html2canvas(document.documentElement, {
  x: window.scrollX,
  y: window.scrollY,
  width: contentWidth,
  height: contentHeight,
  scrollX: window.scrollX,
  scrollY: window.scrollY,
})
```

**Problem:** Results inconsistent. Sometimes captured wrong region, sometimes blank.

---

### Approach 4: Percentage-Based Pin Positioning

**Method:**
Store pin position as percentage of viewport:
```javascript
const pinXPercent = (clickX / viewportWidth) * 100
const pinYPercent = (clickY / viewportHeight) * 100
```

Then on dashboard, position overlay pin using percentages.

**Problem:**
- `viewportWidth` (1158px) includes scrollbar
- Canvas width (1143px) excludes scrollbar
- 15px discrepancy causes increasing offset for pins further right

---

### Approach 5: Use Canvas Dimensions for Percentage

**Method:**
```javascript
const pinXPercent = (clickX / canvas.width) * 100
const pinYPercent = (clickY / canvas.height) * 100
```

**Problem:** Still offset because the canvas content itself didn't represent the correct viewport region.

---

### Approach 6: Inject DOM Marker with position: absolute

**Method:**
```javascript
const marker = document.createElement('div')
marker.style.cssText = `
  position: absolute;
  left: ${clickX + scrollX}px;
  top: ${clickY + scrollY}px;
`
document.body.appendChild(marker)

const canvas = await html2canvas(document.body, {...})
// Marker is now part of the DOM, should be captured correctly
```

**Problem:** Body margin (default 8px) affects absolute positioning. Marker appeared offset from expected position.

---

### Approach 7: Inject DOM Marker with position: fixed

**Method:**
```javascript
const marker = document.createElement('div')
marker.style.cssText = `
  position: fixed;
  left: ${clickX}px;
  top: ${clickY}px;
`
document.body.appendChild(marker)

const canvas = await html2canvas(document.body, {
  x: scrollX,
  y: scrollY,
  width: contentWidth,
  height: contentHeight,
})
```

**Theory:** Fixed positioning is relative to viewport, so marker at (clickX, clickY) should appear at same position in captured viewport.

**Problem:** html2canvas doesn't handle `position: fixed` elements correctly when using x/y offset options. The fixed element position doesn't translate properly to the captured region.

---

### Approach 8: Remove Overlay, Rely on Baked-in Pin

**Method:**
Since all approaches to align an overlay pin failed, we removed the overlay and relied solely on the pin drawn/injected into the screenshot.

**Problem:** The baked-in pin itself is still offset due to the fundamental html2canvas coordinate issues.

## Root Cause Analysis

### html2canvas Behavior

html2canvas does NOT take a screenshot. It:
1. Parses the DOM
2. Recreates the page on a canvas using its own rendering engine
3. This rendering may differ from browser rendering in subtle ways

### Specific Issues

1. **Body Margin**: Default `margin: 8px` on body affects positioning calculations

2. **Fixed Element Handling**: When `x/y` options are used to offset the capture region, `position: fixed` elements don't behave as expected

3. **Viewport vs Content Width**:
   - `window.innerWidth` = 1158px (includes scrollbar)
   - `document.documentElement.clientWidth` = 1143px (content only)
   - html2canvas captures content area, not viewport

4. **Scroll Position**: The relationship between `scrollX/scrollY` options and `x/y` options is unclear and may conflict

5. **CSS Transforms**: Elements with CSS transforms (rotate, scale) may have different visual positions than layout positions

## Current Code State

### screenshot.ts (current implementation)
```typescript
function createPinMarker(viewportX: number, viewportY: number): HTMLDivElement {
  const marker = document.createElement('div')
  marker.style.cssText = `
    position: fixed !important;
    left: ${viewportX - 16}px !important;
    top: ${viewportY - 16}px !important;
    width: 32px; height: 32px;
    background: #ec4899;
    border: 3px solid white;
    border-radius: 50%;
    z-index: 2147483646;
  `
  return marker
}

export async function captureViewportWithPin(clickX: number, clickY: number) {
  const contentWidth = document.documentElement.clientWidth
  const contentHeight = document.documentElement.clientHeight
  const scrollX = window.scrollX
  const scrollY = window.scrollY

  // Inject fixed-position marker
  const marker = createPinMarker(clickX, clickY)
  document.body.appendChild(marker)

  await new Promise(r => requestAnimationFrame(r))

  const canvas = await html2canvas(document.body, {
    ignoreElements: (el) => el.id === WIDGET_HOST_ID,
    useCORS: true,
    allowTaint: true,
    scale: 1,
    x: scrollX,
    y: scrollY,
    width: contentWidth,
    height: contentHeight,
    scrollX: scrollX,
    scrollY: scrollY,
    windowWidth: contentWidth,
    windowHeight: contentHeight,
  })

  marker.remove()

  const pinXPercent = (clickX / canvas.width) * 100
  const pinYPercent = (clickY / canvas.height) * 100

  return { dataUri: canvas.toDataURL('image/jpeg', 0.8), pinXPercent, pinYPercent }
}
```

## Questions for Resolution

1. How does html2canvas handle `position: fixed` elements when `x/y` capture offset is specified?

2. Is there a way to capture exactly what's visible in the viewport, pixel-for-pixel?

3. Should we use a different screenshot library? (e.g., dom-to-image, modern-screenshot)

4. Would using the native browser screenshot API (if available) be more reliable?

5. Is there a coordinate transformation we're missing between viewport space and html2canvas space?

## Test Environment

- Browser: Chrome (latest)
- OS: macOS
- html2canvas version: Latest
- Test page: Has various elements including CSS transforms (rotated, scaled elements)

## Desired Outcome

When user clicks at viewport position (X, Y):
1. Screenshot captures exactly what user sees in viewport
2. Pin marker appears at position (X, Y) in the screenshot
3. These should match pixel-perfectly (or within 1-2px tolerance)

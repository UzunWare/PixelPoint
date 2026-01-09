# AI Agent Prompt: Step 4 - Selection Logic & Highlighting

**Role**: You are a Frontend Interaction Specialist.
**Task**: Implement the "Point and Click" element selection logic for the Widget.
**Goal**: Allow the user to hover over any element on the host page, see a visual highlight box around it, and click to selecting it.

## Context
The widget runs in a Shadow DOM overlay. Users need to "select" elements on the underlying page.
This requires translating the host DOM's coordinates into our Overlay's coordinate space.

## 1. The Coordinator (`apps/widget/src/logic/selection.ts`)
Create a custom hook or class simple logic handler that manages the selection state.

### A. Element Highlighting
*   **Event**: Listen to `mousemove` on `document` (window-level).
*   **Filtering**: Ignore elements *inside* our own Shadow DOM widget. We only want to highlight the user's page content.
*   **Calculation**: On hover, get the target element (e.g., `event.target`).
*   **Geometry**: Use `target.getBoundingClientRect()` to get dimensions and position.
*   **State**: Store this `Rect` (top, left, width, height) in the specific state (e.g. `hoveredRect`).

### B. Visual Highlighter
*   In your Preact App (`App.tsx`), render a `<div id="highlighter" />` **inside your Shadow DOM**.
*   This div should be absolutely positioned.
*   Bind its `style` (top, left, width, height) to the `hoveredRect` state.
*   **Style**: Give it a transparent fill with a colored border (e.g., `border: 2px solid #3b82f6`, `background: rgba(59, 130, 246, 0.1)`).
*   **Pointer Events**: Crucial! The highlighter itself MUST have `pointer-events: none`. If it catches mouse events, the `mousemove` on the document will start targeting the highlighter instead of the element behind it, causing flickering.

### C. Unique Selector Generator
When the user clicks, we need to save *what* they clicked.
*   Create a utility `getUniqueSelector(element: HTMLElement): string`.
*   **Logic**:
    1.  If the element has an `id`, return `#id`.
    2.  Else, if `tagName` is unique in parent, return `tagName`.
    3.  Else, return `tagName:nth-child(n)`.
    4.  Walk up the tree recursively until an `id` or `body` is found.
    *   *Result*: something like `#hero > div:nth-child(2) > span.highlight`.

## 2. Implementation Steps
1.  **Selection Mode State**: The widget should have a "Comment Mode" toggle. Only listen to highlight events when this mode is active.
2.  **Click Handler**:
    *   Listen to `click` on `document`.
    *   `e.preventDefault()` and `e.stopPropagation()` (don't trigger links on the user's site).
    *   Capture the final `selector` and `rect`.
    *   Open a "Comment Form" (placeholder for now) positioned near the click.

## 3. Verification
1.  Update the `test-page.html`. Add complex nested structures (flex, grid, transformed parents).
2.  Enable "Comment Mode" in the widget.
3.  Hover over elements. Verify the blue box follows the mouse perfectly.
4.  **Scroll Test**: Scroll the page. Ensure the highlighter moves with the element (you might need to re-calculate on `scroll` event or use `position: fixed` logic carefully—`getBoundingClientRect` returns viewport coordinates, so if your Overlay is `fixed` to the viewport, it matches perfectly without scroll offset math!).
5.  Click an element. Verify console logs the generated selector (e.g. `body > div#content > p`).

**Deliverables**:
*   `apps/widget/src/utils/selector.ts` (Logic for generating CSS selectors)
*   `apps/widget/src/components/Highlighter.tsx` (Visual component)
*   `apps/widget/src/App.tsx` (Event listeners and state wiring)

**Output**: Perform the code creation.

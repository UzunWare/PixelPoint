# AI Agent Prompt: Step 6 - Widget UI (Forms & Pins)

**Role**: You are a Product Designer / Frontend Engineer.
**Task**: Build the "Add Comment" UI flow and the visual "Pin" markers.
**Goal**: Create a polished user experience where clicking an element opens a comment form, and saving it places a numbered pin on the screen.

## Context
We have the selection logic and the screenshot. Now we need the actual user interface.
**Design Style**: Clean, modern, distinct. Use a shadow/elevation to separate it from the host page.

## 1. Components

### A. `CommentPopover.tsx`
A floating form that appears near the selected element.
*   **Props**:
    *   `position`: { x: number, y: number } (Screen coordinates).
    *   `onCancel`: () => void.
    *   `onSubmit`: (text: string) => void.
*   **UI Elements**:
    *   Textarea (Auto-growing or fixed height).
    *   "Cancel" button (Ghost style).
    *   "Submit" button (Primary color, e.g., Blue/Black).
    *   Small header "Leave a comment".
*   **Behavior**:
    *   Should be aware of screen edges (don't overflow off-screen). If clicked on the far right, show the popover to the left of the cursor.

### B. `Pin.tsx`
A small circular marker indicating a comment exists.
*   **Props**:
    *   `number`: number (1, 2, 3...).
    *   `x`, `y` (coordinates - wait, ideally this is attached to the element, but for MVP Step 6, absolute positioning over the host element is fine).
*   **Style**: Round, contrasting color (e.g., Hot Pink or Bright Blue), white text, shadow.
*   **Interaction**: Hovering/Clicking a pin should (eventually) show the comment. For now, just render it.

## 2. Metadata Collection (`apps/widget/src/utils/metadata.ts`)
Create a utility function `getBrowserMetadata()` that returns:
*   `url`: window.location.href
*   `browser`: User Agent string (or parsed simplified version).
*   `viewport`: `${window.innerWidth}x${window.innerHeight}`
*   `path`: window.location.pathname

## 3. Integration (`App.tsx`)
Wire it all together.
1.  **State**:
    *   `comments`: Array of objects (id, selector, text, pinnedPosition).
    *   `isCommenting`: boolean.
    *   `pendingScreenshot`: string | null.
2.  **Flow**:
    *   User Clicks Element -> `handleSelection` triggers.
    *   Save `selector`, `rect`, `screenshot`.
    *   Open `CommentPopover` next to the element.
    *   User types "Logo is wrong" and clicks Submit.
    *   **Action**:
        *   Collect Metadata.
        *   Create new Comment Object.
        *   Add to `comments` state (Optimistic update).
        *   Render a `<Pin />` at the element's location.
        *   Close Popover.
        *   *Console.log* the final payload (we don't have an API yet).

## 4. Verification
1.  Open the test page.
2.  Click an element (e.g., the Header).
3.  The Form should appear.
4.  Type "Test comment" -> Submit.
5.  Form disappears.
6.  A **Pin #1** appears on the Header.
7.  Check Console: Verify the JSON payload object contains:
    *   `screenshot_base64`
    *   `meta` (viewport etc)
    *   `selector`
    *   `comment_text`

**Deliverables**:
*   `apps/widget/src/components/CommentPopover.tsx`
*   `apps/widget/src/components/Pin.tsx`
*   `apps/widget/src/utils/metadata.ts`
*   Updated `App.tsx`

**Output**: Perform the code creation.

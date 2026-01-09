# AI Agent Prompt: Step 13 - Phase 2: Widget Read & Reply

**Role**: You are a Frontend Interaction Specialist.
**Task**: Enable the Widget to see and reply to existing comments.
**Goal**: When the widget loads, it should populate the screen with pins for any existing feedback, allowing the client to click one and see the developer's reply.

## Context
Currently, the Widget starts empty.
It needs to fetch data from `GET /api/comments?project_id=...&url_path=...`.
It needs to render these "Server Comments" differently from "New Draft Comments".

## 1. Data Fetching (`apps/widget/src/logic/loader.ts`)
*   **On Mount**:
    *   Call the API to get `Comment[]`.
    *   Store them in a state `existingComments`.
*   **Filter**:
    *   Only show comments where `status != 'resolved'`.
    *   Only show comments for the current `window.location.pathname`.

## 2. Rendering Pins
*   Iterate over `existingComments`.
*   For each comment, render a `<Pin />`.
*   **Positioning**:
    *   Use the `meta.selector` to try and find the element again.
    *   *Resilience*: If `document.querySelector(selector)` finds the element, attach the pin to it.
    *   *Fallback*: Use `meta.x` / `meta.y` (percentage based) if element is missing? For MVP, just hide it if the element is missing (or show non-anchored pins in a "List" view). **Stick to Selector-based anchoring** for now.
    *   **Color**: Maybe make these pins a different color (e.g., Green for "Has Reply", Blue for "Open")?

## 3. Viewing a Thread
*   **Interaction**: User clicks an *existing* Pin (not a new part of the page).
*   **Action**: Open the Popover.
*   **View Mode**:
    *   Instead of an empty textarea, show the **Thread History**.
    *   "You: Fix this."
    *   "Admin: Done."
    *   [Optional] Allow the client to reply back.
*   **Reuse Components**:
    *   Reuse the `CommentThread` UI logic from the dashboard (if shared) or build a lightweight version for the widget.

## 4. Verification
1.  **Dashboard**: Add a reply to a comment ("I fixed it").
2.  **Widget**: Reload the test page.
3.  **Verify**:
    *   The Pin appears automatically.
    *   Clicking the Pin shows the text "I fixed it".
    *   You can reply "Thanks!" from the widget.
    *   Refreshing the Dashboard shows "Thanks!".

**Deliverables**:
*   Updated `apps/widget/src/App.tsx` (UseEffect to fetch).
*   Updated `apps/widget/src/components/Pin.tsx` (Handle click -> open thread).
*   Updated `apps/widget/src/components/CommentPopover.tsx` (Support "Thread View" mode).

**Output**: Perform the code creation.

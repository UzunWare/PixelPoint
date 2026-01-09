# AI Agent Prompt: Step 9 - Feedback Canvas & Verification

**Role**: You are a Frontend UI/UX Engineer.
**Task**: Build the "Canvas" view to inspect feedback and verify the entire system.
**Goal**: The developer should be able to click a project, see the list of comments, and view the screenshot with pins overlaid on it.

## 1. Feedback Canvas (`apps/dashboard/app/dashboard/projects/[id]/page.tsx`)
Update the Project Details page to show the actual feedback.

### A. Data Fetching
*   Fetch all `comments` for the project.
*   Sort by `created_at` matching the order they were made.

### B. The UI Layout
Create a 2-column layout:
*   **Left (Canvas)**:
    *   Display the `screenshot_url` (Base64) as an `<img>`.
    *   **Pins Overlay**: Render the "Pins" (Circles with numbers) on top of the image.
    *   *Challenge*: The pins were placed relative to the *viewport*, but the image is now scaled to fit the dashboard.
    *   *Solution (MVP)*: Just display the image full width or scrollable container for now. Position the pins absolute relative to the image container. Assuming the screenshot matches the viewport size, use percentage-based positioning if you saved it, OR just map the pixel values if you display the image at 1:1 scale (easiest for MVP).
*   **Right (Sidebar)**:
    *   List of comments: User Agent info, Path, Comment Text.
    *   "Resolve" button (Updates `status` to 'resolved').

## 2. Pin Positioning Logic
*   When the widget saved the comment, `meta.viewport` tells us the original size, and the selector logic might have saved `x/y`.
*   If we just saved the selector, we can't place the pin easily on a *screenshot*.
*   **Correction**: In Step 6, we saved `pinnedPosition` or `rect`? If we didn't save exact X/Y coordinates in the DB, we have a problem.
*   **Action**: Check the `comments` table. It has `meta`. Ensure the Widget Step 6/8 sent `x` and `y` in the metadata or a separate column.
*   *If missing*: Update the Widget/API to ensure `x` and `y` (click coordinates relative to viewport) are saved in the `meta` JSON.
*   Using that `meta.x` and `meta.y`, place the Pin on the dashboard image.

## 3. End-to-End Verification Check
Perform this final walk-through to confirm the MVP is complete.

1.  **Start Services**: `npm run dev` (Runs both apps).
2.  **Dashboard**: Login -> Create Project "Demo" -> Copy Script.
3.  **Host Site**: Paste script into `test-page.html`.
4.  **Widget Flow**:
    *   Open `test-page.html`.
    *   Click "Add Comment".
    *   Hover element -> Click.
    *   Type "Fix this header".
    *   Submit -> See Pin #1 appear.
5.  **Dashboard Flow**:
    *   Refresh Project Details page.
    *   **Verify**: You see the screenshot of the test page.
    *   **Verify**: You see Pin #1 on the header in the screenshot.
    *   **Verify**: You see the text "Fix this header" in the sidebar.

**Deliverables**:
*   Updated `apps/dashboard/app/dashboard/projects/[id]/page.tsx` (Canvas UI)
*   (If needed) Updates to Widget/API to ensure X/Y coordinates are saved.

**Output**: Perform the code creation.

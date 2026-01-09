# AI Agent Prompt: Step 8 - API & Data Persistence

**Role**: You are a Backend/Integration Engineer.
**Task**: Build the API endpoint to receive feedback and connect the Widget to it.
**Goal**: Ensure when a user clicks "Submit" in the widget, the data is saved to Supabase via the Dashboard's API.

## Context
The widget runs on `client-site.com` (or `localhost:3001`). The dashboard/API runs on `localhost:3000`.
Visual feedback contains: Text, Selector, Metadata, Capture (Base64).

## 1. The API Route (`apps/dashboard/app/api/feedback/route.ts`)
Create a **POST** handler.

### A. CORS (Cross-Origin Resource Sharing)
**Critical**: Because the widget is on a different domain, the browser will block requests unless we send the right headers.
*   **OPTIONS** Handler:
    *   Handle `OPTIONS` requests (Preflight).
    *   Return headers:
        *   `Access-Control-Allow-Origin`: `*` (For MVP. Later restrict to the Project URL).
        *   `Access-Control-Allow-Methods`: `POST, OPTIONS`.
        *   `Access-Control-Allow-Headers`: `Content-Type, x-project-id`.
*   **POST** Handler:
    *   Also must set `Access-Control-Allow-Origin`.

### B. Logic
1.  **Parse Body**: `{ project_id, content, selector, url_path, meta, screenshot_base64 }`.
2.  **Validate**: Ensure `project_id` exists in the database.
    *   *Bonus*: Check if the `Referer` header matches the Project's URL (Security Layer 1), but don't fail hard on it for MVP dev mode.
3.  **Upload Image** (Optional for Step 8, but recommended):
    *   Ideally, upload the Base64 to Supabase Storage and save the URL.
    *   *MVP Shortcut*: Just save the Base64 string directly into `screenshot_url` column (Note: If the string is huge, this might fail or bloat DB. If column is `TEXT`, it fits ~1GB, so it's fine for MVP testing).
    *   *Correction*: Check Schema. `screenshot_url` is TEXT. Just save the Base64 string there for now.
4.  **Insert**: Save to `comments` table.
5.  **Return**: JSON `{ success: true, id: new_comment_id }`.

## 2. Widget Integration (`apps/widget/src/utils/api.ts`)
Update the Widget logic to actually talk to the API.
1.  **Config**: The widget needs to know *where* to send data.
    *   Hardcode `API_URL = "http://localhost:3000/api/feedback"` for now.
2.  **Function**: `submitComment(payload)`
    *   `fetch(API_URL, { method: 'POST', body: ... })`.
    *   Handle errors (network fail, 500s).

## 3. Wiring It Up (`apps/widget/src/App.tsx`)
*   Replace the `console.log` in `handleSubmit` with `await submitComment(...)`.
*   Show a "Saving..." loading state on the button.
*   Show "Success!" before closing the popover.

## 4. Verification
1.  Run both apps.
2.  Go to `test-page.html`.
3.  Create a comment. Click Submit.
4.  **Check Network Tab**:
    *   Did the Preflight (OPTIONS) succeed?
    *   Did the POST succeed (200 OK)?
5.  **Check Supabase**:
    *   Table Editor -> `comments`. Is the row there?
    *   Is the Base64 screenshot there?

**Deliverables**:
*   `apps/dashboard/app/api/feedback/route.ts`
*   `apps/widget/src/utils/api.ts`
*   Updated `apps/widget/src/App.tsx`

**Output**: Perform the code creation.

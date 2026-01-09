# AI Agent Prompt: Step 11 - Phase 2: Collaboration Backend

**Role**: You are a Backend Architect.
**Task**: Upgrade the Database and API to support Threaded Comments (Replies) and Reading.
**Goal**: Enable the system to store replies to comments and allow the Widget to fetch existing comments for a page.

## Context
Phase 1 was "Write Only" (Widget sends data -> Dashboard reads).
Phase 2 is "Read/Write" (Widget needs to show existing pins/comments so clients can see replies).

## 1. Database Schema Update (`supabase/migrations/01_threading.sql`)
Create a migration (or update schema.sql if strictly in dev) to add:
1.  **`parent_id`** to `comments` table.
    *   Type: UUID, Nullable.
    *   Reference: `comments.id` (Self-referential).
    *   On Delete: Cascade.
2.  **`author_role`** to `comments` table.
    *   Type: Text or Enum ('guest', 'admin').
    *   Default: 'guest'.
    *   *Why*: To distinguish if the comment came from the Client (Widget) or the Developer (Dashboard).

## 2. API Expansion
### A. `GET /api/comments` (New Endpoint)
The Widget needs to ask: "Are there any pins on this URL?"
*   **Query Params**: `?project_id=...&url_path=...`
*   **Security**: Validate `project_id`. (Ideally, origin check too).
*   **Logic**:
    *   Fetch all comments where `status != 'resolved'`.
    *   Return a nested structure or flat list (Flat list is usually easier for client-side reconstruction).
    *   **Crucial**: Don't return sensitive data. Just content, position (`selector`/`meta`), author_role, created_at.

### B. `POST /api/feedback` (Update)
*   **Update Payload**: Accept optional `parent_id`.
*   **Logic**: Validates that if `parent_id` is provided, the parent comment actually exists and belongs to the same project.

## 3. Row Level Security (RLS) Check
*   Review `comments` policies.
*   **Current**: Public INSERT allowed.
*   **New Requirement**: Public SELECT allowed?
    *   *Yes*: The widget (public users) needs to read comments to see replies.
    *   *Policy Update*: Enable `SELECT` for public (anon role) IF `project_id` matches the request? (Supabase RLS is tricky with dynamic filters from API, usually simpler to allow Public Select on `comments` but rely on the API endpoint to filter by `project_id`).

**Deliverables**:
*   `supabase/migrations/...` (SQL for parent_id/author_role)
*   `apps/dashboard/app/api/comments/route.ts` (GET handler)
*   Updates to `apps/dashboard/app/api/feedback/route.ts` (Handle parent_id)

**Output**: Perform the code creation.

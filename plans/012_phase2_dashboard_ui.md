# AI Agent Prompt: Step 12 - Phase 2: Dashboard Threading UI

**Role**: You are a Frontend UI/UX Engineer.
**Task**: Enable "Reply" functionality in the Dashboard.
**Goal**: Allow the developer to see a comment, click reply, and post a response that gets nested under the original comment.

## Context
We updated the DB to support `parent_id`. Now we need to use it.
The "Sidebar" in the Project Details page currently shows a flat list. It needs to support nesting.

## 1. UI Updates (`apps/dashboard/app/dashboard/projects/[id]/page.tsx`)

### A. Data Structure
*   The raw flat list from the DB needs to be transformed into a Tree structure for rendering.
*   **Utility**: Create `buildCommentTree(comments: Comment[])`.
    *   Find root comments (`parent_id` is null).
    *   Find children for each.
    *   (MVP limited depth: If we want to keep it simple, just allow 1 level of nesting: "Root -> Replies". PixelPoint isn't Reddit; 1 level is usually enough. But recursiveness is cleaner).

### B. Component: `CommentThread`
*   Create a component that renders a single Comment.
*   **Visuals**:
    *   **Author**: Show "Client" vs "Admin" (based on `author_role`).
    *   **Timestamp**: Relative time (e.g., "2 hours ago").
    *   **Content**: The text.
*   **Actions**:
    *   **Reply Button**: Toggles a small textarea input below the comment.
    *   **Resolve Button**: (Only on root comments). Mark thread as resolved.

### C. Reply Logic
*   When user types a reply and hits "Send":
    *   Call `POST /api/feedback` (or a direct Supabase call if you prefer, but API is cleaner for consistency).
    *   Payload: `{ project_id, content, parent_id: [ID_OF_CURRENT_COMMENT], author_role: 'admin' }`.
    *   **Optimistic Update**: Insert the new reply into the UI tree immediately.

## 2. Refactoring
*   The previous "List of comments" was likely just map-looping over the array.
*   Replace it with the new `CommentTree` renderer.

## 3. Verification
1.  Open Dashboard Project View.
2.  Find a comment made by the Widget.
3.  Click "Reply".
4.  Type "I fixed this today."
5.  Click Send.
6.  **Verify**: The reply appears indented below the original comment.
7.  **Check DB**: Confirm the new row has `author_role = 'admin'` and `parent_id` set correctly.

**Deliverables**:
*   `apps/dashboard/src/utils/tree.ts` (Tree builder)
*   Updated `apps/dashboard/app/dashboard/projects/[id]/page.tsx`
*   New `apps/dashboard/src/components/CommentItem.tsx` (Draft)

**Output**: Perform the code creation.

# AI Agent Prompt: Step 2 - Database & Auth (Supabase)

**Role**: You are a Full Stack Engineer.
**Task**: Configure the Database Schema and Authentication integration for PixelPoint.
**Goal**: Set up the PostgreSQL schema to store Projects and Comments, and configure the Supabase client in the Dashboard app.

## Context
We are using Supabase (PostgreSQL) as our backend. The `apps/dashboard` needs to talk to this DB. The `widget` (later) will post data to an API endpoint which talks to this DB.

## 1. Database Schema (SQL)
Please create a file named `supabase/schema.sql` (create the folder/file if needed) containing the following definitions.
**Crucial**: Enable Row Level Security (RLS) on all tables.

### Tables

1.  **`profiles`** (Extends Supabase Auth)
    *   `id`: uuid (References `auth.users.id`, Primary Key)
    *   `email`: text
    *   `full_name`: text
    *   `created_at`: timestamp

2.  **`projects`**
    *   `id`: uuid (Default: `gen_random_uuid()`)
    *   `owner_id`: uuid (References `profiles.id`)
    *   `name`: text
    *   `url`: text (The website URL being tracked)
    *   `api_key`: text (Unique public key for the widget to identify the project - UUID is fine)
    *   `created_at`: timestamp

3.  **`comments`**
    *   `id`: uuid
    *   `project_id`: uuid (References `projects.id`)
    *   `url_path`: text (Specific page path where comment was left, e.g. `/about`)
    *   `selector`: text (CSS selector of the element, e.g. `#hero > h1`)
    *   `content`: text (The comment itself)
    *   `status`: text (enum: 'open', 'resolved', default: 'open')
    *   `meta`: jsonb (Browser, OS, Viewport dimensions)
    *   `screenshot_url`: text (Path to image in storage bucket - optional for now)
    *   `created_at`: timestamp

### RLS Policies (Draft)
*   **Projects**: Users can `SELECT`, `INSERT`, `UPDATE` projects where `owner_id = auth.uid()`.
*   **Comments**:
    *   `SELECT`: Users can view comments if they own the related project.
    *   `INSERT`: Public insert allowed IF the request carries a valid `project_id` (This is tricky with RLS, usually done via Service Role or a specific policy. For MVP, allow authenticated insert, or public insert for the component. *Recommendation*: For now, set `comments` to allow public INSERTS so the widget can post without user auth, but strictly limit UPDATES to the project owner.)

## 2. Dashboard Integration (`apps/dashboard`)
1.  **Install Dependencies**: Install `@supabase/supabase-js`. Do NOT install the SSR package yet unless you are comfortable configuring the cookies, simple client-side/API route usage is fine for MVP step 1.
2.  **Environment Variables**: Create `.env.local.example` with:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3.  **Supabase Client**: Create `apps/dashboard/lib/supabase.ts` to export a typed supabase client.
4.  **Types**: If possible, generate TypeScript definitions from the SQL schema (or manually define the interfaces in `packages/shared-types` matching the DB tables).

## 3. Verification Steps
1.  Since you might not have a live Supabase instance connected, write a **script** `apps/dashboard/scripts/test-db.ts` (or similar) that *would* attempt to connect and list projects.
2.  **Mocking/Local Mode**: If you cannot connect to a real DB, ensure the code strictly handles missing env vars gracefully (logs a warning).

**Deliverables**:
*   `supabase/schema.sql`
*   Updated `package.json` with dependencies.
*   `lib/supabase.ts` client logic.

**Do Not**:
*   Do not build the UI to display these yet.
*   Do not build the API endpoints yet.

**Output**: Perform the file creation and installation commands.

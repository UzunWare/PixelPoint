# AI Agent Prompt: Step 7 - Dashboard & Project Management

**Role**: You are a Next.js Full Stack Engineer.
**Task**: Build the Core Dashboard for managing projects.
**Goal**: Allow users to Sign In, Create a Project, and copy the Installation Script.

## Context
The Widget needs a valid `project_id` to work. We need a UI to generate these projects.
We are using `apps/dashboard` (Next.js App Router).

## 1. Authentication
*   **Page**: `app/login/page.tsx`.
*   **Functionality**: Simple email/password or Magic Link login using the `supabase` client you created in Step 2.
    *   *Note*: If you didn't install the Auth UI widgets, just build a raw HTML form with `supabase.auth.signInWithPassword`.
*   **Protection**: Create a layout or middleware check to ensure `/dashboard` routes are protected. Redirect unauthenticated users to `/login`.

## 2. Dashboard Layout
*   **Path**: `app/dashboard/layout.tsx`.
*   **UI**: Side navigation (Projects, Settings, Logout).
*   **Style**: Clean, professional (Tailwind).

## 3. Project Management
### A. List Projects (`app/dashboard/page.tsx`)
*   Fetch projects where `owner_id = current_user`.
*   Render a grid of "Project Cards" (Name, URL, Created At).
*   "New Project" button.

### B. Create Project (`app/dashboard/projects/new/page.tsx`)
*   Form:
    *   **Name**: (e.g., "My Portfolio")
    *   **URL**: (e.g., "https://example.com")
*   **Action**: Insert into `projects` table.
*   **Redirect**: On success, go to the Project Details page.

### C. Project Details (`app/dashboard/projects/[id]/page.tsx`)
This is the most critical part for the MVP setup.
*   **Header**: Project Name & URL.
*   **Section: Installation**:
    *   Display the **Snippet** the user needs to copy.
    *   **Format**:
        ```html
        <script 
          src="http://localhost:3001/pixelpoint.js" 
          data-project-id="[THE_UUID_OF_THIS_PROJECT]"
          defer
        ></script>
        ```
    *   *Note*: Use `http://localhost:3001` for now (Local Dev). Later we swap this for the CDN URL.
*   **Section: Feedback**: (Placeholder for now) "No feedback yet."

## 4. Verification
1.  Navigate to `http://localhost:3000/login`.
2.  Sign up/Login (Check Supabase Auth logs/console if needed).
3.  Create a project "Test Site".
4.  You should be redirected to the Details page.
5.  **Copy the Script Tag**.
6.  **Crucial Test**: Paste this script tag into your `apps/widget/test-page.html` (replacing the manual script loading if any).
7.  Open `test-page.html` in your browser. Verify the widget still Loads (Console log "PixelPoint Ready").

**Deliverables**:
*   `apps/dashboard/app/login/page.tsx`
*   `apps/dashboard/app/dashboard/...` (List, New, Details pages)
*   `apps/dashboard/middleware.ts` (Auth protection)

**Output**: Perform the code creation.

# AI Agent Prompt: Step 10 - Deployment & Production Readiness

**Role**: You are a DevOps / Release Engineer.
**Task**: Prepare the PixelPoint application for production deployment.
**Goal**: Move from `localhost` to a live URL, allowing anyone on the internet to use the widget.

## 1. Environment Configuration
We need to switch from hardcoded local URLs to dynamic Environment Variables.
*   **Widget**:
    *   Currently uses `http://localhost:3000/api/feedback`.
    *   **Action**: Update `apps/widget/src/utils/api.ts` to use `import.meta.env.VITE_API_URL`.
    *   **Action**: Create `.env.production` in `apps/widget` with the real live Dashboard URL (once known, or placeholder for now).
*   **Dashboard**:
    *   Ensure `NEXT_PUBLIC_SUPABASE_URL` etc are ready for Vercel.

## 2. Dashboard Deployment (Vercel)
*   **Prompt**: "Please guide me to deploy `apps/dashboard` to Vercel."
*   **Config**: Ensure `vercel.json` (if needed for monorepo) or Root Directory settings are correct (Root: `apps/dashboard`).

## 3. Widget Hosting (CDN)
The widget isn't a Next.js app; it's a static JS file.
*   **Build**: Run `npm run build` in `apps/widget`.
*   **Output**: Validate it produces `dist/pixelpoint.js`.
*   **Strategy**:
    *   *Option A*: Host this static file inside the Dashboard's `public` folder? (Easiest for MVP).
        *   Action: Add a build script that copies `apps/widget/dist/pixelpoint.js` -> `apps/dashboard/public/pixelpoint.js`.
        *   Result: You can access the widget at `https://your-dashboard.vercel.app/pixelpoint.js`.
    *   *Option B*: Publish to NPM / Unpkg (Better for versioning).
*   **Selection**: Go with **Option A** for simplicity right now.

## 4. Final Polish
*   **CORS update**: Update `apps/dashboard/app/api/feedback/route.ts` to allow the `Access-Control-Allow-Origin` to be configurable or allow all `*` (since users install it on *their* sites, `*` is actually required for the Widget to work, but you might want to validate the `Referer` against the `projects` table for security).

**Deliverables**:
*   Updated `apps/widget/src/utils/api.ts` (Env vars)
*   `package.json` scripts (To copy widget build to dashboard public)
*   Deployment instructions.

**Output**: Perform the configuration updates.

# AI Agent Prompt: Step 1 - Repository Scaffolding

**Role**: You are a Senior Frontend Architect.
**Task**: Initialize the repository structure for "PixelPoint", a visual feedback tool.
**Goal**: Create a clean monorepo structure that houses the Admin Dashboard (Next.js) and the Feedback Widget (Preact/Vite).

## Context
PixelPoint is a SaaS that allows users to place a script tag on their website and receive visual feedback. We are building the MVP.

## 1. Directory Structure (Monorepo)
Please configure the root directory with the following structure. Use `pnpm` workspaces if possible, otherwise simple folders are fine.

```text
/
├── apps/
│   ├── dashboard/       (Next.js 14+, App Router, TypeScript, Tailwind)
│   └── widget/          (Preact, Vite, TypeScript, Tailwind - bundled as a library)
├── packages/            (Optional, for shared types/config later)
│   └── shared-types/    (TypeScript definitions shared between widget and dashboard)
├── README.md
└── package.json         (Root)
```

## 2. Technical Requirements

### A. Dashboard (`apps/dashboard`)
-   Initialize a fresh **Next.js** project.
-   Use **TypeScript**, **App Router**, and **Tailwind CSS**.
-   Ensure it runs on port `3000`.
-   Clean up the default boilerplate (remove the Vercel logo, default styling etc).
-   Create a simple homepage `page.tsx` that says "PixelPoint Dashboard Ready".

### B. Widget (`apps/widget`)
-   Initialize a fresh **Vite** project with **Preact** and **TypeScript**.
-   **Crucial Config**: This will eventually be embedded in other sites. Configure Vite to build in **Library Mode** (outputting a single `.js` file if possible, or manageable chunks).
-   Set up **Tailwind CSS** but configure it to be scoped or ready for Shadow DOM usage (we will handle Shadow DOM implementation in the next step, just ensure Tailwind is installed).
-   Ensure it runs on port `3001` (dev mode).
-   Create a simple entry component that renders "PixelPoint Widget Ready".

### C. Shared (`packages/shared-types`)
-   Create a basic `package.json` for shared Typescript interfaces.
-   Add a dummy type `export type PixelPointProject = { id: string; name: string; };` just to test the linking.

## 3. Verification Steps
After creating the files, provide the commands to:
1.  Install dependencies for the root.
2.  Start both the Dashboard and Widget in development mode simultaneously (e.g., using `concurrently` or `npm-run-all`).

## Do Not
-   Do not build the full application features yet.
-   Do not set up the database yet.
-   Do not implement the Shadow DOM injection logic yet (just the build setup).

**Output**: Run the necessary shell commands to scaffold this structure and create the configuration files.

# PixelPoint

A visual feedback widget for websites. Allow users to click anywhere on your site, leave comments, and capture screenshots with pin markers.

Similar to BugHerd and Marker.io - but self-hosted.

## Features

- Click-to-comment feedback widget
- Automatic screenshot capture with pin markers
- Browser metadata collection (OS, browser, viewport, etc.)
- Dashboard for managing feedback
- Project-based organization with API keys

## Tech Stack

- **Dashboard**: Next.js 16, React, Tailwind CSS, Supabase
- **Widget**: Preact, Vite, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Screenshot**: modern-screenshot library

## Project Structure

```
pixelpoint/
├── apps/
│   ├── dashboard/     # Next.js dashboard app
│   └── widget/        # Preact widget (embeddable JS)
├── packages/          # Shared packages (if any)
└── package.json       # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/UzunWare/PixelPoint.git
   cd PixelPoint
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp apps/dashboard/.env.local.example apps/dashboard/.env.local
   ```

   Fill in your Supabase credentials in `.env.local`

4. Run development servers:
   ```bash
   npm run dev
   ```

   - Dashboard: http://localhost:3000
   - Widget dev server: http://localhost:3001

### Building for Production

```bash
npm run build
```

This will:
1. Build the widget
2. Copy `pixelpoint.js` to dashboard's public folder
3. Build the dashboard

## Usage

### Embedding the Widget

Add this script to any website:

```html
<script
  src="https://your-dashboard-url.vercel.app/pixelpoint.js"
  data-project-id="your-project-id">
</script>
```

Get your `project-id` from the dashboard after creating a project.

## Deployment

### Vercel (Recommended)

1. Connect your repo to Vercel
2. Set root directory to `apps/dashboard`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

The widget will be available at `https://your-app.vercel.app/pixelpoint.js`

## License

MIT

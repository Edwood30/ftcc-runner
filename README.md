# FTCC Runner

FTCC Runner is a web app for preparing, publishing, and archiving FTCC medical mission social media content. It helps the team turn mission details and outreach photos into a branded Facebook-ready content pack with generated captions, framed images, ZIP downloads, history tracking, and optional Telegram intake.

The app is organized as a React frontend and an Express/Prisma backend. The frontend handles the mission editor, image preparation, previews, and history dashboard. The backend stores missions and submissions in MongoDB, serves saved assets, creates ZIP archives, and can publish completed mission batches to a Facebook Page.

## What the App Can Do

- Create a medical mission post from three main fields: activity, location, and date.
- Upload up to 50 mission photos, with validation for image type, file size, and minimum dimensions.
- Edit selected photos before generating the final mission pack.
- Apply the FTCC overlay/frame to uploaded images in the browser.
- Generate a ready-to-use caption from the mission details.
- Preview generated images before saving.
- Save generated mission packs to backend history.
- Download a saved mission as a ZIP archive.
- Browse, filter, view, and delete mission history records.
- Publish saved mission packs to a configured Facebook Page through the Facebook Graph API.
- Receive mission submissions from Telegram, keep them pending for admin review, then load them into the editor or reject them.

## Main Workflow

1. Enter the mission activity, location, and date.
2. Upload mission photos or load a pending Telegram submission from the inbox.
3. Optionally edit individual images.
4. Generate the branded mission pack.
5. Review the caption and generated images.
6. Save the batch to history.
7. Download the ZIP or publish to Facebook when Facebook credentials are configured.

## Project Structure

```text
.
+-- frontend/              # React + Vite dashboard
|   +-- app/
|   |   +-- components/    # UI, modules, modals, and page components
|   |   +-- hooks/         # Mission generation and image editing state
|   |   +-- services/      # API clients for missions and submissions
|   |   +-- utils/         # Image processing, overlay, caption, and ZIP helpers
|   +-- public/            # FTCC logos, overlay, and favicon
+-- backend/               # Express API
|   +-- app/
|   |   +-- modules/       # Mission and submission controllers/services/routes
|   |   +-- integrations/  # Telegram bot integration
|   |   +-- helper/        # File, ZIP, caption, Facebook, and response helpers
|   |   +-- assets/        # Saved images and generated ZIP files
|   +-- prisma/            # MongoDB Prisma schema
+-- render.yaml            # Render deployment config
+-- README.md
```

## Tech Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS
- Backend: Node.js, Express 5, TypeScript
- Database: MongoDB through Prisma
- Integrations: Facebook Graph API, Telegram Bot API
- File handling: local image storage and ZIP generation

## Local Development

### Prerequisites

- Node.js 20+
- Docker Desktop (for local MongoDB)

### First-time setup

1. **Backend** — if you already have `backend/.env` with your MongoDB and API secrets, keep it as-is (it is gitignored and will not be changed by pulls). For a new machine only, copy `backend/.env.example` to `backend/.env` and fill in your `DATABASE_URL`.
2. **Frontend (local dev only)** — production builds use `frontend/.env` (Render API). To point the Vite dev server at your local backend, create `frontend/.env.local` (gitignored):

```env
VITE_API_BASE_URL=http://localhost:5000
```

3. Install dependencies and generate the Prisma client:

```bash
npm install
cd backend && npx prisma generate
```

3. Start MongoDB:

```bash
docker compose up -d
```

### Daily dev

From the repo root:

```bash
npm run dev
```

This starts MongoDB (if not already running), the backend on `http://localhost:5000`, and the frontend on `http://localhost:5173`.

You can also run services separately:

```bash
npm run dev:db        # MongoDB only
npm run dev:backend   # API only
npm run dev:frontend  # Vite dev server only
```

### Verify

- API health: `http://localhost:5000/health`
- Frontend: `http://localhost:5173`

### Optional integrations

- **Facebook**: Publishing is skipped on localhost because `APP_BASE_URL` must be a public URL. Configure `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` only when deploying.
- **Telegram**: Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ENABLE_POLLING=true` in `backend/.env`. Do not run local polling while the Render deployment is also polling the same bot (causes 409 conflicts).

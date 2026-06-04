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

## Requirements

- Node.js 20 or newer
- npm
- MongoDB connection string
- Optional: Facebook Page ID and Page access token
- Optional: Telegram bot token

## Environment Variables

### Backend

Create `backend/.env` with the values needed for your environment.

```env
DATABASE_URL="mongodb+srv://user:password@cluster.example/ftcc_medical_mission"
PORT=5000
APP_BASE_URL="http://localhost:5000"
CORS_ORIGINS="http://localhost:5173"

FACEBOOK_GRAPH_VERSION="v23.0"
FACEBOOK_PAGE_ID=""
FACEBOOK_PAGE_ACCESS_TOKEN=""

TELEGRAM_BOT_TOKEN=""
TELEGRAM_ENABLE_POLLING=false
```

Important notes:

- `DATABASE_URL` is required and must be a MongoDB URL with a database name.
- `APP_BASE_URL` must be public, not localhost, for Facebook posting to work because Facebook needs to fetch image URLs.
- `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` are optional. If they are missing, Facebook posting is skipped.
- `TELEGRAM_BOT_TOKEN` is optional. If it is missing, the Telegram bot is disabled.
- `TELEGRAM_ENABLE_POLLING=true` should only be used when no other deployed instance is polling the same bot.

### Frontend

Create `frontend/.env` when the API URL differs from the default.

```env
VITE_API_BASE_URL="http://localhost:5000"
```

In production, the frontend defaults to `https://ftcc-runner.onrender.com` unless `VITE_API_BASE_URL` or `VITE_API_URL` is provided.

## Running Locally

Install backend dependencies:

```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```

Install frontend dependencies in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

## Build Commands

Backend:

```bash
cd backend
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

## API Overview

The backend exposes mission and submission routes under `/missions`.

Mission routes:

- `GET /missions` - list saved missions
- `POST /missions` - create a saved mission from generated images
- `GET /missions/:id` - get one mission
- `DELETE /missions/:id` - delete a mission and its saved folder
- `GET /missions/:id/download` - download a mission ZIP

Submission routes:

- `GET /missions/submissions` - list Telegram or inbound submissions
- `GET /missions/submissions/:submissionId` - get one submission
- `PATCH /missions/submissions/:submissionId` - edit a pending submission
- `POST /missions/submissions/:submissionId/approve` - approve and publish a pending submission
- `POST /missions/submissions/:submissionId/reject` - reject a pending submission
- `POST /missions/submissions/:submissionId/link-published-mission` - link an inbox item to a mission created from the dashboard

The backend also serves saved image/file assets from `/assets/...`.

## Telegram Intake

When the Telegram bot is enabled, users can start a mission submission through the bot. The bot collects:

- mission activity
- location
- date in `YYYY-MM-DD` format
- one or more photos

After the user finishes the Telegram flow, the submission appears in the dashboard inbox as pending. An admin can load it into the mission editor, adjust the photos, generate the branded pack, save it to history, or reject it.

## Facebook Publishing

When a mission is saved, the backend attempts to publish it to Facebook if all Facebook settings are configured. The app uploads each generated image as unpublished media, creates a feed post with the generated caption, and attaches the uploaded media.

If Facebook settings are missing or `APP_BASE_URL` is not public, the mission is still saved to history and the Facebook step is skipped with a status message.

## Data and Storage

MongoDB stores mission metadata, submission metadata, captions, dates, folders, and image paths. Image files and generated ZIP archives are stored under the backend asset directories:

- `backend/app/assets/images`
- `backend/app/assets/files`

These paths can be changed with `IMAGE_ROOT` and `FILE_ROOT`.

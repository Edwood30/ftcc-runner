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

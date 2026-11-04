# Naresh World Telegram Stream Bot

This bot ingests **your own or distribution-authorized video uploads** from Telegram, hosts them on the server running this project, and writes metadata into the same Firebase Realtime Database collections used by the supplied admin panel:

- `#movie Title` → `movies`
- `#series Title` → `webseries` (one initial episode in season 1)
- `#short Title` → `shorts`

## Setup

1. Deploy this folder to a Node.js 20+ server with persistent disk storage.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in your Telegram bot token, public HTTPS base URL, Firebase database URL and Firebase Admin service-account JSON.
4. Set `BOT_ADMIN_IDS` to your own Telegram numeric user ID(s). Do not leave it empty in production.
5. Run `npm start` behind HTTPS. The `/media/` path serves uploaded media files.
6. In Telegram, send the bot a video with a caption such as `#short My Drama Episode 1`.

## Important hosting notes

- This starter stores files on local disk. Use persistent storage and sufficient bandwidth, or replace the disk storage function with your authorized object-storage provider (S3/R2/Cloudinary, etc.).
- Telegram Bot API file size/download limits apply. Large video ingestion needs a self-hosted Telegram Bot API server or a separate authorized upload flow.
- The bot does not scrape third-party movie sites or fetch arbitrary streaming links. It only processes videos uploaded to the bot by an authorized admin.
- Do not expose Firebase service-account credentials or the Telegram bot token in HTML/JavaScript.
- For production, add upload quotas, file-type validation, malware scanning, authentication, and signed/expiring media URLs.

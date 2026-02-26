# StreamShelf

Local-only macOS media center built with Next.js + Electron + Prisma (SQLite).

## Quick start

```bash
cd streamshelf
./setup.sh
npm run dev
```

## Stack

- Next.js 15 App Router + TypeScript strict
- Electron 30 shell
- Tailwind CSS + Framer Motion
- Prisma + SQLite
- Playwright-extra resolver with stealth + recaptcha plugins
- Video.js + HLS playback
- FFmpeg remux pipeline with Apple VideoToolbox codecs

## Key endpoints

- `POST /api/media/resolve` - Ghost resolver URL extraction
- `POST /api/playback/prepare` - MP4 remux/HLS prepare + segment cleanup
- `POST /api/addon/register` - Stremio-compatible addon manifest registration
- `GET /api/search?q=` - local media + addon catalog search

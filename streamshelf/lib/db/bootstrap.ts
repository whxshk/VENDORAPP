import { prisma } from "@/lib/db/prisma";

const demoMedia = [
  {
    tmdbId: 1000001,
    title: "Night of the Living Dead (1968)",
    type: "movie",
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    poster: "/posters/notld.svg",
    backdrop: "/backdrops/cinema.svg"
  },
  {
    tmdbId: 1000002,
    title: "His Girl Friday (1940)",
    type: "movie",
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    poster: "/posters/hgf.svg",
    backdrop: "/backdrops/cinema.svg"
  },
  {
    tmdbId: 1000003,
    title: "The General (1926)",
    type: "movie",
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    poster: "/posters/general.svg",
    backdrop: "/backdrops/cinema.svg"
  }
] as const;

export async function ensureDemoLibrary(): Promise<number> {
  await ensureDatabaseReady();
  return seedDemoLibraryForce();
}

export async function seedDemoLibraryForce(): Promise<number> {
  await ensureDatabaseReady();
  for (const media of demoMedia) {
    await prisma.media.upsert({
      where: {
        tmdbId_type: {
          tmdbId: media.tmdbId,
          type: media.type
        }
      },
      create: media,
      update: media
    });
  }

  return prisma.media.count();
}

export async function ensureDatabaseReady(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Provider" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "icon" TEXT,
      "type" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Provider_url_key" ON "Provider"("url");`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Media" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "tmdbId" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "localPath" TEXT,
      "streamUrl" TEXT,
      "poster" TEXT,
      "backdrop" TEXT,
      "type" TEXT NOT NULL,
      "refererHeader" TEXT,
      "originHeader" TEXT,
      "sourceVariants" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Media_tmdbId_idx" ON "Media"("tmdbId");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Media_tmdbId_type_key" ON "Media"("tmdbId", "type");`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Playback" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "mediaId" TEXT NOT NULL,
      "timestamp" INTEGER NOT NULL,
      "duration" INTEGER NOT NULL,
      "lastPlayed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Playback_mediaId_key" ON "Playback"("mediaId");`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Addon" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "manifestId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "endpoint" TEXT NOT NULL,
      "manifestJson" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Addon_manifestId_endpoint_key" ON "Addon"("manifestId", "endpoint");`);
}

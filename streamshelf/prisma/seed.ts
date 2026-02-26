import { prisma } from "../lib/db/prisma";

async function main(): Promise<void> {
  const mediaSeed = [
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

  for (const media of mediaSeed) {
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

  await prisma.provider.upsert({
    where: { url: "https://archive.org" },
    create: {
      name: "Internet Archive",
      url: "https://archive.org",
      type: "public-domain",
      icon: "https://archive.org/images/glogo.jpg"
    },
    update: {
      name: "Internet Archive",
      type: "public-domain",
      icon: "https://archive.org/images/glogo.jpg"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

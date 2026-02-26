import { chromium as playwrightChromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { prisma } from "@/lib/db/prisma";
import type { ResolveResult, StreamVariant } from "@/lib/types/media";

const chromium = playwrightChromium;

chromium.use(StealthPlugin());
chromium.use(RecaptchaPlugin());

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

const streamPattern = /(\.m3u8|\.mp4|manifest|playlist\.m3u8|googlevideo\.com)/i;

function qualityFromResolution(res?: string): StreamVariant["label"] {
  if (!res) return "Auto";
  const height = Number(res.split("x")[1] ?? 0);
  if (height >= 2160) return "4K";
  if (height >= 1080) return "1080p";
  if (height >= 720) return "720p";
  return "Auto";
}

function scoreVariant(variant: StreamVariant): number {
  const bandwidthScore = variant.bandwidth ?? 0;
  const resolutionScore = Number(variant.resolution?.split("x")[1] ?? 0) * 1000;
  return bandwidthScore + resolutionScore;
}

function parseHlsMasterPlaylist(body: string, baseUrl: string): StreamVariant[] {
  const lines = body.split("\n");
  const variants: StreamVariant[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim() ?? "";
    if (!line.startsWith("#EXT-X-STREAM-INF:")) continue;

    const attrLine = line.replace("#EXT-X-STREAM-INF:", "");
    const nextLine = lines[i + 1]?.trim();
    if (!nextLine || nextLine.startsWith("#")) continue;

    const bandwidthMatch = attrLine.match(/BANDWIDTH=(\d+)/i);
    const resolutionMatch = attrLine.match(/RESOLUTION=([0-9x]+)/i);
    const resolved = new URL(nextLine, baseUrl).toString();

    const resolution = resolutionMatch?.[1];
    variants.push({
      url: resolved,
      bandwidth: bandwidthMatch ? Number(bandwidthMatch[1]) : undefined,
      resolution,
      label: qualityFromResolution(resolution)
    });
  }

  return variants;
}

export async function resolveStreamingUrl(inputUrl: string, tmdbId: number, title: string, type: string): Promise<ResolveResult> {
  const requests: {
    url: string;
    referer?: string;
    origin?: string;
  }[] = [];

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"]
  });

  try {
    const context = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1512, height: 982 }
    });

    const page = await context.newPage();

    page.on("request", (request) => {
      const resourceType = request.resourceType();
      const url = request.url();
      if (!["fetch", "xhr", "other"].includes(resourceType)) return;
      if (!streamPattern.test(url)) return;
      requests.push({
        url,
        referer: request.headers()["referer"],
        origin: request.headers()["origin"]
      });
    });

    await page.goto(inputUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(8_000);

    const found = requests.find((request) => streamPattern.test(request.url));
    if (!found) {
      throw new Error("No playable source discovered by Ghost Browser resolver.");
    }

    let variants: StreamVariant[] = [{ url: found.url, label: "Auto" }];

    if (/\.m3u8/i.test(found.url)) {
      const response = await page.request.get(found.url, {
        headers: {
          Referer: found.referer ?? inputUrl,
          Origin: found.origin ?? new URL(inputUrl).origin
        }
      });

      if (response.ok()) {
        const text = await response.text();
        const parsed = parseHlsMasterPlaylist(text, found.url);
        if (parsed.length > 0) {
          variants = parsed.sort((a, b) => scoreVariant(b) - scoreVariant(a));
        }
      }
    }

    const best = variants.slice().sort((a, b) => scoreVariant(b) - scoreVariant(a))[0] ?? variants[0];

    const media = await prisma.media.upsert({
      where: {
        tmdbId_type: {
          tmdbId,
          type
        }
      },
      create: {
        tmdbId,
        title,
        type,
        streamUrl: best.url,
        refererHeader: found.referer,
        originHeader: found.origin,
        sourceVariants: JSON.stringify(variants)
      },
      update: {
        streamUrl: best.url,
        refererHeader: found.referer,
        originHeader: found.origin,
        sourceVariants: JSON.stringify(variants)
      }
    });

    return {
      streamUrl: media.streamUrl ?? best.url,
      referer: media.refererHeader ?? undefined,
      origin: media.originHeader ?? undefined,
      variants
    };
  } finally {
    await browser.close();
  }
}

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  try {
    const localDir = path.join(process.cwd(), "prisma");
    fs.mkdirSync(localDir, { recursive: true });
    return `file:${path.join(localDir, "dev.db")}`;
  } catch {
    const supportDir = path.join(os.homedir(), "Library", "Application Support", "StreamShelf");
    fs.mkdirSync(supportDir, { recursive: true });
    return `file:${path.join(supportDir, "dev.db")}`;
  }
}

const defaultDatabaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: defaultDatabaseUrl
      }
    },
    log: ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

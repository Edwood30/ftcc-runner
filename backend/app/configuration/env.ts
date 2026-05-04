import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";

dotenv.config();

function findBackendRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    const packageJsonPath = path.join(current, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error("Unable to resolve backend root directory.");
    }
    current = parent;
  }
}

const backendRoot = findBackendRoot(__dirname);
const appRoot = path.join(backendRoot, "app");

function getRequiredMongoUrl(): string {
  const value = process.env.DATABASE_URL?.trim() ?? "";
  if (!value) {
    throw new Error("DATABASE_URL is required.");
  }
  if (!value.startsWith("mongodb://") && !value.startsWith("mongodb+srv://")) {
    throw new Error("DATABASE_URL must use a MongoDB connection string.");
  }
  if (value.includes("<db_password>")) {
    throw new Error("DATABASE_URL still contains the <db_password> placeholder. Replace it with your real MongoDB password.");
  }
  try {
    const parsed = new URL(value);
    const databaseName = parsed.pathname.replace(/^\//, "").trim();
    if (!databaseName) {
      throw new Error("DATABASE_URL must include a database name in the path, for example /ftcc_medical_mission.");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("DATABASE_URL is not a valid MongoDB connection string.");
  }
  const parsed = new URL(value);
  if (!parsed.searchParams.has("serverSelectionTimeoutMS")) {
    parsed.searchParams.set("serverSelectionTimeoutMS", "5000");
  }
  return parsed.toString();
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 5000),
  DATABASE_URL: getRequiredMongoUrl(),
  APP_BASE_URL: process.env.APP_BASE_URL ?? "http://localhost:5000",
  APP_ROOT: appRoot,
  IMAGE_ROOT: process.env.IMAGE_ROOT ?? path.join(appRoot, "assets", "images"),
  FILE_ROOT: process.env.FILE_ROOT ?? path.join(appRoot, "assets", "files"),
  FACEBOOK_GRAPH_VERSION: process.env.FACEBOOK_GRAPH_VERSION ?? "v23.0",
  FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID ?? "",
  FACEBOOK_PAGE_ACCESS_TOKEN: process.env.FACEBOOK_PAGE_ACCESS_TOKEN ?? "",
  /** Optional. When set, the Telegram bot starts (long polling) and creates pending submissions. */
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "",
};

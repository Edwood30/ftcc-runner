import { env } from "../configuration/env.js";

type LogLevel = "info" | "error";

function writeLog(level: LogLevel, message: string, meta?: unknown): void {
  if (env.NODE_ENV === "production" && level === "info") {
    return;
  }

  const timestamp = new Date().toISOString();
  const serializedMeta = meta instanceof Error ? ` ${meta.stack ?? meta.message}` : meta ? ` ${JSON.stringify(meta)}` : "";
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}${serializedMeta}\n`;

  if (level === "error") {
    process.stderr.write(line);
    return;
  }

  process.stdout.write(line);
}

export const logger = {
  info(message: string, meta?: unknown): void {
    writeLog("info", message, meta);
  },
  error(message: string, meta?: unknown): void {
    writeLog("error", message, meta);
  },
};

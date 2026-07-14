import { app } from "./index.js";
import { env } from "./configuration/env.js";
import { connectPrisma, disconnectPrisma } from "./configuration/prisma.js";
import { ensureDirectory } from "./helper/file.js";
import { logger } from "./helper/logger.js";
import { startTelegramBot, stopTelegramBot } from "./integrations/telegram/telegram-bot.js";

async function bootstrap(): Promise<void> {
  await ensureDirectory(env.IMAGE_ROOT);
  await ensureDirectory(env.FILE_ROOT);
  await connectPrisma();

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    logger.info(`FTCC backend running on port ${env.PORT} with MongoDB connected`);
    startTelegramBot();
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Shutting down FTCC backend...`);
    await stopTelegramBot();
    server.close(async () => {
      await disconnectPrisma();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

void bootstrap().catch(async (error) => {
  logger.error("Failed to start server. Check MongoDB access and DATABASE_URL.", error);
  await disconnectPrisma();
  process.exit(1);
});

import { app } from "./index.js";
import { env } from "./configuration/env.js";
import { connectPrisma, disconnectPrisma } from "./configuration/prisma.js";
import { ensureDirectory } from "./helper/file.js";

async function bootstrap(): Promise<void> {
  await ensureDirectory(env.IMAGE_ROOT);
  await ensureDirectory(env.FILE_ROOT);
  await connectPrisma();

  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`FTCC backend running on port ${env.PORT} with MongoDB connected`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(`Received ${signal}. Shutting down FTCC backend...`);
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
  // eslint-disable-next-line no-console
  console.error("Failed to start server. Check MongoDB access and DATABASE_URL:", error);
  await disconnectPrisma();
  process.exit(1);
});

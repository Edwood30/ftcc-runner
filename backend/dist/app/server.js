"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("./index.js");
const env_js_1 = require("./configuration/env.js");
const prisma_js_1 = require("./configuration/prisma.js");
const file_js_1 = require("./helper/file.js");
const logger_js_1 = require("./helper/logger.js");
const telegram_bot_js_1 = require("./integrations/telegram/telegram-bot.js");
async function bootstrap() {
    await (0, file_js_1.ensureDirectory)(env_js_1.env.IMAGE_ROOT);
    await (0, file_js_1.ensureDirectory)(env_js_1.env.FILE_ROOT);
    await (0, prisma_js_1.connectPrisma)();
    const server = index_js_1.app.listen(env_js_1.env.PORT, () => {
        logger_js_1.logger.info(`FTCC backend running on port ${env_js_1.env.PORT} with MongoDB connected`);
        (0, telegram_bot_js_1.startTelegramBot)();
    });
    const shutdown = async (signal) => {
        logger_js_1.logger.info(`Received ${signal}. Shutting down FTCC backend...`);
        await (0, telegram_bot_js_1.stopTelegramBot)();
        server.close(async () => {
            await (0, prisma_js_1.disconnectPrisma)();
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
    logger_js_1.logger.error("Failed to start server. Check MongoDB access and DATABASE_URL.", error);
    await (0, prisma_js_1.disconnectPrisma)();
    process.exit(1);
});

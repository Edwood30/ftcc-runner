"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("./index.js");
const env_js_1 = require("./configuration/env.js");
const prisma_js_1 = require("./configuration/prisma.js");
const file_js_1 = require("./helper/file.js");
async function bootstrap() {
    await (0, file_js_1.ensureDirectory)(env_js_1.env.IMAGE_ROOT);
    await (0, file_js_1.ensureDirectory)(env_js_1.env.FILE_ROOT);
    await (0, prisma_js_1.connectPrisma)();
    const server = index_js_1.app.listen(env_js_1.env.PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`FTCC backend running on port ${env_js_1.env.PORT} with MongoDB connected`);
    });
    const shutdown = async (signal) => {
        // eslint-disable-next-line no-console
        console.log(`Received ${signal}. Shutting down FTCC backend...`);
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
    // eslint-disable-next-line no-console
    console.error("Failed to start server. Check MongoDB access and DATABASE_URL:", error);
    await (0, prisma_js_1.disconnectPrisma)();
    process.exit(1);
});

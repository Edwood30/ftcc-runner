"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const env_js_1 = require("../configuration/env.js");
function writeLog(level, message, meta) {
    if (env_js_1.env.NODE_ENV === "production" && level === "info") {
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
exports.logger = {
    info(message, meta) {
        writeLog("info", message, meta);
    },
    error(message, meta) {
        writeLog("error", message, meta);
    },
};

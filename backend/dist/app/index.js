"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const node_path_1 = __importDefault(require("node:path"));
const env_js_1 = require("./configuration/env.js");
const prisma_js_1 = require("./configuration/prisma.js");
const logger_middleware_js_1 = require("./middleware/logger.middleware.js");
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const mission_router_js_1 = require("./modules/mission/mission.router.js");
const submission_router_js_1 = require("./modules/submission/submission.router.js");
exports.app = (0, express_1.default)();
const defaultAllowedOriginPatterns = [
    /^https:\/\/[\w-]+\.vercel\.app$/,
    /^https:\/\/[\w-]+\.web\.app$/,
    /^https:\/\/[\w-]+\.firebaseapp\.com$/,
];
const localAllowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
function isAllowedOrigin(origin) {
    const normalizedOrigin = origin.replace(/\/+$/, "");
    return (env_js_1.env.CORS_ORIGINS.includes(normalizedOrigin) ||
        (env_js_1.env.NODE_ENV !== "production" && localAllowedOrigins.includes(normalizedOrigin)) ||
        defaultAllowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin)));
}
const corsOptions = {
    origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Role"],
};
exports.app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
exports.app.use((0, cors_1.default)(corsOptions));
exports.app.use(express_1.default.json({ limit: "25mb" }));
exports.app.use(logger_middleware_js_1.loggerMiddleware);
exports.app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "FTCC Medical Mission API",
        data: { health: "/health", missions: "/missions" },
    });
});
exports.app.get("/assets/*path", (req, res, next) => {
    try {
        const assetRoot = node_path_1.default.join(env_js_1.env.APP_ROOT, "assets");
        const relativePath = Array.isArray(req.params.path) ? req.params.path.join(node_path_1.default.sep) : String(req.params.path ?? "");
        const resolvedPath = node_path_1.default.resolve(assetRoot, relativePath);
        if (!resolvedPath.startsWith(assetRoot)) {
            res.status(403).json({
                success: false,
                message: "Invalid asset path.",
                data: null,
            });
            return;
        }
        res.sendFile(resolvedPath, (error) => {
            if (error && !res.headersSent) {
                next(error);
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.app.get("/health", async (_req, res, next) => {
    try {
        await (0, prisma_js_1.pingPrisma)();
        res.json({
            success: true,
            message: "Backend and MongoDB are healthy.",
            data: { uptime: process.uptime(), database: "connected" },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.app.use("/missions", submission_router_js_1.submissionRouter);
exports.app.use("/missions", mission_router_js_1.missionRouter);
exports.app.use(error_middleware_js_1.errorMiddleware);

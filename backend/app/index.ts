import cors from "cors";
import type { CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { env } from "./configuration/env.js";
import { pingPrisma } from "./configuration/prisma.js";
import { loggerMiddleware } from "./middleware/logger.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { branchRouter } from "./modules/branch/branch.router.js";
import { missionRouter } from "./modules/mission/mission.router.js";
import { submissionRouter } from "./modules/submission/submission.router.js";

export const app = express();

const defaultAllowedOriginPatterns = [
  /^https:\/\/[\w-]+\.vercel\.app$/,
  /^https:\/\/[\w-]+\.web\.app$/,
  /^https:\/\/[\w-]+\.firebaseapp\.com$/,
];

const localAllowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

function isLocalNetworkOrigin(origin: string): boolean {
  const normalizedOrigin = origin.replace(/\/+$/, "");
  const match = normalizedOrigin.match(/^https?:\/\/(.+):(\d+)$/);
  if (!match) return false;
  const hostname = match[1];
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return /^(10|192\.168|172\.(1[6-9]|2\d|3[0-1]))\./.test(hostname);
}

function isAllowedOrigin(origin: string): boolean {
  const normalizedOrigin = origin.replace(/\/+$/, "");
  return (
    env.CORS_ORIGINS.includes(normalizedOrigin) ||
    (env.NODE_ENV !== "production" && (localAllowedOrigins.includes(normalizedOrigin) || isLocalNetworkOrigin(normalizedOrigin))) ||
    defaultAllowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin))
  );
}

const corsOptions: CorsOptions = {
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

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors(corsOptions));
app.use(express.json({ limit: "25mb" }));
app.use(loggerMiddleware);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "FTCC Medical Mission API",
    data: { health: "/health", missions: "/missions" },
  });
});

app.get("/assets/*path", (req, res, next) => {
  try {
    const assetRoot = path.join(env.APP_ROOT, "assets");
    const relativePath = Array.isArray(req.params.path) ? req.params.path.join(path.sep) : String(req.params.path ?? "");
    const resolvedPath = path.resolve(assetRoot, relativePath);

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
  } catch (error) {
    next(error);
  }
});

app.get("/health", async (_req, res, next) => {
  try {
    await pingPrisma();
    res.json({
      success: true,
      message: "Backend and MongoDB are healthy.",
      data: { uptime: process.uptime(), database: "connected" },
    });
  } catch (error) {
    next(error);
  }
});

app.get("/debug", (_req, res) => {
  res.json({
    success: true,
    message: "Backend API is running",
    data: {
      env: process.env.NODE_ENV,
      port: process.env.PORT,
      apiRoot: process.env.APP_ROOT,
      routes: [
        "GET /",
        "GET /health",
        "GET /debug",
        "GET /branches",
        "POST /branches",
        "DELETE /branches/:id",
        "POST /missions",
        "GET /missions",
        "GET /missions/:id",
      ],
    },
  });
});

app.use("/branches", branchRouter);
app.use("/missions", submissionRouter);
app.use("/missions", missionRouter);

// Catch-all 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
    data: null,
  });
});

app.use(errorMiddleware);

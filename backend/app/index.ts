import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { env } from "./configuration/env.js";
import { pingPrisma } from "./configuration/prisma.js";
import { loggerMiddleware } from "./middleware/logger.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { missionRouter } from "./modules/mission/mission.router.js";

export const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(loggerMiddleware);

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

app.use("/missions", missionRouter);
app.use(errorMiddleware);

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { missionController } from "./mission.controller.js";

export const missionRouter = Router();

missionRouter.post("/", authMiddleware, (req, res, next) => missionController.createMission(req, res, next));
missionRouter.get("/", (req, res, next) => missionController.getMissions(req, res, next));
missionRouter.get("/:id", (req, res, next) => missionController.getMissionById(req, res, next));
missionRouter.delete("/:id", authMiddleware, (req, res, next) => missionController.deleteMission(req, res, next));
missionRouter.get("/:id/download", (req, res, next) => missionController.downloadMissionZip(req, res, next));

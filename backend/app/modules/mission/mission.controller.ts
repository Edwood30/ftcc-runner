import type { NextFunction, Request, Response } from "express";
import { createResponse } from "../../helper/api-response.js";
import { missionService } from "./mission.service.js";
import { createMissionSchema, missionQuerySchema } from "./mission.types.js";

export class MissionController {
  async createMission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = createMissionSchema.parse(req.body);
      const result = await missionService.createMission(payload);
      res.status(201).json(createResponse("Mission created successfully.", result));
    } catch (error) {
      next(error);
    }
  }

  async getMissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = missionQuerySchema.parse(req.query);
      const result = await missionService.listMissions(query);
      res.json(createResponse("Missions retrieved successfully.", result));
    } catch (error) {
      next(error);
    }
  }

  async getMissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const missionId = String(req.params.id);
      const result = await missionService.getMissionById(missionId);
      res.json(createResponse("Mission retrieved successfully.", result));
    } catch (error) {
      next(error);
    }
  }

  async deleteMission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const missionId = String(req.params.id);
      const result = await missionService.deleteMission(missionId);
      res.json(createResponse("Mission deleted successfully.", result));
    } catch (error) {
      next(error);
    }
  }

  async downloadMissionZip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const missionId = String(req.params.id);
      const result = await missionService.getMissionZip(missionId);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
      result.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

export const missionController = new MissionController();

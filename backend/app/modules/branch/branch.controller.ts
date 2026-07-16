import type { NextFunction, Request, Response } from "express";
import { createResponse } from "../../helper/api-response.js";
import { logger } from "../../helper/logger.js";
import { branchService } from "./branch.service.js";

export class BranchController {
  async listBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branches = await branchService.listBranches();
      res.json(createResponse("Branches retrieved successfully.", branches));
    } catch (error) {
      logger.error("Error listing branches:", error);
      next(error);
    }
  }

  async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info("Creating new branch with payload:", { name: req.body?.name, hasOverlay: Boolean(req.body?.overlaySrc) });
      const branches = await branchService.createBranch(req.body);
      res.status(201).json(createResponse("Branch saved successfully.", branches));
    } catch (error) {
      logger.error("Error creating branch:", error);
      next(error);
    }
  }

  async deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branchId = String(req.params.id);
      logger.info(`Deleting branch: ${branchId}`);
      const branches = await branchService.deleteBranch(branchId);
      res.json(createResponse("Branch deleted successfully.", branches));
    } catch (error) {
      logger.error("Error deleting branch:", error);
      next(error);
    }
  }
}

export const branchController = new BranchController();

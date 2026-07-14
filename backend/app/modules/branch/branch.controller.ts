import type { NextFunction, Request, Response } from "express";
import { createResponse } from "../../helper/api-response.js";
import { branchService } from "./branch.service.js";

export class BranchController {
  async listBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branches = await branchService.listBranches();
      res.json(createResponse("Branches retrieved successfully.", branches));
    } catch (error) {
      next(error);
    }
  }

  async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branches = await branchService.createBranch(req.body);
      res.status(201).json(createResponse("Branch saved successfully.", branches));
    } catch (error) {
      next(error);
    }
  }

  async deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branchId = String(req.params.id);
      const branches = await branchService.deleteBranch(branchId);
      res.json(createResponse("Branch deleted successfully.", branches));
    } catch (error) {
      next(error);
    }
  }
}

export const branchController = new BranchController();

import { Router } from "express";
import { logger } from "../../helper/logger.js";
import { branchController } from "./branch.controller.js";

export const branchRouter = Router();

// Log all branch requests for debugging
branchRouter.use((req, _res, next) => {
  logger.info(`[BRANCH] ${req.method} ${req.path}`);
  next();
});

branchRouter.get("/", (req, res, next) => branchController.listBranches(req, res, next));
branchRouter.post("/", (req, res, next) => branchController.createBranch(req, res, next));
branchRouter.delete("/:id", (req, res, next) => branchController.deleteBranch(req, res, next));

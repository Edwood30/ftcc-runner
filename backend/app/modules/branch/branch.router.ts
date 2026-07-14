import { Router } from "express";
import { branchController } from "./branch.controller.js";

export const branchRouter = Router();

branchRouter.get("/", (req, res, next) => branchController.listBranches(req, res, next));
branchRouter.post("/", (req, res, next) => branchController.createBranch(req, res, next));
branchRouter.delete("/:id", (req, res, next) => branchController.deleteBranch(req, res, next));

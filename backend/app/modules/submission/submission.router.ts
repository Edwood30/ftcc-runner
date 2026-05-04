import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { submissionController } from "./submission.controller.js";

/** Mounted at `/missions` so paths are `/missions/submissions`, etc. */
export const submissionRouter = Router();

submissionRouter.get("/submissions", authMiddleware, (req, res, next) =>
  submissionController.listSubmissions(req, res, next),
);
submissionRouter.get("/submissions/:submissionId", authMiddleware, (req, res, next) =>
  submissionController.getSubmissionById(req, res, next),
);
submissionRouter.patch("/submissions/:submissionId", authMiddleware, (req, res, next) =>
  submissionController.updateSubmission(req, res, next),
);
submissionRouter.post("/submissions/:submissionId/approve", authMiddleware, (req, res, next) =>
  submissionController.approveSubmission(req, res, next),
);
submissionRouter.post("/submissions/:submissionId/reject", authMiddleware, (req, res, next) =>
  submissionController.rejectSubmission(req, res, next),
);
submissionRouter.post("/submissions/:submissionId/link-published-mission", authMiddleware, (req, res, next) =>
  submissionController.linkToPublishedMission(req, res, next),
);

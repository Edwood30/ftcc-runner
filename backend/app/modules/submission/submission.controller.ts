import type { NextFunction, Request, Response } from "express";
import { createResponse } from "../../helper/api-response.js";
import { submissionService } from "./submission.service.js";
import {
  linkPublishedMissionSchema,
  rejectSubmissionSchema,
  submissionQuerySchema,
  updateSubmissionSchema,
} from "./submission.types.js";

export class SubmissionController {
  async listSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = submissionQuerySchema.parse(req.query);
      const result = await submissionService.listSubmissions(query);
      res.json(createResponse("Submissions retrieved successfully.", result));
    } catch (error) {
      next(error);
    }
  }

  async getSubmissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.submissionId);
      const result = await submissionService.getSubmissionById(id);
      res.json(createResponse("Submission retrieved successfully.", result));
    } catch (error) {
      next(error);
    }
  }

  async updateSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.submissionId);
      const payload = updateSubmissionSchema.parse(req.body);
      const result = await submissionService.updateSubmission(id, payload);
      res.json(createResponse("Submission updated successfully.", result));
    } catch (error) {
      next(error);
    }
  }

  async approveSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.submissionId);
      const result = await submissionService.approveSubmission(id);
      res.json(createResponse("Submission approved and published as a mission.", result));
    } catch (error) {
      next(error);
    }
  }

  async rejectSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.submissionId);
      const payload = rejectSubmissionSchema.parse(req.body ?? {});
      const result = await submissionService.rejectSubmission(id, payload);
      res.json(createResponse("Submission rejected.", result));
    } catch (error) {
      next(error);
    }
  }

  async linkToPublishedMission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.submissionId);
      const payload = linkPublishedMissionSchema.parse(req.body ?? {});
      const result = await submissionService.linkToPublishedMission(id, payload);
      res.json(createResponse("Submission linked to published mission.", result));
    } catch (error) {
      next(error);
    }
  }
}

export const submissionController = new SubmissionController();

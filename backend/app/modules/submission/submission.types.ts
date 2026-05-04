import { z } from "zod";

export const submissionStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const submissionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: submissionStatusSchema.optional(),
});

export const updateSubmissionSchema = z.object({
  what: z.string().min(1).optional(),
  where: z.string().min(1).optional(),
  when: z.coerce.date().optional(),
  caption: z.string().min(1).optional(),
});

export const rejectSubmissionSchema = z.object({
  reviewNote: z.string().max(2000).optional(),
});

export const linkPublishedMissionSchema = z.object({
  missionId: z.string().min(1),
});

export type SubmissionQueryInput = z.infer<typeof submissionQuerySchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type RejectSubmissionInput = z.infer<typeof rejectSubmissionSchema>;
export type LinkPublishedMissionInput = z.infer<typeof linkPublishedMissionSchema>;

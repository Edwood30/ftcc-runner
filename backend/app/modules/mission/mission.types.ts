import { z } from "zod";

export const createMissionSchema = z.object({
  what: z.string().min(1),
  where: z.string().min(1),
  when: z.coerce.date(),
  caption: z.string().min(1),
  images: z.array(z.string().min(1)).min(1),
});

export const missionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  where: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type CreateMissionInput = z.infer<typeof createMissionSchema>;
export type MissionQueryInput = z.infer<typeof missionQuerySchema>;

import type { MissionSubmission, Prisma } from "@prisma/client";
import { prisma } from "../../configuration/prisma.js";
import type { SubmissionQueryInput, UpdateSubmissionInput } from "./submission.types.js";

export interface CreateSubmissionRecordInput {
  what: string;
  where: string;
  when: Date;
  caption: string;
  folder: string;
  images: string[];
  telegramChatId?: string | null;
  telegramUserId?: string | null;
  telegramUsername?: string | null;
}

export class SubmissionRepository {
  async create(data: CreateSubmissionRecordInput): Promise<MissionSubmission> {
    return prisma.missionSubmission.create({
      data: {
        what: data.what,
        where: data.where,
        when: data.when,
        caption: data.caption,
        folder: data.folder,
        images: data.images,
        telegramChatId: data.telegramChatId ?? undefined,
        telegramUserId: data.telegramUserId ?? undefined,
        telegramUsername: data.telegramUsername ?? undefined,
      },
    });
  }

  async findById(id: string): Promise<MissionSubmission | null> {
    return prisma.missionSubmission.findUnique({ where: { id } });
  }

  async findMany(query: SubmissionQueryInput): Promise<{ items: MissionSubmission[]; total: number; page: number; limit: number }> {
    const where: Prisma.MissionSubmissionWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    const [items, total] = await Promise.all([
      prisma.missionSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.missionSubmission.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async updateById(id: string, data: UpdateSubmissionInput): Promise<MissionSubmission | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    return prisma.missionSubmission.update({
      where: { id },
      data: {
        ...(data.what !== undefined ? { what: data.what } : {}),
        ...(data.where !== undefined ? { where: data.where } : {}),
        ...(data.when !== undefined ? { when: data.when } : {}),
        ...(data.caption !== undefined ? { caption: data.caption } : {}),
      },
    });
  }

  async markApproved(id: string, publishedMissionId: string): Promise<MissionSubmission> {
    return prisma.missionSubmission.update({
      where: { id },
      data: {
        status: "APPROVED",
        publishedMissionId,
      },
    });
  }

  async markRejected(id: string, reviewNote?: string | null): Promise<MissionSubmission> {
    return prisma.missionSubmission.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewNote: reviewNote ?? null,
      },
    });
  }

  /** Marks a pending submission as approved after the mission was created via the main dashboard flow. */
  async markLinkedToPublishedMission(id: string, missionId: string): Promise<MissionSubmission> {
    return prisma.missionSubmission.update({
      where: { id },
      data: {
        status: "APPROVED",
        publishedMissionId: missionId,
      },
    });
  }
}

export const submissionRepository = new SubmissionRepository();

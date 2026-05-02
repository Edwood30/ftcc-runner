import type { Mission, Prisma } from "@prisma/client";
import { prisma } from "../../configuration/prisma.js";
import type { CreateMissionInput, MissionQueryInput } from "./mission.types.js";

export class MissionRepository {
  async create(data: CreateMissionInput & { folder: string; images: string[] }): Promise<Mission> {
    return prisma.mission.create({ data });
  }

  async findAll(query: MissionQueryInput): Promise<{ items: Mission[]; total: number; page: number; limit: number }> {
    const whereInput: Prisma.MissionWhereInput = {};
    if (query.where) {
      whereInput.where = {
        contains: query.where,
        mode: "insensitive",
      };
    }
    if (query.from || query.to) {
      whereInput.when = {
        gte: query.from,
        lte: query.to,
      };
    }

    const [items, total] = await Promise.all([
      prisma.mission.findMany({
        where: whereInput,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.mission.count({ where: whereInput }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(id: string): Promise<Mission | null> {
    return prisma.mission.findUnique({ where: { id } });
  }

  async deleteById(id: string): Promise<Mission | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    await prisma.mission.delete({ where: { id } });
    return existing;
  }
}

export const missionRepository = new MissionRepository();

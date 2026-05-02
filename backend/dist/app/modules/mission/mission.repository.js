"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missionRepository = exports.MissionRepository = void 0;
const prisma_js_1 = require("../../configuration/prisma.js");
class MissionRepository {
    async create(data) {
        return prisma_js_1.prisma.mission.create({ data });
    }
    async findAll(query) {
        const whereInput = {};
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
            prisma_js_1.prisma.mission.findMany({
                where: whereInput,
                orderBy: { createdAt: "desc" },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
            prisma_js_1.prisma.mission.count({ where: whereInput }),
        ]);
        return {
            items,
            total,
            page: query.page,
            limit: query.limit,
        };
    }
    async findById(id) {
        return prisma_js_1.prisma.mission.findUnique({ where: { id } });
    }
    async deleteById(id) {
        const existing = await this.findById(id);
        if (!existing)
            return null;
        await prisma_js_1.prisma.mission.delete({ where: { id } });
        return existing;
    }
}
exports.MissionRepository = MissionRepository;
exports.missionRepository = new MissionRepository();

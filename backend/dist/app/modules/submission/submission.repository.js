"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionRepository = exports.SubmissionRepository = void 0;
const prisma_js_1 = require("../../configuration/prisma.js");
class SubmissionRepository {
    async create(data) {
        return prisma_js_1.prisma.missionSubmission.create({
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
    async findById(id) {
        return prisma_js_1.prisma.missionSubmission.findUnique({ where: { id } });
    }
    async findMany(query) {
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        const [items, total] = await Promise.all([
            prisma_js_1.prisma.missionSubmission.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
            prisma_js_1.prisma.missionSubmission.count({ where }),
        ]);
        return { items, total, page: query.page, limit: query.limit };
    }
    async updateById(id, data) {
        const existing = await this.findById(id);
        if (!existing)
            return null;
        return prisma_js_1.prisma.missionSubmission.update({
            where: { id },
            data: {
                ...(data.what !== undefined ? { what: data.what } : {}),
                ...(data.where !== undefined ? { where: data.where } : {}),
                ...(data.when !== undefined ? { when: data.when } : {}),
                ...(data.caption !== undefined ? { caption: data.caption } : {}),
            },
        });
    }
    async markApproved(id, publishedMissionId) {
        return prisma_js_1.prisma.missionSubmission.update({
            where: { id },
            data: {
                status: "APPROVED",
                publishedMissionId,
            },
        });
    }
    async markRejected(id, reviewNote) {
        return prisma_js_1.prisma.missionSubmission.update({
            where: { id },
            data: {
                status: "REJECTED",
                reviewNote: reviewNote ?? null,
            },
        });
    }
    /** Marks a pending submission as approved after the mission was created via the main dashboard flow. */
    async markLinkedToPublishedMission(id, missionId) {
        return prisma_js_1.prisma.missionSubmission.update({
            where: { id },
            data: {
                status: "APPROVED",
                publishedMissionId: missionId,
            },
        });
    }
}
exports.SubmissionRepository = SubmissionRepository;
exports.submissionRepository = new SubmissionRepository();

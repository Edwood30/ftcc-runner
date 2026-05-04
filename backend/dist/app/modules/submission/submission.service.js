"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionService = exports.SubmissionService = void 0;
const env_js_1 = require("../../configuration/env.js");
const caption_js_1 = require("../../helper/caption.js");
const file_js_1 = require("../../helper/file.js");
const facebook_js_1 = require("../../helper/facebook.js");
const mission_repository_js_1 = require("../mission/mission.repository.js");
const submission_repository_js_1 = require("./submission.repository.js");
function missionImagePublicUrl(relativePath) {
    return `${env_js_1.env.APP_BASE_URL}/${relativePath.replace(/\\/g, "/")}`;
}
class SubmissionService {
    async createPendingFromTelegram(input) {
        if (!input.photoBuffers.length) {
            throw new Error("At least one image is required.");
        }
        const folder = (0, file_js_1.buildPendingSubmissionFolder)(input.where, input.when);
        const images = await (0, file_js_1.saveMissionImageBuffers)(folder, input.photoBuffers);
        const caption = (0, caption_js_1.generateCaptionFromFields)(input.what, input.where, input.when);
        return submission_repository_js_1.submissionRepository.create({
            what: input.what,
            where: input.where,
            when: input.when,
            caption,
            folder,
            images,
            telegramChatId: String(input.telegramChatId),
            telegramUserId: String(input.telegramUserId),
            telegramUsername: input.telegramUsername ?? null,
        });
    }
    async listSubmissions(query) {
        return submission_repository_js_1.submissionRepository.findMany(query);
    }
    async getSubmissionById(id) {
        const submission = await submission_repository_js_1.submissionRepository.findById(id);
        if (!submission) {
            throw new Error("Submission not found.");
        }
        return submission;
    }
    async updateSubmission(id, data) {
        const existing = await submission_repository_js_1.submissionRepository.findById(id);
        if (!existing) {
            throw new Error("Submission not found.");
        }
        if (existing.status !== "PENDING") {
            throw new Error("Only pending submissions can be edited.");
        }
        const what = data.what ?? existing.what;
        const where = data.where ?? existing.where;
        const when = data.when ?? existing.when;
        const merged = { ...data };
        if (data.caption === undefined &&
            (data.what !== undefined || data.where !== undefined || data.when !== undefined)) {
            merged.caption = (0, caption_js_1.generateCaptionFromFields)(what, where, when);
        }
        const updated = await submission_repository_js_1.submissionRepository.updateById(id, merged);
        if (!updated) {
            throw new Error("Submission not found.");
        }
        return updated;
    }
    async approveSubmission(id) {
        const submission = await submission_repository_js_1.submissionRepository.findById(id);
        if (!submission) {
            throw new Error("Submission not found.");
        }
        if (submission.status !== "PENDING") {
            throw new Error("Only pending submissions can be approved.");
        }
        const mission = await mission_repository_js_1.missionRepository.create({
            what: submission.what,
            where: submission.where,
            when: submission.when,
            caption: submission.caption,
            folder: submission.folder,
            images: submission.images,
        });
        const facebook = await (0, facebook_js_1.publishMissionToFacebook)(mission.caption, mission.images.map((imagePath) => missionImagePublicUrl(imagePath)));
        await submission_repository_js_1.submissionRepository.markApproved(submission.id, mission.id);
        return { mission, facebook };
    }
    async rejectSubmission(id, body) {
        const submission = await submission_repository_js_1.submissionRepository.findById(id);
        if (!submission) {
            throw new Error("Submission not found.");
        }
        if (submission.status !== "PENDING") {
            throw new Error("Only pending submissions can be rejected.");
        }
        return submission_repository_js_1.submissionRepository.markRejected(id, body.reviewNote);
    }
    /** Call after saving a mission from the dashboard when that flow started from an inbox submission. */
    async linkToPublishedMission(submissionId, body) {
        const submission = await submission_repository_js_1.submissionRepository.findById(submissionId);
        if (!submission) {
            throw new Error("Submission not found.");
        }
        if (submission.status !== "PENDING") {
            throw new Error("Only pending submissions can be linked to a published mission.");
        }
        const mission = await mission_repository_js_1.missionRepository.findById(body.missionId);
        if (!mission) {
            throw new Error("Mission not found.");
        }
        return submission_repository_js_1.submissionRepository.markLinkedToPublishedMission(submissionId, mission.id);
    }
}
exports.SubmissionService = SubmissionService;
exports.submissionService = new SubmissionService();

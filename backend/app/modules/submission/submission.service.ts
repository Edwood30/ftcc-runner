import type { MissionSubmission } from "@prisma/client";
import { env } from "../../configuration/env.js";
import { DEFAULT_MISSION_SERVICES, generateCaptionFromFields } from "../../helper/caption.js";
import { buildPendingSubmissionFolder, saveMissionImageBuffers } from "../../helper/file.js";
import { publishMissionToFacebook } from "../../helper/facebook.js";
import { missionRepository } from "../mission/mission.repository.js";
import { submissionRepository } from "./submission.repository.js";
import type {
  LinkPublishedMissionInput,
  RejectSubmissionInput,
  SubmissionQueryInput,
  UpdateSubmissionInput,
} from "./submission.types.js";

function missionImagePublicUrl(relativePath: string): string {
  return `${env.APP_BASE_URL}/${relativePath.replace(/\\/g, "/")}`;
}

export class SubmissionService {
  async createPendingFromTelegram(input: {
    what: string;
    where: string;
    when: Date;
    photoBuffers: Buffer[];
    telegramChatId: number;
    telegramUserId: number;
    telegramUsername?: string;
  }): Promise<MissionSubmission> {
    if (!input.photoBuffers.length) {
      throw new Error("At least one image is required.");
    }
    const folder = buildPendingSubmissionFolder(input.where, input.when);
    const images = await saveMissionImageBuffers(folder, input.photoBuffers);
    const caption = generateCaptionFromFields(
      input.what,
      input.where,
      input.when,
      "after",
      [...DEFAULT_MISSION_SERVICES],
    );
    return submissionRepository.create({
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

  async listSubmissions(query: SubmissionQueryInput) {
    return submissionRepository.findMany(query);
  }

  async getSubmissionById(id: string): Promise<MissionSubmission> {
    const submission = await submissionRepository.findById(id);
    if (!submission) {
      throw new Error("Submission not found.");
    }
    return submission;
  }

  async updateSubmission(id: string, data: UpdateSubmissionInput): Promise<MissionSubmission> {
    const existing = await submissionRepository.findById(id);
    if (!existing) {
      throw new Error("Submission not found.");
    }
    if (existing.status !== "PENDING") {
      throw new Error("Only pending submissions can be edited.");
    }
    const what = data.what ?? existing.what;
    const where = data.where ?? existing.where;
    const when = data.when ?? existing.when;
    const merged: UpdateSubmissionInput = { ...data };
    if (
      data.caption === undefined &&
      (data.what !== undefined || data.where !== undefined || data.when !== undefined)
    ) {
      merged.caption = generateCaptionFromFields(what, where, when, "after", [...DEFAULT_MISSION_SERVICES]);
    }
    const updated = await submissionRepository.updateById(id, merged);
    if (!updated) {
      throw new Error("Submission not found.");
    }
    return updated;
  }

  async approveSubmission(id: string): Promise<{ mission: Awaited<ReturnType<typeof missionRepository.create>>; facebook: Awaited<ReturnType<typeof publishMissionToFacebook>> }> {
    const submission = await submissionRepository.findById(id);
    if (!submission) {
      throw new Error("Submission not found.");
    }
    if (submission.status !== "PENDING") {
      throw new Error("Only pending submissions can be approved.");
    }
    const mission = await missionRepository.create({
      what: submission.what,
      where: submission.where,
      when: submission.when,
      caption: submission.caption,
      folder: submission.folder,
      images: submission.images,
    });
    const facebook = await publishMissionToFacebook(
      mission.caption,
      mission.images.map((imagePath: string) => missionImagePublicUrl(imagePath)),
    );
    await submissionRepository.markApproved(submission.id, mission.id);
    return { mission, facebook };
  }

  async rejectSubmission(id: string, body: RejectSubmissionInput): Promise<MissionSubmission> {
    const submission = await submissionRepository.findById(id);
    if (!submission) {
      throw new Error("Submission not found.");
    }
    if (submission.status !== "PENDING") {
      throw new Error("Only pending submissions can be rejected.");
    }
    return submissionRepository.markRejected(id, body.reviewNote);
  }

  /** Call after saving a mission from the dashboard when that flow started from an inbox submission. */
  async linkToPublishedMission(submissionId: string, body: LinkPublishedMissionInput): Promise<MissionSubmission> {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw new Error("Submission not found.");
    }
    if (submission.status !== "PENDING") {
      throw new Error("Only pending submissions can be linked to a published mission.");
    }
    const mission = await missionRepository.findById(body.missionId);
    if (!mission) {
      throw new Error("Mission not found.");
    }
    return submissionRepository.markLinkedToPublishedMission(submissionId, mission.id);
  }
}

export const submissionService = new SubmissionService();

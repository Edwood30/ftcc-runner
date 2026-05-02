import fs from "node:fs";
import path from "node:path";
import { env } from "../../configuration/env.js";
import { publishMissionToFacebook } from "../../helper/facebook.js";
import { buildMissionFolderName, removeMissionFolder, saveMissionImages } from "../../helper/file.js";
import { createMissionZip } from "../../helper/zip.js";
import { missionRepository } from "./mission.repository.js";
import type { CreateMissionInput, MissionQueryInput } from "./mission.types.js";

export class MissionService {
  async createMission(input: CreateMissionInput) {
    const folder = buildMissionFolderName(input.where, input.when);
    const imagePaths = await saveMissionImages(folder, input.images);
    const mission = await missionRepository.create({
      what: input.what,
      where: input.where,
      when: input.when,
      caption: input.caption,
      folder,
      images: imagePaths,
    });
    const facebook = await publishMissionToFacebook(
      input.caption,
      imagePaths.map((imagePath) => this.getMissionPublicUrl(imagePath)),
    );
    return { mission, facebook };
  }

  async listMissions(query: MissionQueryInput) {
    return missionRepository.findAll(query);
  }

  async getMissionById(id: string) {
    const mission = await missionRepository.findById(id);
    if (!mission) {
      throw new Error("Mission not found.");
    }
    return mission;
  }

  async deleteMission(id: string) {
    const mission = await missionRepository.deleteById(id);
    if (!mission) {
      throw new Error("Mission not found.");
    }
    await removeMissionFolder(mission.folder);
    return mission;
  }

  async getMissionZip(id: string): Promise<{ stream: fs.ReadStream; fileName: string }> {
    const mission = await this.getMissionById(id);
    const { zipPath, fileName } = await createMissionZip(mission.folder);
    return { stream: fs.createReadStream(zipPath), fileName };
  }

  getMissionPublicUrl(imagePath: string): string {
    return `${env.APP_BASE_URL}/${imagePath.replace(/\\/g, "/")}`;
  }

  getMissionAbsolutePath(relativePath: string): string {
    return path.join(env.APP_ROOT, relativePath);
  }
}

export const missionService = new MissionService();

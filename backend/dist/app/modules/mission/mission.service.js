"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.missionService = exports.MissionService = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const env_js_1 = require("../../configuration/env.js");
const facebook_js_1 = require("../../helper/facebook.js");
const file_js_1 = require("../../helper/file.js");
const zip_js_1 = require("../../helper/zip.js");
const mission_repository_js_1 = require("./mission.repository.js");
class MissionService {
    async createMission(input) {
        const folder = (0, file_js_1.buildMissionFolderName)(input.where, input.when);
        const imagePaths = await (0, file_js_1.saveMissionImages)(folder, input.images);
        const mission = await mission_repository_js_1.missionRepository.create({
            what: input.what,
            where: input.where,
            when: input.when,
            caption: input.caption,
            folder,
            images: imagePaths,
        });
        const facebook = await (0, facebook_js_1.publishMissionToFacebook)(input.caption, imagePaths.map((imagePath) => this.getMissionPublicUrl(imagePath)));
        return { mission, facebook };
    }
    async listMissions(query) {
        return mission_repository_js_1.missionRepository.findAll(query);
    }
    async getMissionById(id) {
        const mission = await mission_repository_js_1.missionRepository.findById(id);
        if (!mission) {
            throw new Error("Mission not found.");
        }
        return mission;
    }
    async deleteMission(id) {
        const mission = await mission_repository_js_1.missionRepository.deleteById(id);
        if (!mission) {
            throw new Error("Mission not found.");
        }
        await (0, file_js_1.removeMissionFolder)(mission.folder);
        return mission;
    }
    async getMissionZip(id) {
        const mission = await this.getMissionById(id);
        const { zipPath, fileName } = await (0, zip_js_1.createMissionZip)(mission.folder);
        return { stream: node_fs_1.default.createReadStream(zipPath), fileName };
    }
    getMissionPublicUrl(imagePath) {
        return `${env_js_1.env.APP_BASE_URL}/${imagePath.replace(/\\/g, "/")}`;
    }
    getMissionAbsolutePath(relativePath) {
        return node_path_1.default.join(env_js_1.env.APP_ROOT, relativePath);
    }
}
exports.MissionService = MissionService;
exports.missionService = new MissionService();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missionController = exports.MissionController = void 0;
const api_response_js_1 = require("../../helper/api-response.js");
const mission_service_js_1 = require("./mission.service.js");
const mission_types_js_1 = require("./mission.types.js");
class MissionController {
    async createMission(req, res, next) {
        try {
            const payload = mission_types_js_1.createMissionSchema.parse(req.body);
            const result = await mission_service_js_1.missionService.createMission(payload);
            res.status(201).json((0, api_response_js_1.createResponse)("Mission created successfully.", result));
        }
        catch (error) {
            next(error);
        }
    }
    async getMissions(req, res, next) {
        try {
            const query = mission_types_js_1.missionQuerySchema.parse(req.query);
            const result = await mission_service_js_1.missionService.listMissions(query);
            res.json((0, api_response_js_1.createResponse)("Missions retrieved successfully.", result));
        }
        catch (error) {
            next(error);
        }
    }
    async getMissionById(req, res, next) {
        try {
            const missionId = String(req.params.id);
            const result = await mission_service_js_1.missionService.getMissionById(missionId);
            res.json((0, api_response_js_1.createResponse)("Mission retrieved successfully.", result));
        }
        catch (error) {
            next(error);
        }
    }
    async deleteMission(req, res, next) {
        try {
            const missionId = String(req.params.id);
            const result = await mission_service_js_1.missionService.deleteMission(missionId);
            res.json((0, api_response_js_1.createResponse)("Mission deleted successfully.", result));
        }
        catch (error) {
            next(error);
        }
    }
    async downloadMissionZip(req, res, next) {
        try {
            const missionId = String(req.params.id);
            const result = await mission_service_js_1.missionService.getMissionZip(missionId);
            res.setHeader("Content-Type", "application/zip");
            res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
            result.stream.pipe(res);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MissionController = MissionController;
exports.missionController = new MissionController();

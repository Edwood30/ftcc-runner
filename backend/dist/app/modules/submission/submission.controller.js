"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionController = exports.SubmissionController = void 0;
const api_response_js_1 = require("../../helper/api-response.js");
const submission_service_js_1 = require("./submission.service.js");
const submission_types_js_1 = require("./submission.types.js");
class SubmissionController {
    async listSubmissions(req, res, next) {
        try {
            const query = submission_types_js_1.submissionQuerySchema.parse(req.query);
            const result = await submission_service_js_1.submissionService.listSubmissions(query);
            res.json((0, api_response_js_1.createResponse)("Submissions retrieved successfully.", result));
        }
        catch (error) {
            next(error);
        }
    }
    async getSubmissionById(req, res, next) {
        try {
            const id = String(req.params.submissionId);
            const result = await submission_service_js_1.submissionService.getSubmissionById(id);
            res.json((0, api_response_js_1.createResponse)("Submission retrieved successfully.", result));
        }
        catch (error) {
            next(error);
        }
    }
    async updateSubmission(req, res, next) {
        try {
            const id = String(req.params.submissionId);
            const payload = submission_types_js_1.updateSubmissionSchema.parse(req.body);
            const result = await submission_service_js_1.submissionService.updateSubmission(id, payload);
            res.json((0, api_response_js_1.createResponse)("Submission updated successfully.", result));
        }
        catch (error) {
            next(error);
        }
    }
    async approveSubmission(req, res, next) {
        try {
            const id = String(req.params.submissionId);
            const result = await submission_service_js_1.submissionService.approveSubmission(id);
            res.json((0, api_response_js_1.createResponse)("Submission approved and published as a mission.", result));
        }
        catch (error) {
            next(error);
        }
    }
    async rejectSubmission(req, res, next) {
        try {
            const id = String(req.params.submissionId);
            const payload = submission_types_js_1.rejectSubmissionSchema.parse(req.body ?? {});
            const result = await submission_service_js_1.submissionService.rejectSubmission(id, payload);
            res.json((0, api_response_js_1.createResponse)("Submission rejected.", result));
        }
        catch (error) {
            next(error);
        }
    }
    async linkToPublishedMission(req, res, next) {
        try {
            const id = String(req.params.submissionId);
            const payload = submission_types_js_1.linkPublishedMissionSchema.parse(req.body ?? {});
            const result = await submission_service_js_1.submissionService.linkToPublishedMission(id, payload);
            res.json((0, api_response_js_1.createResponse)("Submission linked to published mission.", result));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SubmissionController = SubmissionController;
exports.submissionController = new SubmissionController();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionRouter = void 0;
const express_1 = require("express");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const submission_controller_js_1 = require("./submission.controller.js");
/** Mounted at `/missions` so paths are `/missions/submissions`, etc. */
exports.submissionRouter = (0, express_1.Router)();
exports.submissionRouter.get("/submissions", auth_middleware_js_1.authMiddleware, (req, res, next) => submission_controller_js_1.submissionController.listSubmissions(req, res, next));
exports.submissionRouter.get("/submissions/:submissionId", auth_middleware_js_1.authMiddleware, (req, res, next) => submission_controller_js_1.submissionController.getSubmissionById(req, res, next));
exports.submissionRouter.patch("/submissions/:submissionId", auth_middleware_js_1.authMiddleware, (req, res, next) => submission_controller_js_1.submissionController.updateSubmission(req, res, next));
exports.submissionRouter.post("/submissions/:submissionId/approve", auth_middleware_js_1.authMiddleware, (req, res, next) => submission_controller_js_1.submissionController.approveSubmission(req, res, next));
exports.submissionRouter.post("/submissions/:submissionId/reject", auth_middleware_js_1.authMiddleware, (req, res, next) => submission_controller_js_1.submissionController.rejectSubmission(req, res, next));
exports.submissionRouter.post("/submissions/:submissionId/link-published-mission", auth_middleware_js_1.authMiddleware, (req, res, next) => submission_controller_js_1.submissionController.linkToPublishedMission(req, res, next));

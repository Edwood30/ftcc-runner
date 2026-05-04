"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkPublishedMissionSchema = exports.rejectSubmissionSchema = exports.updateSubmissionSchema = exports.submissionQuerySchema = exports.submissionStatusSchema = void 0;
const zod_1 = require("zod");
exports.submissionStatusSchema = zod_1.z.enum(["PENDING", "APPROVED", "REJECTED"]);
exports.submissionQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    status: exports.submissionStatusSchema.optional(),
});
exports.updateSubmissionSchema = zod_1.z.object({
    what: zod_1.z.string().min(1).optional(),
    where: zod_1.z.string().min(1).optional(),
    when: zod_1.z.coerce.date().optional(),
    caption: zod_1.z.string().min(1).optional(),
});
exports.rejectSubmissionSchema = zod_1.z.object({
    reviewNote: zod_1.z.string().max(2000).optional(),
});
exports.linkPublishedMissionSchema = zod_1.z.object({
    missionId: zod_1.z.string().min(1),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missionQuerySchema = exports.createMissionSchema = void 0;
const zod_1 = require("zod");
exports.createMissionSchema = zod_1.z.object({
    what: zod_1.z.string().min(1),
    where: zod_1.z.string().min(1),
    when: zod_1.z.coerce.date(),
    caption: zod_1.z.string().min(1),
    images: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
exports.missionQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    where: zod_1.z.string().optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
});

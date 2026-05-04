"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const zod_1 = require("zod");
function isDatabaseConnectivityError(error) {
    const normalized = `${error.name} ${error.message}`.toLowerCase();
    return (normalized.includes("prismaclientinitializationerror") ||
        normalized.includes("error creating a database connection") ||
        normalized.includes("authentication failed") ||
        normalized.includes("dns resolution") ||
        normalized.includes("server selection") ||
        normalized.includes("timed out"));
}
function errorMiddleware(error, _req, res, next) {
    if (res.headersSent) {
        next(error);
        return;
    }
    if (error instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation error.",
            data: error.flatten(),
        });
        return;
    }
    if (error instanceof Error && error.message === "Mission not found.") {
        res.status(404).json({
            success: false,
            message: error.message,
            data: null,
        });
        return;
    }
    if (error instanceof Error && error.message === "Submission not found.") {
        res.status(404).json({
            success: false,
            message: error.message,
            data: null,
        });
        return;
    }
    const submissionConflict = error instanceof Error &&
        (error.message === "Only pending submissions can be edited." ||
            error.message === "Only pending submissions can be approved." ||
            error.message === "Only pending submissions can be rejected." ||
            error.message === "Only pending submissions can be linked to a published mission.");
    if (submissionConflict) {
        res.status(409).json({
            success: false,
            message: error.message,
            data: null,
        });
        return;
    }
    if (error instanceof Error && isDatabaseConnectivityError(error)) {
        res.status(503).json({
            success: false,
            message: "Mission history is temporarily unavailable because the MongoDB connection could not be established.",
            data: null,
        });
        return;
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({
        success: false,
        message,
        data: null,
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
function authMiddleware(req, _res, next) {
    req.headers["x-user-role"] = req.headers["x-user-role"] ?? "admin";
    next();
}

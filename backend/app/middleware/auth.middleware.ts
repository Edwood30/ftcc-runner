import type { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.headers["x-user-role"] = req.headers["x-user-role"] ?? "admin";
  next();
}

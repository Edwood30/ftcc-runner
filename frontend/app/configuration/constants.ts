import type { UploadConstraints } from "../types/mission";

export const FRAME_CONFIG = {
  canvas: { width: 3750, height: 1969 },
  frame: { x: 0, y: 0, width: 3750, height: 1969 },
} as const;

export const UPLOAD_CONSTRAINTS: UploadConstraints = {
  maxFiles: 50,
  maxFileSizeBytes: 15 * 1024 * 1024,
  minDimension: 900,
};

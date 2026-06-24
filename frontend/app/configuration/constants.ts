import type { MissionType, PostPhase, UploadConstraints } from "../types/mission";

export const MISSION_TYPE_OPTIONS: { value: MissionType; label: string }[] = [
  { value: "YAKAP Caravan", label: "YAKAP Caravan" },
  { value: "AFTERCARE PROGRAM", label: "AFTERCARE PROGRAM" },
];

export const POST_PHASE_OPTIONS: { value: PostPhase; label: string }[] = [
  { value: "during", label: "During Caravan Post" },
  { value: "after", label: "After Caravan Post" },
];

export const MISSION_SERVICE_OPTIONS = [
  "Free consultation",
  "Free medicine",
  "Free laboratory & diagnostics",
] as const;

export const DEFAULT_MISSION_SERVICES: string[] = [...MISSION_SERVICE_OPTIONS];

export const FRAME_CONFIG = {
  canvas: { width: 3750, height: 1969 },
  frame: { x: 0, y: 0, width: 3750, height: 1969 },
} as const;

export const UPLOAD_CONSTRAINTS: UploadConstraints = {
  maxFiles: 50,
  maxFileSizeBytes: 15 * 1024 * 1024,
};

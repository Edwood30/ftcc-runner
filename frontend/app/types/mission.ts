export type MissionType = "YAKAP Caravan" | "AFTERCARE PROGRAM";
export type PostPhase = "during" | "after";

export interface BranchOverlay {
  id: string;
  name: string;
  overlaySrc: string;
  builtIn?: boolean;
}

export interface MissionFormState {
  what: MissionType | "";
  where: string;
  when: string;
  postPhase: PostPhase;
  services: string[];
  branchId: string;
  branchName: string;
  branchOverlaySrc: string;
}

export interface ProcessedImage {
  name: string;
  dataURL: string;
}

export interface UploadConstraints {
  maxFiles: number;
  maxFileSizeBytes: number;
}

export interface MissionHistoryItem {
  id: string;
  what: string;
  where: string;
  when: string;
  caption: string;
  folder: string;
  images: string[];
  createdAt: string;
}

export interface MissionHistoryResponse {
  items: MissionHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface MissionHistoryFilters {
  where?: string;
  from?: string;
  to?: string;
}

export interface FacebookPublishResult {
  status: "posted" | "skipped" | "failed";
  message: string;
  postId?: string;
}

export interface SaveMissionResult {
  mission: MissionHistoryItem;
  facebook: FacebookPublishResult;
}


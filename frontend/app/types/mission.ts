export interface MissionFormState {
  what: string;
  where: string;
  when: string;
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

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface InboxSubmissionItem {
  id: string;
  status: SubmissionStatus;
  what: string;
  where: string;
  when: string;
  caption: string;
  folder: string;
  images: string[];
  telegramChatId?: string | null;
  telegramUserId?: string | null;
  telegramUsername?: string | null;
  publishedMissionId?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InboxListResponse {
  items: InboxSubmissionItem[];
  total: number;
  page: number;
  limit: number;
}

import { API_CONFIG } from "../configuration/api";
import type { FacebookPublishResult, InboxListResponse, InboxSubmissionItem, MissionHistoryItem } from "../types/mission";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

async function readApiError(response: Response, fallbackMessage: string): Promise<Error> {
  try {
    const payload = (await response.json()) as Partial<ApiEnvelope<unknown>>;
    if (typeof payload.message === "string" && payload.message.trim()) {
      return new Error(payload.message);
    }
  } catch {
    // ignore
  }
  return new Error(fallbackMessage);
}

export async function fetchSubmissions(
  page = 1,
  limit = 10,
  status?: "PENDING" | "APPROVED" | "REJECTED",
): Promise<InboxListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  const response = await fetch(`${API_CONFIG.baseUrl}/missions/submissions?${params}`, {
    method: "GET",
    headers: API_CONFIG.defaultHeaders,
  });
  if (!response.ok) throw await readApiError(response, "Failed to load inbox.");
  const payload = (await response.json()) as ApiEnvelope<InboxListResponse>;
  return payload.data;
}

export async function fetchSubmissionById(id: string): Promise<InboxSubmissionItem> {
  const response = await fetch(`${API_CONFIG.baseUrl}/missions/submissions/${id}`, {
    method: "GET",
    headers: API_CONFIG.defaultHeaders,
  });
  if (!response.ok) throw await readApiError(response, "Failed to load submission.");
  const payload = (await response.json()) as ApiEnvelope<InboxSubmissionItem>;
  return payload.data;
}

export async function patchSubmission(
  id: string,
  body: { what?: string; where?: string; when?: string; caption?: string },
): Promise<InboxSubmissionItem> {
  const response = await fetch(`${API_CONFIG.baseUrl}/missions/submissions/${id}`, {
    method: "PATCH",
    headers: API_CONFIG.defaultHeaders,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await readApiError(response, "Failed to update submission.");
  const payload = (await response.json()) as ApiEnvelope<InboxSubmissionItem>;
  return payload.data;
}

export interface ApproveSubmissionResult {
  mission: MissionHistoryItem;
  facebook: FacebookPublishResult;
}

export async function approveSubmission(id: string): Promise<ApproveSubmissionResult> {
  const response = await fetch(`${API_CONFIG.baseUrl}/missions/submissions/${id}/approve`, {
    method: "POST",
    headers: API_CONFIG.defaultHeaders,
    body: JSON.stringify({}),
  });
  if (!response.ok) throw await readApiError(response, "Failed to approve submission.");
  const payload = (await response.json()) as ApiEnvelope<ApproveSubmissionResult>;
  return payload.data;
}

export async function rejectSubmission(id: string, reviewNote?: string): Promise<InboxSubmissionItem> {
  const response = await fetch(`${API_CONFIG.baseUrl}/missions/submissions/${id}/reject`, {
    method: "POST",
    headers: API_CONFIG.defaultHeaders,
    body: JSON.stringify({ reviewNote: reviewNote ?? undefined }),
  });
  if (!response.ok) throw await readApiError(response, "Failed to reject submission.");
  const payload = (await response.json()) as ApiEnvelope<InboxSubmissionItem>;
  return payload.data;
}

/** After publishing from the mission editor, mark the inbox row as fulfilled (no duplicate mission). */
export async function linkSubmissionToPublishedMission(submissionId: string, missionId: string): Promise<InboxSubmissionItem> {
  const response = await fetch(`${API_CONFIG.baseUrl}/missions/submissions/${submissionId}/link-published-mission`, {
    method: "POST",
    headers: API_CONFIG.defaultHeaders,
    body: JSON.stringify({ missionId }),
  });
  if (!response.ok) throw await readApiError(response, "Failed to link submission to mission.");
  const payload = (await response.json()) as ApiEnvelope<InboxSubmissionItem>;
  return payload.data;
}

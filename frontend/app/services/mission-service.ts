import { API_CONFIG } from "../configuration/api";
import type { MissionHistoryFilters, MissionHistoryResponse, SaveMissionResult } from "../types/mission";

export async function fetchMissionHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
    method: "GET",
    headers: API_CONFIG.defaultHeaders,
  });

  if (!response.ok) {
    throw new Error("Unable to connect to mission service.");
  }

  return response.json() as Promise<{ status: string }>;
}

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
    // Ignore JSON parsing errors and fall back to the default message.
  }

  return new Error(fallbackMessage);
}

interface CreateMissionPayload {
  what: string;
  where: string;
  when: string;
  caption: string;
  images: string[];
}

export async function createMission(payload: CreateMissionPayload): Promise<SaveMissionResult> {
  const response = await fetch(`${API_CONFIG.baseUrl}/missions`, {
    method: "POST",
    headers: API_CONFIG.defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to save mission history.");
  }

  const result = (await response.json()) as ApiEnvelope<SaveMissionResult>;
  return result.data;
}

export async function fetchMissionHistory(page = 1, limit = 10, filters: MissionHistoryFilters = {}): Promise<MissionHistoryResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters.where) params.set("where", filters.where);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);

  const response = await fetch(`${API_CONFIG.baseUrl}/missions?${params.toString()}`, {
    method: "GET",
    headers: API_CONFIG.defaultHeaders,
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to fetch mission history.");
  }

  const payload = (await response.json()) as ApiEnvelope<MissionHistoryResponse>;
  return payload.data;
}

export async function deleteMissionHistory(id: string): Promise<void> {
  const response = await fetch(`${API_CONFIG.baseUrl}/missions/${id}`, {
    method: "DELETE",
    headers: API_CONFIG.defaultHeaders,
  });

  if (!response.ok) {
    throw await readApiError(response, "Failed to delete mission history.");
  }
}

export function getMissionDownloadUrl(id: string): string {
  return `${API_CONFIG.baseUrl}/missions/${id}/download`;
}

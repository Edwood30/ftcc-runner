import type { BranchOverlay } from "../types/mission";
import { API_CONFIG } from "../configuration/api";

export const DEFAULT_BRANCHES: BranchOverlay[] = [
  {
    id: "main",
    name: "FTCC Overlay (Main Branch)",
    overlaySrc: "/FTCC Overlay.png",
    builtIn: true,
  },
  {
    id: "ligao",
    name: "Ligao Overlay (Ligao Branch)",
    overlaySrc: "/Ligao Overlay.png",
    builtIn: true,
  },
];

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function loadBranches(): Promise<BranchOverlay[]> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/branches`, {
      method: "GET",
      headers: API_CONFIG.defaultHeaders,
    });

    if (!response.ok) {
      throw new Error("Unable to load branches from API.");
    }

    const payload = (await response.json()) as ApiEnvelope<BranchOverlay[]>;
    return payload.data;
  } catch (error) {
    // Fallback to default branches if API is unavailable
    console.warn("Failed to load branches from API, using default branches:", error);
    return DEFAULT_BRANCHES;
  }
}

export async function saveCustomBranch(branch: BranchOverlay): Promise<BranchOverlay[]> {
  const response = await fetch(`${API_CONFIG.baseUrl}/branches`, {
    method: "POST",
    headers: API_CONFIG.defaultHeaders,
    body: JSON.stringify(branch),
  });

  if (!response.ok) {
    throw new Error("Unable to save branch.");
  }

  const payload = (await response.json()) as ApiEnvelope<BranchOverlay[]>;
  return payload.data;
}

export async function deleteCustomBranch(branchId: string): Promise<BranchOverlay[]> {
  const response = await fetch(`${API_CONFIG.baseUrl}/branches/${encodeURIComponent(branchId)}`, {
    method: "DELETE",
    headers: API_CONFIG.defaultHeaders,
  });

  if (!response.ok) {
    throw new Error("Unable to delete branch.");
  }

  const payload = (await response.json()) as ApiEnvelope<BranchOverlay[]>;
  return payload.data;
}

export function buildBranchId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "branch"}-${Date.now()}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the overlay image."));
    reader.readAsDataURL(file);
  });
}

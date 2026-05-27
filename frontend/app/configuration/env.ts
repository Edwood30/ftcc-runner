const DEFAULT_PRODUCTION_API_BASE_URL = "https://ftcc-runner.onrender.com";
const DEFAULT_DEVELOPMENT_API_BASE_URL = "http://localhost:5000";

function normalizeApiBaseUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

const configuredApiBaseUrl =
  normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL) ??
  normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const API_BASE_URL =
  configuredApiBaseUrl ??
  (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_BASE_URL : DEFAULT_DEVELOPMENT_API_BASE_URL);

export const env = {
  API_BASE_URL,
} as const;

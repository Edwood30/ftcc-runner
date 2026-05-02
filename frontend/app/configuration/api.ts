import { env } from "./env";

export const API_CONFIG = {
  baseUrl: env.API_BASE_URL,
  defaultHeaders: {
    "Content-Type": "application/json",
  },
} as const;

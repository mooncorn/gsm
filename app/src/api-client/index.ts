export * from "./config";
export * from "./types";
export * from "./docker";
export * from "./files";
export * from "./auth";

// Re-export all API clients as a single object
import { dockerApi } from "./docker";
import { filesApi } from "./files";
import { authApi } from "./auth";

export const api = {
  docker: dockerApi,
  files: filesApi,
  auth: authApi,
} as const;

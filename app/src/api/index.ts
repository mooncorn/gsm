import { dockerApi as docker } from "./docker";
import { filesApi as files } from "./files";
import { authApi as auth } from "./auth";
import { systemApi as system } from "./system";

export * from "./types";

export const api = {
  docker,
  files,
  auth,
  system,
} as const;

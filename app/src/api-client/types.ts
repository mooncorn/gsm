import { User } from "../types/user";
import { FileInfo, FileContentResponse } from "../types/files";

// Auth & User Types
export interface AuthResponse {
  user: User;
}

export interface AllowedUser extends User {
  Id: number;
  CreatedAt: string;
  UpdatedAt: string;
}

// Docker Types
export interface CreateContainerRequest {
  name: string;
  image: string;
  ports?: Port[];
  volumes?: string[];
  env?: string[];
  memory?: number;
  cpu?: number;
  restart?: string;
}

export interface Port {
  hostPort: number;
  containerPort: number;
  protocol: string;
}

export interface DockerEventResponse {
  event_type: string;
  action: string;
  actor: {
    id: string;
    attributes: Record<string, string>;
  };
}

// File Types
export interface UploadFileResponse {
  message: string;
  path: string;
}

export interface FileListResponse {
  files: FileInfo[];
}

export interface ContainerListItem {
  id: string;
  names: string[];
  image: string;
  state: string;
  status: string;
}

export interface ContainerDetails {
  id: string;
  created: Date;
  state: {
    status: string;
    running: boolean;
    startedAt: Date;
    finishedAt: Date;
  };
  name: string;
  mounts: Mount[];
  config: {
    tty: boolean;
    env: string[];
    image: string;
  };
  hostConfig: {
    portBindings: Record<string, Port[]>;
    restartPolicy: {
      name: string;
    };
    binds: string[];
  };
}

export interface Mount {
  type: string;
  source: string;
  target: string;
  readOnly: boolean;
}

export interface DockerImage {
  Id: string;
  ParentId: string;
  RepoTags: string[];
  RepoDigests: string[];
  Created: number;
  Size: number;
  VirtualSize: number;
  SharedSize: number;
  Labels: { [key: string]: string };
  Containers: number;
}

export interface PullProgress {
  status: string;
  progressDetail?: {
    current: number;
    total: number;
  };
  progress?: string;
  id?: string;
}

// Re-export types from other modules for centralized access
export type { User, FileInfo, FileContentResponse };

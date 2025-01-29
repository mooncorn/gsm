export interface User {
  email: string;
  role: string;
  picture?: string;
}

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
  ports: Array<{
    hostPort: number;
    containerPort: number;
    protocol: string;
  }>;
  env: string[];
  memory: number;
  cpu: number;
  restart: string;
  volumes: string[];
  tty: boolean;
  attachStdin: boolean;
  attachStdout: boolean;
  attachStderr: boolean;
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
    attachStdin: boolean;
    attachStdout: boolean;
    attachStderr: boolean;
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

export interface Image {
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

export interface ContainerConfig {
  image: string;
  env: string[];
  tty: boolean;
  attachStdin: boolean;
  attachStdout: boolean;
  attachStderr: boolean;
  exposedPorts: { [key: string]: object };
  volumes: { [key: string]: object };
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  modTime: string;
  permissions: string;
  isReadable: boolean;
  isWritable: boolean;
  isExecutable: boolean;
}

export interface FileOperationResponse {
  message: string;
}

export interface FileContentResponse {
  content: string;
}

export interface MoveFileRequest {
  source: string;
  destination: string;
}

export interface CreateDirectoryRequest {
  path: string;
}

export interface WriteFileRequest {
  path: string;
  content: string;
}

export interface ContainerExecResponse {
  output: string;
}

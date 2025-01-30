export interface UserResponseData {
  email: string;
  role: string;
  picture?: string;
}

export interface AuthResponseData {
  user: UserResponseData;
}

export interface AllowedUserResponseData extends UserResponseData {
  Id: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateContainerRequestData {
  name: string;
  image: string;
  ports: ContainerPortResponseData[];
  env: string[];
  volumes: string[];
  memory: number;
  cpu: number;
  restart: string;
  tty: boolean;
  attachStdin: boolean;
  attachStdout: boolean;
  attachStderr: boolean;
}

export interface CreateContainerResponseData {
  id: string;
  warnings: string[];
}

export interface ContainerPortResponseData {
  hostPort: number;
  containerPort: number;
  protocol: string;
}

export interface DockerEventResponseData {
  event_type: string;
  action: string;
  actor: {
    id: string;
    attributes: Record<string, string>;
  };
}

// File Types
export interface UploadFileResponseData {
  message: string;
  path: string;
}

export interface FileListResponseData {
  files: FileInfoResponseData[];
}

export interface ContainerListItemResponseData {
  id: string;
  names: string[];
  image: string;
  state: string;
  status: string;
}

export interface ContainerStateResponseData {
  status: string;
  running: boolean;
  startedAt: string;
  finishedAt: string;
}

export interface ContainerConfigResponseData {
  tty: boolean;
  attachStdin: boolean;
  attachStdout: boolean;
  attachStderr: boolean;
  env: string[];
  image: string;
}

export interface ContainerDetailsResponseData {
  id: string;
  created: string;
  state: ContainerStateResponseData;
  name: string;
  mounts: ContainerMountResponseData[];
  config: ContainerConfigResponseData;
  hostConfig: {
    portBindings: Record<string, ContainerPortResponseData[]>;
    restartPolicy: { name: string };
    binds: string[];
    memory: number;
    cpu: number;
  };
}

export interface ContainerMountResponseData {
  type: string;
  source: string;
  target: string;
  readOnly: boolean;
}

export interface ContainerImageResponseData {
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

export interface PullProgressResponseData {
  status: string;
  progressDetail?: {
    current: number;
    total: number;
  };
  progress?: string;
  id?: string;
}

export interface FileInfoResponseData {
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

export interface FileOperationResponseData {
  message: string;
}

export interface FileContentResponseData {
  content: string;
}

export interface MoveFileRequestData {
  source: string;
  destination: string;
}

export interface CreateDirectoryRequestData {
  path: string;
}

export interface WriteFileRequestData {
  path: string;
  content: string;
}

export interface ContainerExecResponseData {
  output: string;
}

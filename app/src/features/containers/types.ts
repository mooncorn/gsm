export interface DockerImage {
  ID: string;
  RepoTags: string[];
}

export interface ContainerFormData {
  containerName: string;
  image: string;
  ports: Array<{
    containerPort: string;
    hostPort: string;
    protocol: string;
  }>;
  environment: Array<{
    key: string;
    value: string;
  }>;
  volumes: Array<{
    path: string;
  }>;
  memory: string;
  cpu: string;
  restart: string;
  tty: boolean;
  attachStdin: boolean;
  attachStdout: boolean;
  attachStderr: boolean;
}

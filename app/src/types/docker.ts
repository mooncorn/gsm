export interface ContainerTemplate {
  containerName: string;
  image: string;
  volumes: string[];
  ports: Port[];
  environment: { key: string; value: string }[];
  memory: string;
  cpu: string;
  restart: string;
  tty: boolean;
  attachStdin: boolean;
  attachStdout: boolean;
  attachStderr: boolean;
}

export interface Port {
  hostPort: string;
  containerPort: string;
  protocol: string;
}

export type TemplateStore = {
  [name: string]: ContainerTemplate;
};

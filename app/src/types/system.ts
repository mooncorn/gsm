export interface SystemResources {
  memory: {
    total: number;
    used: number;
    free: number;
    available: number;
    used_percent: number;
  };
  cpu: {
    cores: number;
    used: number;
    model_name: string;
    frequencies: number[];
    temperature: number;
    architecture: string;
  };
  docker: {
    running_containers: number;
    total_containers: number;
    total_images: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    used_percent: number;
  };
  system: {
    os: string;
    platform: string;
    kernel_version: string;
    uptime: number;
    last_update: string;
  };
}

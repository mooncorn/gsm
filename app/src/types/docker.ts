export interface Mount {
  Type: string;
  Source: string;
  Destination: string;
}

export interface Port {
  IP?: string;
  PrivatePort?: number;
  PublicPort?: number;
  Type?: string;
  HostPort?: string;
  HostIp?: string;
}

export interface ContainerListItem {
  Id: string;
  Names: string[];
  Image: string;
  Labels: string[];
  State: string;
  Status: string;
  Mounts: Mount[];
  Ports: Port[];
}

export interface ContainerDetails {
  Id: string;
  Created: Date;
  State: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    OOMKilled: boolean;
    Dead: boolean;
    Pid: number;
    ExitCode: number;
    StartedAt: Date;
    FinishedAt: Date;
    Health?: {
      Status: string;
      FailingStreak: number;
      Log: Array<{
        Start: Date;
        End: Date;
        ExitCode: number;
        Output: string;
      }>;
    };
  };
  Name: string;
  RestartCount: number;
  Mounts: Mount[];
  Config: {
    Tty: boolean;
    Env: string[];
    Image: string;
    Labels: Record<string, string>;
  };
  HostConfig: {
    PortBindings: Record<string, Port[]>;
  };
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
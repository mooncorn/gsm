import { apiClient } from "./config";
import {
  ContainerListItem,
  ContainerDetails,
  DockerImage,
  CreateContainerRequest,
} from "./types";

export interface ContainerExecResponse {
  output: string;
}

export const dockerApi = {
  // Container operations
  listContainers: async () => {
    const response = await apiClient.get<ContainerListItem[]>(
      "/docker/containers"
    );
    return response.data;
  },

  getContainer: async (id: string) => {
    const response = await apiClient.get<ContainerDetails>(
      `/docker/containers/${id}`
    );
    return response.data;
  },

  createContainer: async (data: CreateContainerRequest) => {
    const response = await apiClient.post("/docker/containers", data);
    return response.data;
  },

  startContainer: async (id: string) => {
    await apiClient.post(`/docker/containers/${id}/start`);
  },

  stopContainer: async (id: string) => {
    await apiClient.post(`/docker/containers/${id}/stop`);
  },

  restartContainer: async (id: string) => {
    await apiClient.post(`/docker/containers/${id}/restart`);
  },

  removeContainer: async (id: string) => {
    await apiClient.delete(`/docker/containers/${id}`);
  },

  executeCommand: async (id: string, command: string) => {
    const response = await apiClient.post<ContainerExecResponse>(
      `/docker/containers/${id}/exec`,
      {
        command,
      }
    );
    return response.data;
  },

  // Container logs
  getLogs: async (id: string) => {
    const response = await apiClient.get<string>(
      `/docker/containers/${id}/logs`
    );
    return response.data;
  },

  // Image operations
  listImages: async () => {
    const response = await apiClient.get<DockerImage[]>("/docker/images");
    return response.data;
  },

  pullImage: (imageName: string) => {
    return new EventSource(
      `${apiClient.defaults.baseURL}/docker/pull?imageName=${encodeURIComponent(
        imageName
      )}`,
      {
        withCredentials: true,
      }
    );
  },

  removeImage: async (id: string) => {
    await apiClient.delete(`/docker/images/${id}`);
  },

  streamDockerEvents: () => {
    return new EventSource(`${apiClient.defaults.baseURL}/docker/events`, {
      withCredentials: true,
    });
  },

  streamContainerLogs: (id: string) => {
    return new EventSource(
      `${apiClient.defaults.baseURL}/docker/containers/${id}/logs/stream`,
      {
        withCredentials: true,
      }
    );
  },
};

// Export apiClient for EventSource URLs
export { apiClient };

import { apiClient, createEventSource } from "./config";
import {
  ContainerListItemResponseData,
  ContainerDetailsResponseData,
  ContainerImageResponseData,
  CreateContainerRequestData,
  ContainerExecResponseData,
  CreateContainerResponseData,
} from "./types";

export const dockerApi = {
  // Container operations
  listContainers: async (): Promise<ContainerListItemResponseData[]> => {
    const response = await apiClient.get<ContainerListItemResponseData[]>(
      "/docker/containers"
    );
    return response.data;
  },

  getContainer: async (id: string): Promise<ContainerDetailsResponseData> => {
    const response = await apiClient.get<ContainerDetailsResponseData>(
      `/docker/containers/${id}`
    );
    return response.data;
  },

  createContainer: async (
    data: CreateContainerRequestData
  ): Promise<CreateContainerResponseData> => {
    const response = await apiClient.post<CreateContainerResponseData>(
      `/docker/containers`,
      data
    );
    return response.data;
  },

  updateContainer: async (
    id: string,
    data: CreateContainerRequestData
  ): Promise<CreateContainerResponseData> => {
    const response = await apiClient.put<CreateContainerResponseData>(
      `/docker/containers/${id}`,
      data
    );
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
    const response = await apiClient.post<ContainerExecResponseData>(
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
    const response = await apiClient.get<ContainerImageResponseData[]>(
      "/docker/images"
    );
    return response.data;
  },

  pullImage: (imageName: string) => {
    return createEventSource(
      `/docker/images/pull?imageName=${encodeURIComponent(imageName)}`
    );
  },

  removeImage: async (id: string) => {
    await apiClient.delete(`/docker/images/${id}`);
  },

  streamDockerEvents: () => {
    return createEventSource("/docker/events");
  },

  streamContainerLogs: (id: string) => {
    return createEventSource(`/docker/containers/${id}/logs/stream`);
  },
};

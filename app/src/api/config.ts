import axios, { AxiosInstance, AxiosError } from "axios";
import { apiUrl } from "../config/constants";

interface ApiErrorResponse {
  error?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      if (error.response) {
        throw new ApiError(
          error.response.data?.error || "An error occurred",
          error.response.status,
          error.response.data
        );
      }
      throw new ApiError(error.message);
    }
  );

  return client;
};

export const apiClient = createApiClient();

export function createEventSource<T extends { data: any; type: string }>(
  url: string
): EventSource & {
  onmessage: (event: T) => void;
  onerror: (event: Event) => void;
} {
  const eventSourceInit: EventSourceInit = {
    withCredentials: true,
  };

  return new EventSource(`${apiUrl}${url}`, eventSourceInit) as EventSource & {
    onmessage: (event: T) => void;
    onerror: (event: Event) => void;
  };
}

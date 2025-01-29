import { apiClient } from "./config";
import { FileInfo, FileContentResponse, UploadFileResponse } from "./types";

export const filesApi = {
  list: async (path?: string) => {
    const response = await apiClient.get<FileInfo[]>("/files", {
      params: { path },
    });
    return response.data;
  },

  getContent: async (path: string) => {
    const response = await apiClient.get<FileContentResponse>(
      "/files/content",
      {
        params: { path },
      }
    );
    return response.data;
  },

  write: async (path: string, content: string) => {
    await apiClient.post("/files/content", { path, content });
  },

  delete: async (path: string) => {
    await apiClient.delete("/files", {
      params: { path },
    });
  },

  createDirectory: async (path: string) => {
    await apiClient.post("/files/directory", { path });
  },

  upload: async (path: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    const response = await apiClient.post<UploadFileResponse>(
      "/files/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  uploadDirectory: async (path: string, files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    formData.append("path", path);

    const response = await apiClient.post<UploadFileResponse>(
      "/files/upload/directory",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  download: (path: string) => {
    window.open(
      `${apiClient.defaults.baseURL}/files/download?path=${encodeURIComponent(
        path
      )}`
    );
  },
};

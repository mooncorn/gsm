import { useState, useEffect, useCallback, useRef } from "react";
import { FileInfoResponseData } from "../../../api";
import { api } from "../../../api";
import { useToast } from "../../../hooks/useToast";

export function useFiles() {
  const toast = useToast();
  const toastRef = useRef(toast);
  const [files, setFiles] = useState<FileInfoResponseData[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update toast ref when it changes
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.files.list(currentPath);
      setFiles(data || []);
    } catch (err: any) {
      setFiles([]);
      toastRef.current.error(err.message || "Failed to fetch files");
    } finally {
      setIsLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const navigateToPath = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const navigateToParent = useCallback(() => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    setCurrentPath(parentPath);
  }, [currentPath]);

  const createDirectory = useCallback(
    async (name: string) => {
      try {
        await api.files.createDirectory(
          `${currentPath}/${name}`.replace(/^\/+/, "")
        );
        await fetchFiles();
        toastRef.current.success("Folder created successfully");
        return true;
      } catch (err: any) {
        toastRef.current.error(err.message || "Failed to create folder");
        return false;
      }
    },
    [currentPath, fetchFiles]
  );

  const deleteFile = useCallback(
    async (file: FileInfoResponseData) => {
      try {
        await api.files.delete(file.path);
        await fetchFiles();
        toastRef.current.success("Deleted successfully");
        return true;
      } catch (err: any) {
        toastRef.current.error(err.message || "Failed to delete");
        return false;
      }
    },
    [fetchFiles]
  );

  const uploadFiles = useCallback(
    async (files: FileList) => {
      try {
        const path = currentPath === "" ? "/" : currentPath;
        const fileArray = Array.from(files);
        for (const file of fileArray) {
          await api.files.upload(path, file);
        }
        await fetchFiles();
        toastRef.current.success(
          fileArray.length > 1
            ? "Files uploaded successfully"
            : "File uploaded successfully"
        );
        return true;
      } catch (err: any) {
        toastRef.current.error(err.message || "Failed to upload file(s)");
        return false;
      }
    },
    [currentPath, fetchFiles]
  );

  const readFile = useCallback(async (file: FileInfoResponseData) => {
    try {
      const data = await api.files.getContent(file.path);
      return data.content;
    } catch (err: any) {
      if (err.response?.data?.mime) {
        toastRef.current.error(
          `Cannot edit binary file (${err.response.data.mime})`
        );
      } else {
        toastRef.current.error(err.message || "Failed to read file");
      }
      return null;
    }
  }, []);

  const writeFile = useCallback(
    async (path: string, content: string) => {
      try {
        await api.files.write(path, content);
        await fetchFiles();
        toastRef.current.success("File saved successfully");
        return true;
      } catch (err: any) {
        toastRef.current.error(err.message || "Failed to save file");
        return false;
      }
    },
    [fetchFiles]
  );

  return {
    files,
    currentPath,
    isLoading,
    createDirectory,
    deleteFile,
    uploadFiles,
    readFile,
    writeFile,
    navigateToParent,
    navigateToPath,
  };
}

import { useState } from "react";
import { api, ContainerListItem } from "../../../api";
import { useToast } from "../../../hooks/useToast";

export function useContainerList() {
  const toast = useToast();
  const [containers, setContainers] = useState<ContainerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchContainers = async () => {
    try {
      setIsLoading(true);
      const data = await api.docker.listContainers();
      setContainers(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch containers");
    } finally {
      setIsLoading(false);
    }
  };

  const getContainerName = (container: ContainerListItem) => {
    return container.names[0].replace("/", "");
  };

  const capitalizeFirstLetter = (val: string) => {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  };

  const cleanStatus = (status: string) => {
    // For running containers: "Up 2 hours (healthy)" -> "Up 2 hours"
    // For stopped containers: "Exited (0) 3 hours ago" -> "Stopped 3 hours ago"
    if (status.startsWith("Up")) {
      return status.replace(/\s*\([^)]*\)/, "");
    } else if (status.startsWith("Exited")) {
      return status.replace(/Exited\s*\([^)]*\)/, "Stopped");
    }
    return status;
  };

  return {
    containers,
    isLoading,
    fetchContainers,
    getContainerName,
    capitalizeFirstLetter,
    cleanStatus,
  };
}

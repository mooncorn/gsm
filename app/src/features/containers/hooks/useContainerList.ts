import { useState } from "react";
import { api, ContainerListItemResponseData } from "../../../api";
import { useToast } from "../../../hooks/useToast";

export function useContainerList() {
  const toast = useToast();
  const [containers, setContainers] = useState<ContainerListItemResponseData[]>(
    []
  );
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

  return {
    containers,
    isLoading,
    fetchContainers,
  };
}

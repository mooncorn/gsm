import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ContainerDetailsResponseData } from "../../../api";
import { useToast } from "../../../hooks/useToast";

export function useContainerOperations(id: string | undefined) {
  const navigate = useNavigate();
  const toast = useToast();
  const [container, setContainer] =
    useState<ContainerDetailsResponseData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchContainerDetails = async () => {
    try {
      if (!id) return;
      setIsFetching(true);
      const data = await api.docker.getContainer(id);
      setContainer(data);
    } catch (err) {
      console.error("Failed to fetch container details", err);
      toast.error(`Failed to get details for ${id}`);
    } finally {
      setIsFetching(false);
    }
  };

  const start = async () => {
    try {
      if (!id) return;
      setIsStarting(true);
      await api.docker.startContainer(id);
    } catch (err) {
      console.error("Start failed", err);
      toast.error(`Failed to start ${id}`);
    } finally {
      setIsStarting(false);
    }
  };

  const stop = async () => {
    try {
      if (!id) return;
      setIsStopping(true);
      await api.docker.stopContainer(id);
    } catch (err) {
      console.error(`Failed to stop ${id}`, err);
      toast.error(`Failed to stop ${id}`);
    } finally {
      setIsStopping(false);
    }
  };

  const deleteContainer = async () => {
    try {
      if (!id) return;
      setIsDeleting(true);
      await api.docker.removeContainer(id);
      toast.success("Container deleted successfully");
      navigate("/containers");
    } catch (err) {
      console.error("Failed to delete container", err);
      toast.error(`Failed to delete ${id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    container,
    isFetching,
    isStarting,
    isStopping,
    isDeleting,
    fetchContainerDetails,
    start,
    stop,
    deleteContainer,
  };
}

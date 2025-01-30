import { useNavigate } from "react-router-dom";
import { useToast } from "../../../hooks/useToast";
import { ContainerTemplate, ContainerPort } from "../../../types/docker";
import { api, CreateContainerRequestData } from "../../../api";
import { useState } from "react";

export function useContainerFormSubmission() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const submitForm = async (formData: ContainerTemplate) => {
    try {
      setIsLoading(true);
      const requestData: CreateContainerRequestData = {
        ...formData,
        name: formData.containerName,
        ports: formData.ports.map((port: ContainerPort) => ({
          hostPort: parseInt(port.hostPort),
          containerPort: parseInt(port.containerPort),
          protocol: port.protocol,
        })),
        env: formData.environment
          .filter((env: { key: string; value: string }) => env.key && env.value)
          .map(
            (env: { key: string; value: string }) => `${env.key}=${env.value}`
          ),
        volumes: formData.volumes,
        memory: formData.memory ? parseInt(formData.memory) : 0,
        cpu: formData.cpu ? parseFloat(formData.cpu) : 0,
      };

      await api.docker.createContainer(requestData);
      toast.success("Container created successfully");
      navigate("/containers");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to create container");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitForm, isLoading };
}

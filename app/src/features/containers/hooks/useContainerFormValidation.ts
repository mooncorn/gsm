import { ContainerTemplate } from "../../../types/docker";
import { useToast } from "../../../hooks/useToast";

export function useContainerFormValidation() {
  const toast = useToast();

  const validateForm = (formData: ContainerTemplate) => {
    // Validate volume paths
    const invalidVolumes = formData.volumes.filter((vol: string) => {
      if (!vol) return false;
      return vol.includes("..");
    });

    if (invalidVolumes.length > 0) {
      toast.error("Invalid volume path. Directory traversal is not allowed.");
      return false;
    }

    // Validate memory and CPU
    const memoryMB = parseFloat(formData.memory);
    const cpuCores = parseFloat(formData.cpu);

    if (formData.memory && (isNaN(memoryMB) || memoryMB < 0)) {
      toast.error("Memory must be a positive number");
      return false;
    }

    if (formData.cpu && (isNaN(cpuCores) || cpuCores < 0)) {
      toast.error("CPU must be a positive number");
      return false;
    }

    return true;
  };

  return { validateForm };
}

import { useState, useEffect } from "react";
import { toast, Bounce } from "react-toastify";

export interface ContainerTemplate {
  name: string;
  image: string;
  containerName: string;
  volumes: string[];
  ports: { container: string; host: string; protocol: string }[];
  environment: { key: string; value: string }[];
  memory: string;
  cpu: string;
  restart: string;
}

export interface ContainerFormData {
  containerName: string;
  image: string;
  ports: { container: string; host: string; protocol: string }[];
  environment: { key: string; value: string }[];
  volumes: { path: string }[];
  memory: string;
  cpu: string;
  restart: string;
}

export function useContainerTemplates() {
  const [templates, setTemplates] = useState<ContainerTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  useEffect(() => {
    // Load templates from localStorage on hook mount
    const savedTemplates = localStorage.getItem("containerTemplates");
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const saveTemplate = (templateName: string, formData: ContainerFormData) => {
    const newTemplate: ContainerTemplate = {
      name: templateName,
      image: formData.image,
      containerName: formData.containerName,
      volumes: formData.volumes.map((vol) => vol.path),
      ports: formData.ports.map((port) => ({
        container: port.container,
        host: port.host,
        protocol: port.protocol,
      })),
      environment: formData.environment,
      memory: formData.memory,
      cpu: formData.cpu,
      restart: formData.restart,
    };

    const updatedTemplates = templates.filter((t) => t.name !== templateName);
    updatedTemplates.push(newTemplate);

    setTemplates(updatedTemplates);
    localStorage.setItem(
      "containerTemplates",
      JSON.stringify(updatedTemplates)
    );

    toast.success("Template saved successfully", {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });

    return updatedTemplates;
  };

  const updateTemplate = (formData: ContainerFormData) => {
    if (!selectedTemplate) {
      toast.error("No template selected", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    const updatedTemplate: ContainerTemplate = {
      name: selectedTemplate,
      image: formData.image,
      containerName: formData.containerName,
      volumes: formData.volumes.map((vol) => vol.path),
      ports: formData.ports.map((port) => ({
        container: port.container,
        host: port.host,
        protocol: port.protocol,
      })),
      environment: formData.environment,
      memory: formData.memory,
      cpu: formData.cpu,
      restart: formData.restart,
    };

    const updatedTemplates = templates.map((t) =>
      t.name === selectedTemplate ? updatedTemplate : t
    );

    setTemplates(updatedTemplates);
    localStorage.setItem(
      "containerTemplates",
      JSON.stringify(updatedTemplates)
    );

    toast.success("Template updated successfully", {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });
  };

  const deleteTemplate = () => {
    if (!selectedTemplate) {
      toast.error("No template selected", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    const updatedTemplates = templates.filter(
      (t) => t.name !== selectedTemplate
    );
    setTemplates(updatedTemplates);
    localStorage.setItem(
      "containerTemplates",
      JSON.stringify(updatedTemplates)
    );
    setSelectedTemplate("");

    toast.success("Template deleted successfully", {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });
  };

  const loadTemplate = (templateName: string): ContainerFormData | null => {
    const template = templates.find((t) => t.name === templateName);
    if (!template) return null;

    const formData: ContainerFormData = {
      image: template.image,
      containerName: template.containerName,
      volumes: template.volumes.map((path) => ({ path })),
      ports: template.ports.map((port) => ({
        container: port.container,
        host: port.host,
        protocol: port.protocol,
      })),
      environment: template.environment,
      memory: template.memory,
      cpu: template.cpu,
      restart: template.restart,
    };

    toast.success("Template loaded successfully", {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });

    return formData;
  };

  return {
    templates,
    selectedTemplate,
    setSelectedTemplate,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    loadTemplate,
  };
}

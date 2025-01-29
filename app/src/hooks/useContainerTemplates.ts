import { useState, useEffect } from "react";
import { ContainerTemplate, TemplateStore } from "../types/docker";
import { useToast } from "./useToast";

export function useContainerTemplates() {
  const [templates, setTemplates] = useState<TemplateStore>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const toast = useToast();

  useEffect(() => {
    // Load templates from localStorage on hook mount
    const savedTemplates = localStorage.getItem("containerTemplates");
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const saveTemplate = (templateName: string, formData: ContainerTemplate) => {
    const updatedTemplates = {
      ...templates,
      [templateName]: formData,
    };

    setTemplates(updatedTemplates);
    localStorage.setItem(
      "containerTemplates",
      JSON.stringify(updatedTemplates)
    );
    toast.success("Template saved successfully");
    return updatedTemplates;
  };

  const updateTemplate = (formData: ContainerTemplate) => {
    if (!selectedTemplate) {
      toast.error("No template selected");
      return;
    }

    const updatedTemplates = {
      ...templates,
      [selectedTemplate]: formData,
    };

    setTemplates(updatedTemplates);
    localStorage.setItem(
      "containerTemplates",
      JSON.stringify(updatedTemplates)
    );
    toast.success("Template updated successfully");
  };

  const deleteTemplate = () => {
    if (!selectedTemplate) {
      toast.error("No template selected");
      return;
    }

    const { [selectedTemplate]: _, ...updatedTemplates } = templates;
    setTemplates(updatedTemplates);
    localStorage.setItem(
      "containerTemplates",
      JSON.stringify(updatedTemplates)
    );
    setSelectedTemplate("");
    toast.success("Template deleted successfully");
  };

  const loadTemplate = (templateName: string): ContainerTemplate | null => {
    return templates[templateName] || null;
  };

  const getTemplateNames = (): string[] => {
    return Object.keys(templates);
  };

  return {
    templates,
    selectedTemplate,
    setSelectedTemplate,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    loadTemplate,
    getTemplateNames,
  };
}

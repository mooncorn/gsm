import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContainerTemplate } from "../../types/docker";
import { useContainerTemplates } from "../../hooks/useContainerTemplates";
import { useImageSearch } from "./hooks/useImageSearch";
import { useContainerFormValidation } from "./hooks/useContainerFormValidation";
import { useContainerFormSubmission } from "./hooks/useContainerFormSubmission";
import { useSystemResources } from "../../hooks/useSystemResources";

// UI Components
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import TemplateControls from "../../components/ui/TemplateControls";
import SaveTemplateModal from "./components/SaveTemplateModal";
import { ContainerForm } from "./components/ContainerForm";
import { ResourceLimitsSection } from "./components/ResourceLimitsSection";

const INITIAL_FORM_STATE: ContainerTemplate = {
  containerName: "",
  image: "",
  ports: [{ containerPort: "", hostPort: "", protocol: "tcp" }],
  environment: [{ key: "", value: "" }],
  volumes: [""],
  memory: "",
  cpu: "",
  restart: "no",
  tty: false,
  attachStdin: false,
  attachStdout: false,
  attachStderr: false,
};

export default function CreateContainer() {
  const navigate = useNavigate();
  const { validateForm } = useContainerFormValidation();
  const { submitForm, isLoading: isCreating } = useContainerFormSubmission();
  const { resources } = useSystemResources();
  const {
    selectedTemplate,
    setSelectedTemplate,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    loadTemplate,
    getTemplateNames,
  } = useContainerTemplates();

  const {
    filteredImages,
    showImageDropdown,
    setShowImageDropdown,
    handleImageSearch,
    isLoading: isLoadingImages,
  } = useImageSearch();

  const [formData, setFormData] =
    useState<ContainerTemplate>(INITIAL_FORM_STATE);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const handleTemplateSelect = (value: string) => {
    setSelectedTemplate(value);
    if (!value) {
      setFormData(INITIAL_FORM_STATE);
      return;
    }
    const loadedData = loadTemplate(value);
    if (loadedData) {
      setFormData(loadedData);
    }
  };

  const handleSaveTemplate = () => {
    saveTemplate(templateName, formData);
    setShowSaveTemplateModal(false);
    setTemplateName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(formData)) {
      return;
    }

    await submitForm(formData);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <PageHeader
        title="Create Container"
        showBackButton
        backTo="/containers"
      />

      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TemplateControls
            templates={getTemplateNames()}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            onSaveNew={() => setShowSaveTemplateModal(true)}
            onUpdate={() => updateTemplate(formData)}
            onDelete={deleteTemplate}
          />

          <ContainerForm
            formData={formData}
            onFormDataChange={setFormData}
            imageSearch={{
              value: formData.image,
              filteredImages,
              showDropdown: showImageDropdown,
              setShowDropdown: setShowImageDropdown,
              handleSearch: handleImageSearch,
              isLoading: isLoadingImages,
            }}
          />

          <ResourceLimitsSection
            systemResources={resources}
            memory={formData.memory}
            cpu={formData.cpu}
            onMemoryChange={(value) =>
              setFormData((prev) => ({ ...prev, memory: value }))
            }
            onCpuChange={(value) =>
              setFormData((prev) => ({ ...prev, cpu: value }))
            }
          />

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              onClick={() => navigate("/containers")}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600"
              isLoading={isCreating}
            >
              Create
            </Button>
          </div>
        </form>
      </div>

      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        templateName={templateName}
        onClose={() => {
          setShowSaveTemplateModal(false);
          setTemplateName("");
        }}
        onSave={handleSaveTemplate}
        onNameChange={setTemplateName}
      />

      {/* Create some space to not hide the buttons with menu button on mobile */}
      <div className="h-12 sm:h-0"></div>
    </div>
  );
}

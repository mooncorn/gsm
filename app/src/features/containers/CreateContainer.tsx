import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { apiUrl } from "../../config/constants";
import { toast, Bounce } from "react-toastify";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import FormInput from "../../components/ui/FormInput";
import Select from "../../components/ui/Select";
import FormSection from "../../components/ui/FormSection";
import { useNavigate } from "react-router-dom";
import { TbArrowLeft } from "react-icons/tb";
import {
  useContainerTemplates,
  ContainerFormData,
} from "../../hooks/useContainerTemplates";
import { DockerImage, SystemResources } from "./types";
import { PortsSection } from "./components/PortsSection";
import { EnvironmentSection } from "./components/EnvironmentSection";
import { VolumesSection } from "./components/VolumesSection";
import { ResourceLimitsSection } from "./components/ResourceLimitsSection";

const CreateContainer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ContainerFormData>({
    containerName: "",
    image: "",
    ports: [{ container: "", host: "", protocol: "tcp" }],
    environment: [{ key: "", value: "" }],
    volumes: [{ path: "" }],
    memory: "",
    cpu: "",
    restart: "no",
  });

  const {
    templates,
    selectedTemplate,
    setSelectedTemplate,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    loadTemplate,
  } = useContainerTemplates();

  const [images, setImages] = useState<DockerImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<string[]>([]);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const imageInputRef = useRef<HTMLDivElement>(null);
  const [systemResources, setSystemResources] =
    useState<SystemResources | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const restartOptions = [
    { value: "no", label: "No" },
    { value: "on-failure", label: "On Failure" },
    { value: "always", label: "Always" },
    { value: "unless-stopped", label: "Unless Stopped" },
  ];

  // Fetch available images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(`${apiUrl}/docker/images`, {
          withCredentials: true,
        });
        setImages(response.data);
      } catch (err) {
        console.error("Failed to fetch images", err);
      }
    };
    fetchImages();
  }, []);

  // Listen to system resources SSE
  useEffect(() => {
    const eventSource = new EventSource(`${apiUrl}/system/resources/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSystemResources(data);
      } catch (err) {
        console.error("Failed to parse system resources", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        imageInputRef.current &&
        !imageInputRef.current.contains(event.target as Node)
      ) {
        setShowImageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter images based on input
  const handleImageSearch = (value: string) => {
    setFormData((prev) => ({ ...prev, image: value }));

    if (!value.trim()) {
      setFilteredImages([]);
      setShowImageDropdown(false);
      return;
    }

    const filtered = images
      .flatMap((img) => img.RepoTags)
      .filter(
        (tag) =>
          tag &&
          tag !== "<none>:<none>" &&
          tag.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 10);

    setFilteredImages(filtered);
    setShowImageDropdown(true);
  };

  const selectImage = (image: string) => {
    setFormData((prev) => ({ ...prev, image }));
    setShowImageDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate volume paths
      const invalidVolumes = formData.volumes.filter((vol) => {
        if (!vol.path) return false;
        return vol.path.includes("..");
      });

      if (invalidVolumes.length > 0) {
        toast.error(
          "Invalid volume path. Directory traversal is not allowed.",
          {
            position: "bottom-right",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
            transition: Bounce,
          }
        );
        return;
      }

      // Validate memory and CPU
      const memoryMB = parseFloat(formData.memory);
      const cpuCores = parseFloat(formData.cpu);

      if (formData.memory && (isNaN(memoryMB) || memoryMB < 0)) {
        toast.error("Memory must be a positive number", { theme: "colored" });
        return;
      }

      if (formData.cpu && (isNaN(cpuCores) || cpuCores < 0)) {
        toast.error("CPU must be a positive number", { theme: "colored" });
        return;
      }

      // Format the data according to the new ContainerCreateRequest structure
      const requestData = {
        name: formData.containerName,
        image: formData.image,
        ports: formData.ports
          .filter((port) => port.container && port.host)
          .map((port) => ({
            hostPort: parseInt(port.host),
            containerPort: parseInt(port.container),
            protocol: port.protocol,
          })),
        env: formData.environment
          .filter((env) => env.key && env.value)
          .map((env) => `${env.key}=${env.value}`),
        volumes: formData.volumes
          .filter((vol) => vol.path)
          .map((vol) => vol.path.replace(/^\/|\/$/g, "")),
        memory: formData.memory
          ? Math.floor(parseFloat(formData.memory) * 1024 * 1024)
          : 0, // Convert MB to bytes
        cpu: formData.cpu ? parseFloat(formData.cpu) : 0,
        restart: formData.restart,
      };

      await axios.post(`${apiUrl}/docker/containers`, requestData, {
        withCredentials: true,
      });

      toast.success("Container created successfully", {
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

      navigate("/containers");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create container", {
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
    }
  };

  const handleTemplateSelect = (value: string) => {
    setSelectedTemplate(value);
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

  const handleUpdateTemplate = () => {
    updateTemplate(formData);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate("/containers")}
          icon={<TbArrowLeft className="text-xl" />}
        />
        <h2 className="text-2xl font-bold">Create Container</h2>
      </div>

      <div className="">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-700 pb-4">
            <h1 className="text-2xl font-bold">Templates</h1>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Select
                className="w-full sm:w-auto min-w-[200px]"
                options={[
                  { value: "", label: "Select Template" },
                  ...templates.map((t) => ({ value: t.name, label: t.name })),
                ]}
                value={selectedTemplate}
                onChange={handleTemplateSelect}
              />
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowSaveTemplateModal(true)}
                  className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600"
                >
                  Save New
                </Button>
                <Button
                  onClick={handleUpdateTemplate}
                  disabled={!selectedTemplate}
                  className={`flex-1 sm:flex-none ${
                    !selectedTemplate ? "opacity-50 cursor-not-allowed" : ""
                  } bg-green-600 hover:bg-green-700`}
                >
                  Update
                </Button>
                <Button
                  onClick={deleteTemplate}
                  disabled={!selectedTemplate}
                  className={`flex-1 sm:flex-none ${
                    !selectedTemplate ? "opacity-50 cursor-not-allowed" : ""
                  } bg-red-600 hover:bg-red-700`}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <FormInput
            label="Container Name"
            value={formData.containerName}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                containerName: e.target.value,
              }))
            }
            required
          />

          <div className="relative" ref={imageInputRef}>
            <FormInput
              label="Image"
              value={formData.image}
              onChange={(e) => handleImageSearch(e.target.value)}
              onFocus={() => handleImageSearch(formData.image)}
              placeholder="Search for an image..."
              required
            />
            {showImageDropdown && filteredImages.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredImages.map((image, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                    onClick={() => selectImage(image)}
                  >
                    {image}
                  </div>
                ))}
              </div>
            )}
          </div>

          <PortsSection
            ports={formData.ports}
            onChange={(ports) => setFormData((prev) => ({ ...prev, ports }))}
          />

          <EnvironmentSection
            variables={formData.environment}
            onChange={(environment) =>
              setFormData((prev) => ({ ...prev, environment }))
            }
          />

          <VolumesSection
            volumes={formData.volumes}
            containerName={formData.containerName}
            onChange={(volumes) =>
              setFormData((prev) => ({ ...prev, volumes }))
            }
          />

          <ResourceLimitsSection
            systemResources={systemResources}
            memory={formData.memory}
            cpu={formData.cpu}
            onMemoryChange={(memory) =>
              setFormData((prev) => ({ ...prev, memory }))
            }
            onCpuChange={(cpu) => setFormData((prev) => ({ ...prev, cpu }))}
          />

          <FormSection title="Restart Policy">
            <Select
              options={restartOptions}
              value={formData.restart}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, restart: value }))
              }
            />
          </FormSection>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              onClick={() => navigate("/containers")}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              Create
            </Button>
          </div>
        </form>
      </div>

      <Modal
        title="Save as Template"
        isOpen={showSaveTemplateModal}
        onClose={() => {
          setShowSaveTemplateModal(false);
          setTemplateName("");
        }}
        onConfirm={handleSaveTemplate}
        confirmText="Save"
        confirmDisabled={!templateName.trim()}
      >
        <FormInput
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Enter template name"
        />
      </Modal>
    </div>
  );
};

export default CreateContainer;

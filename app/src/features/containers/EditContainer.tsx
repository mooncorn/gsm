import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ContainerTemplate } from "../../types/docker";
import { useImageSearch } from "./hooks/useImageSearch";
import { useContainerFormValidation } from "./hooks/useContainerFormValidation";
import { api } from "../../api";
import { useToast } from "../../hooks/useToast";

// UI Components
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { ContainerForm } from "./components/ContainerForm";

export default function EditContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { validateForm } = useContainerFormValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const {
    filteredImages,
    showImageDropdown,
    setShowImageDropdown,
    handleImageSearch,
    isLoading: isLoadingImages,
  } = useImageSearch();

  const [formData, setFormData] = useState<ContainerTemplate>({
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
  });

  useEffect(() => {
    const fetchContainer = async () => {
      try {
        if (!id) return;
        const container = await api.docker.getContainer(id);

        // Convert container details to form data
        setFormData({
          containerName: container.name.replace("/", ""),
          image: container.config.image,
          ports: Object.entries(container.hostConfig.portBindings || {}).map(
            ([containerPort, hostPorts]) => ({
              containerPort: containerPort.split("/")[0],
              hostPort: hostPorts[0].hostPort.toString(),
              protocol: containerPort.split("/")[1],
            })
          ),
          environment: container.config.env
            ? container.config.env.map((env) => {
                const [key, value] = env.split("=");
                return { key, value };
              })
            : [{ key: "", value: "" }],
          volumes: container.mounts
            ? container.mounts.map((mount) => mount.target)
            : [""],
          memory: container.hostConfig.memory.toString(),
          cpu: container.hostConfig.cpu.toString(),
          restart: container.hostConfig.restartPolicy.name,
          tty: container.config.tty,
          attachStdin: container.config.attachStdin,
          attachStdout: container.config.attachStdout,
          attachStderr: container.config.attachStderr,
        });
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch container details");
        navigate("/containers");
      } finally {
        setIsFetching(false);
      }
    };

    fetchContainer();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(formData)) {
      return;
    }

    try {
      setIsLoading(true);
      const requestData = {
        name: formData.containerName,
        image: formData.image,
        ports: formData.ports.map((port) => ({
          hostPort: parseInt(port.hostPort),
          containerPort: parseInt(port.containerPort),
          protocol: port.protocol,
        })),
        env: formData.environment
          .filter((env) => env.key && env.value)
          .map((env) => `${env.key}=${env.value}`),
        volumes: formData.volumes.filter((v) => v),
        memory: formData.memory ? parseInt(formData.memory) : 0,
        cpu: formData.cpu ? parseFloat(formData.cpu) : 0,
        restart: formData.restart,
        tty: formData.tty,
        attachStdin: formData.attachStdin,
        attachStdout: formData.attachStdout,
        attachStderr: formData.attachStderr,
      };

      await api.docker.updateContainer(id!, requestData);
      toast.success("Container updated successfully");
      navigate("/containers");
    } catch (err: any) {
      toast.error(err.message || "Failed to update container");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <PageHeader title="Edit Container" showBackButton backTo="/containers" />

      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              isLoading={isLoading}
            >
              Update
            </Button>
          </div>
        </form>
      </div>

      {/* Create some space to not hide the buttons with menu button on mobile */}
      <div className="h-12 sm:h-0"></div>
    </div>
  );
}

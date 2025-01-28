import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { apiUrl } from "../../config/constants";
import { toast, Bounce } from "react-toastify";
import Button from "../../components/ui/Button";
import { IoAddCircleOutline } from "react-icons/io5";
import { IoRemoveCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { TbArrowLeft } from "react-icons/tb";

interface DockerImage {
  ID: string;
  RepoTags: string[];
}

interface SystemResources {
  memory: {
    total: number;
    used: number;
    free: number;
    used_percent: number;
  };
  cpu: {
    cores: number;
    used: number;
    model_name: string;
    frequencies: number[];
    temperature: number;
    architecture: string;
  };
  docker: {
    running_containers: number;
    total_containers: number;
    total_images: number;
  };
  system: {
    os: string;
    platform: string;
    kernel_version: string;
    uptime: number;
    last_update: string;
  };
}

interface ContainerTemplate {
  name: string;
  image: string;
  containerName: string;
  volumes: string[]; // Just container paths
  ports: { container: string; host: string; protocol: string }[];
  environment: { key: string; value: string }[];
  memory: string;
  cpu: string;
  restart: string;
}

const CreateContainer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    containerName: "",
    image: "",
    ports: [{ container: "", host: "", protocol: "tcp" }],
    environment: [{ key: "", value: "" }],
    volumes: [{ path: "" }],
    memory: "", // Memory in MB
    cpu: "", // CPU cores
    restart: "no", // Restart policy
  });
  const [images, setImages] = useState<DockerImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<string[]>([]);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const imageInputRef = useRef<HTMLDivElement>(null);
  const [systemResources, setSystemResources] =
    useState<SystemResources | null>(null);
  const [templates, setTemplates] = useState<ContainerTemplate[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const protocolOptions = ["tcp", "udp"];
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

  // Fetch system resources with periodic refresh
  useEffect(() => {
    const fetchSystemResources = async () => {
      try {
        const response = await axios.get(`${apiUrl}/system/resources`, {
          withCredentials: true,
        });
        setSystemResources(response.data);
      } catch (err) {
        console.error("Failed to fetch system resources", err);
      }
    };

    // Initial fetch
    fetchSystemResources();

    // Refresh every 5 seconds
    const interval = setInterval(fetchSystemResources, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
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
      .slice(0, 10); // Limit to 10 results

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

  const addPort = () => {
    setFormData((prev) => ({
      ...prev,
      ports: [...prev.ports, { container: "", host: "", protocol: "tcp" }],
    }));
  };

  const addEnvironment = () => {
    setFormData((prev) => ({
      ...prev,
      environment: [...prev.environment, { key: "", value: "" }],
    }));
  };

  const addVolume = () => {
    setFormData((prev) => ({
      ...prev,
      volumes: [...prev.volumes, { path: "" }],
    }));
  };

  const removePort = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ports: prev.ports.filter((_, i) => i !== index),
    }));
  };

  const removeEnvironment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      environment: prev.environment.filter((_, i) => i !== index),
    }));
  };

  const removeVolume = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      volumes: prev.volumes.filter((_, i) => i !== index),
    }));
  };

  const handleProtocolChange = (index: number, protocol: string) => {
    const newPorts = [...formData.ports];
    newPorts[index].protocol = protocol;
    setFormData((prev) => ({ ...prev, ports: newPorts }));
  };

  useEffect(() => {
    // Load templates from localStorage on component mount
    const savedTemplates = localStorage.getItem("containerTemplates");
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const saveTemplate = () => {
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
    setShowSaveTemplateModal(false);
    setTemplateName("");

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
  };

  const updateCurrentTemplate = () => {
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

  const loadTemplate = (template: ContainerTemplate) => {
    setFormData((prev) => ({
      ...prev,
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
    }));

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
  };

  const clearForm = () => {
    setFormData({
      containerName: "",
      image: "",
      ports: [{ container: "", host: "", protocol: "tcp" }],
      environment: [{ key: "", value: "" }],
      volumes: [{ path: "" }],
      memory: "",
      cpu: "",
      restart: "no",
    });
    setSelectedTemplate("");

    toast.success("Form cleared", {
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
              <select
                className="w-full sm:w-auto min-w-[200px] px-4 py-2 pr-8 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:outline-none focus:border-blue-500 appearance-none"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.7rem top 50%",
                  backgroundSize: "0.65rem auto",
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedTemplate(value);
                  const template = templates.find((t) => t.name === value);
                  if (template) loadTemplate(template);
                }}
                value={selectedTemplate}
              >
                <option value="">Select Template</option>
                {templates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowSaveTemplateModal(true)}
                  className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600"
                >
                  Save New
                </Button>
                <Button
                  onClick={updateCurrentTemplate}
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

          <div>
            <label className="block text-sm font-medium mb-1">
              Container Name
            </label>
            <input
              type="text"
              value={formData.containerName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  containerName: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="relative" ref={imageInputRef}>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => handleImageSearch(e.target.value)}
              onFocus={() => handleImageSearch(formData.image)}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
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

          <div>
            <label className="block text-sm font-medium mb-2">Ports</label>
            {formData.ports.map((port, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Container Port"
                  value={port.container}
                  onChange={(e) => {
                    const newPorts = [...formData.ports];
                    newPorts[index].container = e.target.value;
                    setFormData((prev) => ({ ...prev, ports: newPorts }));
                  }}
                  className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Host Port"
                  value={port.host}
                  onChange={(e) => {
                    const newPorts = [...formData.ports];
                    newPorts[index].host = e.target.value;
                    setFormData((prev) => ({ ...prev, ports: newPorts }));
                  }}
                  className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <select
                  value={port.protocol}
                  onChange={(e) => handleProtocolChange(index, e.target.value)}
                  className="px-4 py-2 pr-8 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:outline-none focus:border-blue-500 appearance-none"
                  style={{
                    backgroundImage:
                      "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.7rem top 50%",
                    backgroundSize: "0.65rem auto",
                  }}
                >
                  {protocolOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.toUpperCase()}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  onClick={() => removePort(index)}
                  icon={<IoRemoveCircleOutline className="h-5 w-5" />}
                  className="w-full sm:w-auto hover:bg-red-500"
                />
              </div>
            ))}
            <Button
              type="button"
              onClick={addPort}
              icon={<IoAddCircleOutline className="h-5 w-5" />}
              className="w-full sm:w-auto text-sm bg-gray-700 hover:bg-gray-600"
            >
              Add Port
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Environment Variables
            </label>
            {formData.environment.map((env, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={env.key}
                  onChange={(e) => {
                    const newEnv = [...formData.environment];
                    newEnv[index].key = e.target.value;
                    setFormData((prev) => ({ ...prev, environment: newEnv }));
                  }}
                  className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={env.value}
                  onChange={(e) => {
                    const newEnv = [...formData.environment];
                    newEnv[index].value = e.target.value;
                    setFormData((prev) => ({ ...prev, environment: newEnv }));
                  }}
                  className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <Button
                  type="button"
                  onClick={() => removeEnvironment(index)}
                  icon={<IoRemoveCircleOutline className="h-5 w-5" />}
                  className="w-full sm:w-auto hover:bg-red-500"
                />
              </div>
            ))}
            <Button
              type="button"
              onClick={addEnvironment}
              icon={<IoAddCircleOutline className="h-5 w-5" />}
              className="w-full sm:w-auto text-sm bg-gray-700 hover:bg-gray-600"
            >
              Add Environment Variable
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Volumes</label>
            <div className="bg-gray-800 p-4 rounded-md mb-4">
              <h4 className="text-sm font-medium text-blue-400 mb-2">
                Volume Path Mapping
              </h4>
              <p className="text-sm text-gray-400 mb-2">
                Enter the path you want to use inside the container. The same
                path will be created under the shared directory:
              </p>
              <div className="bg-gray-900 p-3 rounded-md text-sm mb-2">
                <p className="mb-1">
                  <span className="text-green-400">Container path:</span> /data
                </p>
                <p>
                  <span className="text-blue-400">Host path:</span> /gsm/shared/
                  {formData.containerName || "<container_name>"}/data
                </p>
              </div>
              <p className="text-sm text-gray-400">
                Files placed in either location will be accessible from both
                paths.
              </p>
            </div>
            {formData.volumes.map((volume, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Path (e.g. data)"
                  value={volume.path}
                  onChange={(e) => {
                    const newVolumes = [...formData.volumes];
                    newVolumes[index].path = e.target.value;
                    setFormData((prev) => ({ ...prev, volumes: newVolumes }));
                  }}
                  className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <Button
                  type="button"
                  onClick={() => removeVolume(index)}
                  icon={<IoRemoveCircleOutline className="h-5 w-5" />}
                  className="w-full sm:w-auto hover:bg-red-500"
                />
              </div>
            ))}
            <Button
              type="button"
              onClick={addVolume}
              icon={<IoAddCircleOutline className="h-5 w-5" />}
              className="w-full sm:w-auto text-sm bg-gray-700 hover:bg-gray-600"
            >
              Add Volume
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Resource Limits
            </label>
            {systemResources && (
              <div className="bg-gray-800 p-4 rounded-md mb-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">
                  Available System Resources
                </h4>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400">Memory:</p>
                      <p className="text-white">
                        {systemResources.memory?.free
                          ? Math.round(
                              systemResources.memory.free / (1024 * 1024)
                            )
                          : 0}{" "}
                        MB free
                        <span className="text-gray-400 text-xs ml-1">
                          of{" "}
                          {systemResources.memory?.total
                            ? Math.round(
                                systemResources.memory.total / (1024 * 1024)
                              )
                            : 0}{" "}
                          MB
                        </span>
                      </p>
                      <p className="text-gray-400 text-xs">
                        {typeof systemResources.memory?.used_percent ===
                        "number"
                          ? systemResources.memory.used_percent.toFixed(1)
                          : "0"}
                        % used
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">CPU:</p>
                      <p className="text-white">
                        {systemResources.cpu?.cores || 0} cores
                        <span className="text-gray-400 text-xs ml-1">
                          (
                          {typeof systemResources.cpu?.used === "number"
                            ? systemResources.cpu.used.toFixed(1)
                            : "0"}
                          % used)
                        </span>
                      </p>
                      <p className="text-gray-400 text-xs">
                        {systemResources.cpu?.model_name || "Unknown CPU"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs">
                          Docker Containers:
                        </p>
                        <p className="text-white">
                          {systemResources.docker?.running_containers || 0}{" "}
                          running
                          <span className="text-gray-400 text-xs ml-1">
                            of {systemResources.docker?.total_containers || 0}{" "}
                            total
                          </span>
                        </p>
                        <p className="text-gray-400 text-xs">
                          {systemResources.docker?.total_images || 0} images
                          available
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">System:</p>
                        <p className="text-white text-xs">
                          {systemResources.system?.platform || "Unknown"} (
                          {systemResources.cpu?.architecture || "Unknown"})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Memory (MB)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 512"
                  value={formData.memory}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, memory: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  CPU Cores
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0.5"
                  value={formData.cpu}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cpu: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Restart Policy
            </label>
            <select
              value={formData.restart}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, restart: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              {restartOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              onClick={clearForm}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Clear
            </Button>
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

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Save as Template</h2>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName("");
                }}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={saveTemplate}
                disabled={!templateName.trim()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateContainer;

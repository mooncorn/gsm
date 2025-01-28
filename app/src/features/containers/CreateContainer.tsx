import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { apiUrl } from "../../config/constants";
import { toast, Bounce } from "react-toastify";
import Button from "../../components/ui/Button";
import { IoAddCircleOutline } from "react-icons/io5";
import { IoRemoveCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

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

      const response = await axios.post(
        `${apiUrl}/docker/containers`,
        requestData,
        { withCredentials: true }
      );

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

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={() => navigate("/containers")}
          icon={<IoArrowBack className="h-5 w-5" />}
          className="bg-gray-700 hover:bg-gray-600"
        >
          Back to Containers
        </Button>
        <h2 className="text-2xl font-bold">Create Container</h2>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full sm:w-auto px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
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
    </div>
  );
};

export default CreateContainer;

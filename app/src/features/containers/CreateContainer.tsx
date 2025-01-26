import { useState } from "react";
import axios from "axios";
import { apiUrl } from "../../App";
import { toast, Bounce } from "react-toastify";
import Button from "../../components/ui/Button";
import { IoAddCircleOutline } from "react-icons/io5";
import { IoRemoveCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const CreateContainer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    containerName: "",
    image: "",
    ports: [{ container: "", host: "" }],
    environment: [{ key: "", value: "" }],
    volumes: [{ source: "", destination: "" }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Format the data for the API
      const config = {
        ContainerName: formData.containerName,
        Config: {
          Image: formData.image,
          Env: formData.environment
            .filter(env => env.key && env.value)
            .map(env => `${env.key}=${env.value}`),
          Tty: true,
        },
        HostConfig: {
          PortBindings: formData.ports.reduce((acc, port) => {
            if (port.container && port.host) {
              acc[`${port.container}/tcp`] = [
                { HostPort: port.host }
              ];
            }
            return acc;
          }, {} as Record<string, Array<{ HostPort: string }>>),
          Binds: formData.volumes
            .filter(vol => vol.source && vol.destination)
            .map(vol => `${vol.source}:${vol.destination}`),
        },
      };

      await axios.post(
        `${apiUrl}/docker/run`,
        config,
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
    setFormData(prev => ({
      ...prev,
      ports: [...prev.ports, { container: "", host: "" }]
    }));
  };

  const addEnvironment = () => {
    setFormData(prev => ({
      ...prev,
      environment: [...prev.environment, { key: "", value: "" }]
    }));
  };

  const addVolume = () => {
    setFormData(prev => ({
      ...prev,
      volumes: [...prev.volumes, { source: "", destination: "" }]
    }));
  };

  const removePort = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ports: prev.ports.filter((_, i) => i !== index)
    }));
  };

  const removeEnvironment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      environment: prev.environment.filter((_, i) => i !== index)
    }));
  };

  const removeVolume = (index: number) => {
    setFormData(prev => ({
      ...prev,
      volumes: prev.volumes.filter((_, i) => i !== index)
    }));
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
            <label className="block text-sm font-medium mb-1">Container Name</label>
            <input
              type="text"
              value={formData.containerName}
              onChange={e => setFormData(prev => ({ ...prev, containerName: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input
              type="text"
              value={formData.image}
              onChange={e => setFormData(prev => ({ ...prev, image: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ports</label>
            {formData.ports.map((port, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Container Port"
                  value={port.container}
                  onChange={e => {
                    const newPorts = [...formData.ports];
                    newPorts[index].container = e.target.value;
                    setFormData(prev => ({ ...prev, ports: newPorts }));
                  }}
                  className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Host Port"
                  value={port.host}
                  onChange={e => {
                    const newPorts = [...formData.ports];
                    newPorts[index].host = e.target.value;
                    setFormData(prev => ({ ...prev, ports: newPorts }));
                  }}
                  className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
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
            <label className="block text-sm font-medium mb-2">Environment Variables</label>
            {formData.environment.map((env, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={env.key}
                  onChange={e => {
                    const newEnv = [...formData.environment];
                    newEnv[index].key = e.target.value;
                    setFormData(prev => ({ ...prev, environment: newEnv }));
                  }}
                  className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={env.value}
                  onChange={e => {
                    const newEnv = [...formData.environment];
                    newEnv[index].value = e.target.value;
                    setFormData(prev => ({ ...prev, environment: newEnv }));
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
            {formData.volumes.map((volume, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Source"
                  value={volume.source}
                  onChange={e => {
                    const newVolumes = [...formData.volumes];
                    newVolumes[index].source = e.target.value;
                    setFormData(prev => ({ ...prev, volumes: newVolumes }));
                  }}
                  className="w-full sm:flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Destination"
                  value={volume.destination}
                  onChange={e => {
                    const newVolumes = [...formData.volumes];
                    newVolumes[index].destination = e.target.value;
                    setFormData(prev => ({ ...prev, volumes: newVolumes }));
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
            >
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContainer; 
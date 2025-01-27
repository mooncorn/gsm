import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/constants";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaPlus } from "react-icons/fa6";
import { ContainerListItem } from "../../types/docker";

const ContainerList = () => {
  const [containers, setContainers] = useState<ContainerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dockerEventSourceRef = useRef<EventSource | null>(null);
  const navigate = useNavigate();

  const fetchContainers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${apiUrl}/docker/ps`,
        {
          Options: { All: true },
        },
        {
          withCredentials: true,
        }
      );
      setContainers(response.data);
      
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to fetch containers", {
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    connectToDockerEvents();

    // Cleanup when component unmounts
    return () => {
      disconnectDockerEvents();
    };
  }, []);

  const connectToDockerEvents = () => {
    if (!dockerEventSourceRef.current) {
      dockerEventSourceRef.current = new EventSource(
        `${apiUrl}/docker/events`,
        {
          withCredentials: true,
        }
      );

      dockerEventSourceRef.current.onmessage = (event) => {
        const eventData = JSON.parse(event.data);

        // Only handle container events
        if (
          eventData.event_type === "container" &&
          ["start", "die", "create", "remove"].includes(eventData.action)
        ) {
          fetchContainers();
        }
      };

      dockerEventSourceRef.current.onerror = (error) => {
        console.error("Docker EventSource failed:", error);
        disconnectDockerEvents();
        // Try to reconnect after a delay
        setTimeout(connectToDockerEvents, 5000);
      };
    }
  };

  const disconnectDockerEvents = () => {
    if (dockerEventSourceRef.current) {
      dockerEventSourceRef.current.close();
      dockerEventSourceRef.current = null;
    }
  };

  const getContainerName = (container: ContainerListItem) => {
    return container.Names[0].replace("/", "");
  };

  const capitalizeFirstLetter = (val: string) => {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  };

  const cleanStatus = (status: string) => {
    // For running containers: "Up 2 hours (healthy)" -> "Up 2 hours"
    // For stopped containers: "Exited (0) 3 hours ago" -> "Stopped 3 hours ago"
    if (status.startsWith("Up")) {
      return status.replace(/\s*\([^)]*\)/, '');
    } else if (status.startsWith("Exited")) {
      return status.replace(/Exited\s*\([^)]*\)/, 'Stopped');
    }
    return status;
  };

  const renderContainerCards = () => {
    return containers.map((c) => (
      <div
        key={c.Id}
        className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200"
      >
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div 
              className="text-blue-300 hover:underline cursor-pointer text-lg font-medium"
              onClick={() => navigate(`/containers/${getContainerName(c)}`)}
            >
              {getContainerName(c)}
            </div>
            <div className="flex items-center gap-2">
              
              <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                c.State === "running"
                  ? "bg-green-900 text-green-100"
                  : "bg-red-900 text-red-100"
              }`}>
                {capitalizeFirstLetter(c.State)}
              </span>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-gray-400 break-all">
              {c.Image}
            </span>
            <span className="text-xs text-gray-500">
              {cleanStatus(c.Status)}
            </span>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Containers</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate("/containers/create")} 
            icon={<FaPlus />}
          />
          <Button
            onClick={fetchContainers}
            icon={<HiOutlineRefresh className={isLoading ? "animate-spin" : ""} />}
            disabled={isLoading}
          />
        </div>
      </div>
      
      {/* Mobile and Desktop Views */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {renderContainerCards()}
      </div>
    </div>
  );
};

export default ContainerList;

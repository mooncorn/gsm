import React, { useEffect, useState, useRef } from "react";
import {
  TbCpu,
  TbDeviceDesktop,
  TbDatabase,
  TbContainer,
} from "react-icons/tb";
import { apiUrl } from "../../config/constants";

interface SystemResourcesData {
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
  disk: {
    total: number;
    used: number;
    free: number;
    used_percent: number;
  };
  system: {
    os: string;
    platform: string;
    kernel_version: string;
    uptime: number;
    last_update: string;
  };
}

const formatMemory = (bytes: number | undefined): string => {
  if (!bytes) return "0";
  const mb = Math.round(bytes / (1024 * 1024));
  return mb.toLocaleString();
};

const formatDisk = (bytes: number | undefined): string => {
  if (!bytes) return "0";
  const gb = Math.round(bytes / (1024 * 1024 * 1024));
  return gb.toLocaleString();
};

const SystemResources: React.FC = () => {
  const [resources, setResources] = useState<SystemResourcesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connectToResourceStream = () => {
      if (!eventSourceRef.current) {
        const eventSourceInit: EventSourceInit = {
          withCredentials: true,
        };

        eventSourceRef.current = new EventSource(
          `${apiUrl}/system/resources/stream`,
          eventSourceInit
        );

        eventSourceRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setResources(data);
          setError(null);
        };

        eventSourceRef.current.onerror = (error) => {
          console.error("System resources EventSource error:", error);
          setError("Failed to load system resources");
          disconnectResourceStream();
          // Try to reconnect after a delay
          setTimeout(connectToResourceStream, 5000);
        };
      }
    };

    const disconnectResourceStream = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    connectToResourceStream();

    // Cleanup on component unmount
    return () => {
      disconnectResourceStream();
    };
  }, []);

  if (error || !resources) {
    return null;
  }

  return (
    <div className="mt-auto p-4 border-t border-gray-700">
      <div className="text-sm text-gray-400 mb-2">System Resources</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TbCpu className="text-blue-400" />
            <span className="text-sm">
              CPU ({resources.cpu?.cores || 0} cores)
            </span>
          </div>
          <span className="text-sm">{resources.cpu?.used.toFixed(1)}%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TbDeviceDesktop className="text-green-400" />
            <span className="text-sm">Memory</span>
          </div>
          <div className="text-right">
            <span className="text-sm">
              {typeof resources.memory?.used_percent === "number"
                ? resources.memory.used_percent.toFixed(1)
                : "0"}
              %
            </span>
            <div className="text-xs text-gray-400">
              {formatMemory(resources.memory?.used)} /{" "}
              {formatMemory(resources.memory?.total)} MB
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TbDatabase className="text-purple-400" />
            <span className="text-sm">Disk</span>
          </div>
          <div className="text-right">
            <span className="text-sm">
              {typeof resources.disk?.used_percent === "number"
                ? resources.disk.used_percent.toFixed(1)
                : "0"}
              %
            </span>
            <div className="text-xs text-gray-400">
              {formatDisk(resources.disk?.used)} /{" "}
              {formatDisk(resources.disk?.total)} GB
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TbContainer className="text-yellow-400" />
            <span className="text-sm">Containers</span>
          </div>
          <span className="text-sm">
            {resources.docker?.running_containers || 0} /{" "}
            {resources.docker?.total_containers || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemResources;

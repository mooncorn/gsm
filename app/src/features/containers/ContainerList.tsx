import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../App";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaPlus } from "react-icons/fa6";
import { ContainerListItem } from "../../types/docker";

const ContainerList = () => {
  const [containers, setContainers] = useState<ContainerListItem[]>([]);
  const dockerEventSourceRef = useRef<EventSource | null>(null);
  const navigate = useNavigate();

  const fetchContainers = async () => {
    try {
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

        if (
          ["start", "stop", "die", "kill", "destroy"].includes(eventData.action)
        ) {
          fetchContainers();
        }
      };

      dockerEventSourceRef.current.onerror = (error) => {
        console.error("Docker EventSource failed:", error);
        disconnectDockerEvents();
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

  const mapContainers = () => {
    return containers.map((c) => (
      <tr className="hover:bg-gray-800" key={c.Id}>
        <td className="px-2 py-2">
          <span
            className="hover:underline cursor-pointer text-blue-300"
            onClick={() => navigate(`/containers/${getContainerName(c)}`)}
          >
            {getContainerName(c)}
          </span>
        </td>
        <td className="px-3 py-3">{c.Image}</td>
        <td className="flex items-center gap-2 px-3 py-3">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              c?.State === "running" ? "bg-green-700" : "bg-red-700"
            }`}
          />
          <span>{c.Status}</span>
        </td>
      </tr>
    ));
  };

  return (
    <div className="min-w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold m-2">Containers</h2>
        <div className="flex gap-2">
          <Button onClick={fetchContainers} icon={<FaPlus />} />
          <Button onClick={fetchContainers} icon={<HiOutlineRefresh />} />
        </div>
      </div>
      <table className="table-auto min-w-full">
        <thead className="border-b border-gray-700 hover:bg-gray-800">
          <tr className="font-semibold">
            <td className="px-3 py-3">Name</td>
            <td className="px-3 py-3">Image</td>
            <td className="px-3 py-3">Status</td>
          </tr>
        </thead>
        <tbody>{mapContainers()}</tbody>
      </table>
    </div>
  );
};

export default ContainerList;

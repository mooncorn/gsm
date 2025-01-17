import axios from "axios";
import { useEffect, useState } from "react";
import { apiUrl } from "./App";
import { toast } from "react-toastify";
import { default as ContainerComponent } from "./Container";
import Button from "./Button";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaPlus } from "react-icons/fa6";

interface Mount {
  Type: string;
  Source: string;
  Destination: string;
}

interface Port {
  IP?: string;
  PrivatePort?: number;
  PublicPort?: number;
  Type?: string;
}

interface Container {
  Id: string;
  Names: string[];
  Image: string;
  Labels: string[];
  State: string;
  Status: string;
  Mounts: Mount[];
  Ports: Port[];
}

const Containers = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(
    null
  );

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

    // Setup SSE connection
    const eventSource = new EventSource(`${apiUrl}/docker/events`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      const eventData = JSON.parse(event.data);

      // Refetch containers on relevant actions
      if (["start", "kill", "die", "destroy"].includes(eventData.action)) {
        fetchContainers();
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      eventSource.close(); // Close the connection on error
      toast("Failed to connect to Docker events", { type: "error" });
    };

    // Cleanup when component unmounts
    return () => {
      eventSource.close();
    };
  }, []);

  const getContainerName = (container: Container) => {
    return container.Names[0].replace("/", "");
  };

  const mapContainers = () => {
    return containers.map((c) => (
      <tr className="hover:bg-gray-800" key={c.Id}>
        <td className="px-2 py-2">
          <span
            className="hover:underline cursor-pointer text-blue-300"
            onClick={() => setSelectedContainer(c)}
          >
            {getContainerName(c)}
          </span>
        </td>
        <td className="px-3 py-3">{c.Image}</td>
        <td className="px-3 py-3">{c.Status}</td>
      </tr>
    ));
  };

  if (selectedContainer)
    return (
      <ContainerComponent containerName={getContainerName(selectedContainer)} />
    );

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

export default Containers;

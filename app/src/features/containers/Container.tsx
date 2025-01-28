import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Button from "../../components/ui/Button";
import TabPanel from "../../components/ui/TabPanel";
import { apiUrl } from "../../config/constants";
import { Bounce, toast } from "react-toastify";
import { IoPower, IoTrash } from "react-icons/io5";
import { useUser } from "../../UserContext";
import { useParams, useNavigate } from "react-router-dom";
import { TbArrowLeft } from "react-icons/tb";
import { ContainerDetails } from "../../types/docker";
import { formatDate } from "../../utils/format";
import PageHeader from "../../components/ui/PageHeader";

const Container = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [container, setContainer] = useState<ContainerDetails | null>(null);
  const [command, setCommand] = useState("");
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const logEventSourceRef = useRef<EventSource | null>(null);
  const dockerEventSourceRef = useRef<EventSource | null>(null);
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const fetchContainerDetails = async () => {
    try {
      const response = await axios.get(`${apiUrl}/docker/inspect/${id}`, {
        withCredentials: true,
      });
      setContainer(response.data);
    } catch (err) {
      console.error("Failed to fetch container details", err);
      toast.error(`Failed to get details for ${id}`, {
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

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${apiUrl}/docker/logs/${id}`, {
        withCredentials: true,
      });
      // Ensure we always have an array of strings
      const logData = response.data;
      if (typeof logData === "string") {
        setLogs(logData.split("\n"));
      } else if (Array.isArray(logData)) {
        setLogs(logData);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
      toast.error(`Failed to get logs for ${id}`, {
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

  const connectToLogStream = () => {
    if (!logEventSourceRef.current) {
      logEventSourceRef.current = new EventSource(
        `${apiUrl}/docker/logs/${id}/stream`,
        {
          withCredentials: true,
        }
      );

      logEventSourceRef.current.onmessage = (event) => {
        setLogs((prevLogs) => {
          // Ensure we're working with an array
          const currentLogs = Array.isArray(prevLogs) ? prevLogs : [];
          return [...currentLogs, event.data];
        });
      };

      logEventSourceRef.current.onerror = (error) => {
        console.error("Log EventSource failed:", error);
        disconnectLogStream();
      };
    }
  };

  const disconnectLogStream = () => {
    if (logEventSourceRef.current) {
      logEventSourceRef.current.close();
      logEventSourceRef.current = null;
    }
  };

  const connectToDockerEvents = () => {
    if (!dockerEventSourceRef.current) {
      const eventSourceInit: EventSourceInit = {
        withCredentials: true,
      };

      dockerEventSourceRef.current = new EventSource(
        `${apiUrl}/docker/events`,
        eventSourceInit
      );

      dockerEventSourceRef.current.onmessage = (event) => {
        const eventData = JSON.parse(event.data);

        // Check if this event is for a container
        if (eventData.event_type === "container") {
          // Get the container name from attributes
          const containerName = eventData.attributes?.name;

          // Check if this event is for our container
          if (containerName && containerName.replace("/", "") === id) {
            if (["start", "die"].includes(eventData.action)) {
              fetchContainerDetails();
            }
          }
        }
      };

      dockerEventSourceRef.current.onerror = (error) => {
        console.error("Docker EventSource error:", error);
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

  useEffect(() => {
    fetchContainerDetails();
    fetchLogs();
    connectToDockerEvents();
    connectToLogStream();

    // Cleanup on component unmount
    return () => {
      disconnectDockerEvents();
      disconnectLogStream();
    };
  }, [id]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const start = async () => {
    try {
      setIsLoading(true);
      await axios.post(
        `${apiUrl}/docker/start/${id}`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Start failed", err);
      toast.error(`Failed to start ${id}`, {
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (container?.State.Running) {
      connectToLogStream();
    } else {
      disconnectLogStream();
    }
  }, [container]);

  const stop = async () => {
    try {
      setIsLoading(true);
      await axios.post(
        `${apiUrl}/docker/stop/${id}`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error(`Failed to stop ${id}`, err);
      toast.error(`Failed to stop ${id}`, {
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
    } finally {
      setIsLoading(false);
    }
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    try {
      const response = await axios.post(
        `${apiUrl}/docker/exec/${id}`,
        { command },
        { withCredentials: true }
      );

      // Add the command and its output to the logs
      setLogs((prev) => [...prev, response.data.output]);
      setCommand(""); // Clear the input

      // Scroll to bottom
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop =
          logContainerRef.current.scrollHeight;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to execute command", {
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

  const capitalizeFirstLetter = (val: string) => {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  };

  const deleteContainer = async () => {
    try {
      setIsLoading(true);
      await axios.post(
        `${apiUrl}/docker/rm/${id}`,
        {},
        { withCredentials: true }
      );
      toast.success("Container deleted successfully", {
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
      console.error("Failed to delete container", err);
      toast.error(err.response?.data?.error || "Failed to delete container", {
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
    } finally {
      setIsLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={(container?.Name || id || "Container").toString()}
        showBackButton
        backTo="/containers"
        actions={
          <div className="flex gap-2">
            {!container?.State.Running && (
              <Button
                onClick={() => setShowDeleteConfirmation(true)}
                className="bg-red-800 hover:bg-red-600 px-4 py-2 flex items-center space-x-2"
                disabled={isLoading}
                icon={<IoTrash className={isLoading ? "opacity-50" : ""} />}
              />
            )}
            <Button
              onClick={container?.State.Running ? stop : start}
              className={`${
                container?.State.Running
                  ? "bg-red-800 hover:bg-red-600"
                  : "bg-green-800 hover:bg-green-600"
              } px-4 py-2 flex items-center space-x-2`}
              disabled={isLoading}
              icon={<IoPower className={isLoading ? "opacity-50" : ""} />}
            />
          </div>
        }
      />

      <div className="flex flex-col h-full w-full">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                container?.State.Running
                  ? "bg-green-900 text-green-100"
                  : "bg-red-900 text-red-100"
              }`}
            >
              {capitalizeFirstLetter(container?.State.Status || "unknown")}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-gray-400">
              {container?.Config.Image}
            </span>
            <span className="text-xs text-gray-500">
              {container?.State.Running
                ? `Started ${formatDate(new Date(container?.State.StartedAt))}`
                : `Stopped ${
                    container?.State.FinishedAt
                      ? formatDate(new Date(container?.State.FinishedAt))
                      : ""
                  }`}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 overflow-x-auto">
          <nav
            className="flex flex-nowrap min-w-max space-x-4"
            aria-label="Tabs"
          >
            {["Logs", "State", "Ports", "Mounts", "Environment"].map(
              (tab, index) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(index)}
                  className={`${
                    activeTab === index
                      ? "border-blue-500 text-blue-500"
                      : "border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300"
                  } py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200`}
                  aria-selected={activeTab === index}
                  role="tab"
                >
                  {tab}
                </button>
              )
            )}
          </nav>
        </div>

        {/* Logs Tab */}
        <TabPanel value={activeTab} index={0}>
          <div
            ref={logContainerRef}
            className="nice-scrollbar bg-black text-white p-2 sm:p-4 h-96 overflow-y-auto rounded-lg"
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {logs.map((log, index) => (
              <div key={index} className="text-xs sm:text-sm font-mono">
                {log}
              </div>
            ))}
          </div>

          {user?.role === "admin" && container?.State.Running && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeCommand()}
                placeholder="Enter command to execute..."
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
              />
              <Button
                onClick={executeCommand}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded whitespace-nowrap"
              >
                Execute
              </Button>
            </div>
          )}
        </TabPanel>

        {/* State Tab */}
        <TabPanel value={activeTab} index={1}>
          <div className="overflow-x-auto">
            <table className="table-auto min-w-full">
              <tbody>
                <tr>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Status</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">
                    {container?.State.Status}
                  </td>
                </tr>
                <tr>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Running</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">
                    {container?.State.Running ? "true" : "false"}
                  </td>
                </tr>
                <tr>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Paused</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">
                    {container?.State.Paused ? "true" : "false"}
                  </td>
                </tr>
                <tr>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Restarting</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">
                    {container?.State.Restarting ? "true" : "false"}
                  </td>
                </tr>
                <tr>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Started At</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">
                    {container?.State.StartedAt
                      ? formatDate(new Date(container?.State.StartedAt))
                      : ""}
                  </td>
                </tr>
                <tr>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Finished At</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">
                    {container?.State.FinishedAt
                      ? formatDate(new Date(container?.State.FinishedAt))
                      : ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabPanel>

        {/* Ports Tab */}
        <TabPanel value={activeTab} index={2}>
          <div className="overflow-x-auto">
            <table className="table-auto min-w-full">
              <thead className="border-b border-gray-700">
                <tr className="font-semibold">
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Container Port</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Host IP</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Host Port</td>
                </tr>
              </thead>
              <tbody>
                {container?.HostConfig.PortBindings &&
                  Object.entries(container.HostConfig.PortBindings).map(
                    ([containerPort, hostPorts]) => (
                      <tr key={containerPort}>
                        <td className="px-2 sm:px-3 py-2 sm:py-3">
                          {containerPort}
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3">
                          {hostPorts.map(
                            (hostPort) => hostPort.HostIp || "0.0.0.0"
                          )}
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3">
                          {hostPorts.map((hostPort) => hostPort.HostPort)}
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>
        </TabPanel>

        {/* Mounts Tab */}
        <TabPanel value={activeTab} index={3}>
          <div className="overflow-x-auto">
            <table className="table-auto min-w-full">
              <thead className="border-b border-gray-700">
                <tr className="font-semibold">
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Source</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Destination</td>
                </tr>
              </thead>
              <tbody>
                {container?.Mounts &&
                  container.Mounts.map((mount) => (
                    <tr key={mount.Source}>
                      <td className="px-2 sm:px-3 py-2 sm:py-3 break-all">
                        {mount.Source}
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-3 break-all">
                        {mount.Destination}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </TabPanel>

        {/* Environment Tab */}
        <TabPanel value={activeTab} index={4}>
          <div className="overflow-x-auto">
            <table className="table-auto min-w-full">
              <thead className="border-b border-gray-700">
                <tr className="font-semibold">
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Name</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">Value</td>
                </tr>
              </thead>
              <tbody>
                {container?.Config.Env &&
                  container.Config.Env.map((env) => {
                    const [key, value] = env.split("=");
                    return (
                      <tr key={env}>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 break-all">
                          {key}
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 break-all">
                          {value}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </TabPanel>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete container{" "}
              <span className="font-semibold">{container?.Name || id}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowDeleteConfirmation(false)}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={deleteContainer}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Container;

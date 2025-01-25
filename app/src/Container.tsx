import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Button from "./Button";
import TabPanel from "./TabPanel";
import { apiUrl } from "./App";
import { Bounce, toast } from "react-toastify";
import { IoPower } from "react-icons/io5";
import { useUser } from "./UserContext";

interface ContainerProps {
  containerName: string;
}

interface Port {
  HostPort: string;
  HostIp: string;
}

interface Container {
  Id: string;
  Created: Date;
  State: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    OOMKilled: boolean;
    Dead: boolean;
    Pid: number;
    ExitCode: number;
    StartedAt: Date;
    FinishedAt: Date;
    Health?: {
      Status: string;
      FailingStreak: number;
      Log: Array<{
        Start: Date;
        End: Date;
        ExitCode: number;
        Output: string;
      }>;
    };
  };
  Name: string;
  RestartCount: number;
  Mounts: Array<{
    Type: string;
    Source: string;
    Destination: string;
  }>;
  Config: {
    Tty: boolean;
    Env: string[];
    Image: string;
    Labels: Record<string, string>;
  };
  HostConfig: {
    PortBindings: Record<string, Port[]>;
  };
}

const Container = ({ containerName }: ContainerProps) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [container, setContainer] = useState<Container | null>(null);
  const [command, setCommand] = useState("");
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const logEventSourceRef = useRef<EventSource | null>(null);
  const dockerEventSourceRef = useRef<EventSource | null>(null);
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(0);

  const fetchContainerDetails = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/docker/inspect/${containerName}`,
        {
          withCredentials: true,
        }
      );
      setContainer(response.data);
    } catch (err) {
      console.error("Failed to fetch container details", err);
      toast.error(`Failed to get details for ${containerName}`, {
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
      const response = await axios.get(
        `${apiUrl}/docker/logs/${containerName}`,
        {
          withCredentials: true,
        }
      );
      setLogs(response.data.split("\n"));
    } catch (err) {
      console.error("Failed to fetch logs", err);
      toast.error(`Failed to get logs for ${containerName}`, {
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
        `${apiUrl}/docker/logs/${containerName}/stream`,
        {
          withCredentials: true,
        }
      );

      logEventSourceRef.current.onmessage = (event) => {
        setLogs((prevLogs) => [...prevLogs, event.data]);
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
      dockerEventSourceRef.current = new EventSource(
        `${apiUrl}/docker/events`,
        {
          withCredentials: true,
        }
      );

      dockerEventSourceRef.current.onmessage = (event) => {
        const eventData = JSON.parse(event.data);

        if (eventData.attributes?.name === containerName) {
          if (
            ["start", "stop", "die", "kill", "destroy"].includes(
              eventData.action
            )
          ) {
            fetchContainerDetails();
          }
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
  }, [containerName]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const start = async () => {
    try {
      setIsLoading(true);
      await axios.post(
        `${apiUrl}/docker/start/${containerName}`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Start failed", err);
      toast.error(`Failed to start ${containerName}`, {
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
        `${apiUrl}/docker/stop/${containerName}`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error(`Failed to stop ${containerName}`, err);
      toast.error(`Failed to stop ${containerName}`, {
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

  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return "";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleString("en-US", {
      month: "long", // Full month name
      day: "numeric", // Day of the month
      year: "numeric", // Full year
      hour: "numeric", // Hour
      minute: "numeric", // Minute
      hour12: true, // 12-hour format with AM/PM
    });
  };

  const executeCommand = async () => {
    if (!command.trim()) return;
    
    try {
      const response = await axios.post(
        `${apiUrl}/docker/exec/${containerName}`,
        { command },
        { withCredentials: true }
      );
      
      // Add the command and its output to the logs
      setLogs(prev => [...prev, response.data.output]);
      setCommand(""); // Clear the input
      
      // Scroll to bottom
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
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
}

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-xl font-semibold">{container?.Name || containerName}</h2>
          <span
            className={`px-2 py-1 text-xs rounded ${
              container?.State.Running
                ? "bg-green-900 text-green-100"
                : "bg-red-900 text-red-100"
            }`}
          >
            {capitalizeFirstLetter(container?.State.Status || "unknown")}
          </span>
        </div>
        <Button
          onClick={container?.State.Running ? stop : start}
          className={`${
            container?.State.Running ? "text-red-600" : "text-green-600"
          } px-4 py-2 flex items-center space-x-2`}
        >
          <IoPower className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-4" aria-label="Tabs">
          {['Logs', 'State', 'Ports', 'Mounts', 'Environment'].map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`${
                activeTab === index
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-300'
              } py-2 px-3 border-b-2 font-medium text-sm`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Logs Tab */}
      <TabPanel value={activeTab} index={0}>
        <div
          ref={logContainerRef}
          className="console-logs bg-black text-white p-4 h-96 overflow-y-auto rounded-lg"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {logs.map((log, index) => (
            <div key={index} className="text-sm font-mono">
              {log}
            </div>
          ))}
        </div>

        {user?.role === 'admin' && container?.State.Running && (
          <div className="mt-4 flex space-x-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
              placeholder="Enter command to execute..."
              className="flex-1 px-4 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <Button
              onClick={executeCommand}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Execute
            </Button>
          </div>
        )}
      </TabPanel>

      {/* State Tab */}
      <TabPanel value={activeTab} index={1}>
        <table className="table-auto min-w-full">
          <tbody>
            <tr>
              <td className="px-3 py-3">Status</td>
              <td className="px-3 py-3">{container?.State.Status}</td>
            </tr>
            <tr>
              <td className="px-3 py-3">Running</td>
              <td className="px-3 py-3">{container?.State.Running ? "true" : "false"}</td>
            </tr>
            <tr>
              <td className="px-3 py-3">Paused</td>
              <td className="px-3 py-3">{container?.State.Paused ? "true" : "false"}</td>
            </tr>
            <tr>
              <td className="px-3 py-3">Restarting</td>
              <td className="px-3 py-3">{container?.State.Restarting ? "true" : "false"}</td>
            </tr>
            <tr>
              <td className="px-3 py-3">Started At</td>
              <td className="px-3 py-3">{formatDateTime(container?.State.StartedAt)}</td>
            </tr>
            <tr>
              <td className="px-3 py-3">Finished At</td>
              <td className="px-3 py-3">{formatDateTime(container?.State.FinishedAt)}</td>
            </tr>
          </tbody>
        </table>
      </TabPanel>

      {/* Ports Tab */}
      <TabPanel value={activeTab} index={2}>
        <table className="table-auto min-w-full">
          <thead className="border-b border-gray-700">
            <tr className="font-semibold">
              <td className="px-3 py-3">Container Port</td>
              <td className="px-3 py-3">Host IP</td>
              <td className="px-3 py-3">Host Port</td>
            </tr>
          </thead>
          <tbody>
            {container?.HostConfig.PortBindings &&
              Object.entries(container.HostConfig.PortBindings).map(
                ([containerPort, hostPorts]) => (
                  <tr key={containerPort}>
                    <td className="px-3 py-3">{containerPort}</td>
                    <td className="px-3 py-3">
                      {hostPorts.map((hostPort) => hostPort.HostIp || "0.0.0.0")}
                    </td>
                    <td className="px-3 py-3">
                      {hostPorts.map((hostPort) => hostPort.HostPort)}
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </TabPanel>

      {/* Mounts Tab */}
      <TabPanel value={activeTab} index={3}>
        <table className="table-auto min-w-full">
          <thead className="border-b border-gray-700">
            <tr className="font-semibold">
              <td className="px-3 py-3">Source</td>
              <td className="px-3 py-3">Destination</td>
            </tr>
          </thead>
          <tbody>
            {container?.Mounts &&
              container.Mounts.map((mount) => (
                <tr key={mount.Source}>
                  <td className="px-3 py-3">{mount.Source}</td>
                  <td className="px-3 py-3">{mount.Destination}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </TabPanel>

      {/* Environment Tab */}
      <TabPanel value={activeTab} index={4}>
        <table className="table-auto min-w-full">
          <thead className="border-b border-gray-700">
            <tr className="font-semibold">
              <td className="px-3 py-3">Name</td>
              <td className="px-3 py-3">Value</td>
            </tr>
          </thead>
          <tbody>
            {container?.Config.Env &&
              container.Config.Env.map((env) => {
                const [key, value] = env.split("=");
                return (
                  <tr key={env}>
                    <td className="px-3 py-3">{key}</td>
                    <td className="px-3 py-3">{value}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </TabPanel>
    </div>
  );
};

export default Container;

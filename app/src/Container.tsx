import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Button from "./Button";
import { apiUrl } from "./App";
import { Bounce, toast } from "react-toastify";
import { IoPower } from "react-icons/io5";

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
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const logEventSourceRef = useRef<EventSource | null>(null);
  const dockerEventSourceRef = useRef<EventSource | null>(null);

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

  return (
    <div className="min-w-full">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-baseline">
          <h2 className="text-2xl font-bold m-2">{containerName}</h2>
          <span className="text-gray-500">{container?.Config.Image}</span>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            onClick={container?.State.Running ? stop : start}
            icon={<IoPower />}
            disabled={isLoading}
            className={
              container?.State.Running ? "text-red-700" : "text-green-700"
            }
          />
        </div>
      </div>

      <div
        ref={logContainerRef}
        className="console-logs mt-4 bg-black text-white p-4 h-96 overflow-y-auto rounded-lg"
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

      {/* State */}
      <div className="mt-4">
        <table className="table-auto min-w-full">
          <thead className="border-b border-gray-700">
            <tr className="font-semibold">
              <td className="px-3 py-3">State</td>
              <td className="px-3 py-3"></td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3">Status</td>
              <td className="px-3 py-3"> {container?.State.Status}</td>
            </tr>
            <tr>
              <td className="px-3 py-3">Running</td>
              <td className="px-3 py-3">
                {container?.State.Running ? "true" : "false"}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-3">Paused</td>
              <td className="px-3 py-3">
                {container?.State.Paused ? "true" : "false"}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-3">Restarting</td>
              <td className="px-3 py-3">
                {container?.State.Restarting ? "true" : "false"}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-3">Started At</td>
              <td className="px-3 py-3">
                {formatDateTime(container?.State.StartedAt)}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-3">Finished At</td>
              <td className="px-3 py-3">
                {formatDateTime(container?.State.FinishedAt)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ports */}
      <div className="mt-4">
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
                      {hostPorts.map(
                        (hostPort) => hostPort.HostIp || "0.0.0.0"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {hostPorts.map((hostPort) => hostPort.HostPort)}
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </div>

      {/* Mounts */}
      <div className="mt-4">
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
      </div>

      {/* Env */}
      <div className="mt-4">
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
      </div>
    </div>
  );
};

export default Container;

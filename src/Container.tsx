import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Button from "./Button";
import { apiUrl } from "./App";
import { Bounce, toast } from "react-toastify";

interface ContainerProps {
  containerName: string;
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
        { withCredentials: true }
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
        { withCredentials: true }
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
        { withCredentials: true }
      );

      logEventSourceRef.current.onmessage = (event) => {
        setLogs((prevLogs) => [...prevLogs, event.data]);
      };

      logEventSourceRef.current.onerror = (error) => {
        if (container?.State.Status === "running") {
          toast.error(`Failed to listen to logs for ${containerName}`, {
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
        console.error("Log EventSource failed:", error);
        logEventSourceRef.current?.close();
        logEventSourceRef.current = null;
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

        // Check if the event is related to this container
        if (eventData.attributes?.name === containerName) {
          // Handle events like start, stop, die, destroy
          if (["start", "stop", "die", "destroy"].includes(eventData.action)) {
            fetchContainerDetails(); // Update container details on state-change events
          }
        }
      };

      dockerEventSourceRef.current.onerror = (error) => {
        if (container?.State.Status === "running") {
          toast.error(`Failed to listen to docker events`, {
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
        console.error("Docker EventSource failed:", error);
        dockerEventSourceRef.current?.close();
        dockerEventSourceRef.current = null;
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
    // Auto-scroll to the bottom of the logs
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
      connectToLogStream();
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

  const stop = async () => {
    try {
      setIsLoading(true);
      await axios.post(
        `${apiUrl}/docker/stop/${containerName}`,
        {},
        { withCredentials: true }
      );
      disconnectLogStream();
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

  return (
    <div className="min-w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold m-2">{containerName}</h2>

        <div className="flex gap-2 items-center">
          Status: {container?.State.Status}
          <Button
            onClick={start}
            disabled={container?.State.Running || isLoading}
            text="Start"
            className="bg-green-700"
          />
          <Button
            onClick={stop}
            disabled={!container?.State.Running || isLoading}
            text="Stop"
            className="bg-red-700"
          />
        </div>
      </div>

      <div
        ref={logContainerRef}
        className="console-logs mt-4 bg-black text-white p-4 h-96 overflow-y-auto rounded-lg"
      >
        {logs.map((log, index) => (
          <div key={index} className="text-sm font-mono">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Container;

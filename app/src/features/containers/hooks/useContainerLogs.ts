import { useState, useRef, useEffect } from "react";
import { api } from "../../../api";
import { useToast } from "../../../hooks/useToast";

export function useContainerLogs(id: string | undefined) {
  const toast = useToast();
  const [logs, setLogs] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  const logEventSourceRef = useRef<EventSource | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const fetchLogs = async () => {
    try {
      if (!id) return;
      const data = await api.docker.getLogs(id);
      setLogs(data.split("\n"));
    } catch (err) {
      console.error("Failed to fetch logs", err);
      toast.error(`Failed to get logs for ${id}`);
    }
  };

  const connectToLogStream = () => {
    if (!logEventSourceRef.current && id) {
      logEventSourceRef.current = api.docker.streamContainerLogs(id);

      logEventSourceRef.current.onmessage = (event) => {
        const logs = event.data as string;
        setLogs((prevLogs) => [...prevLogs, logs]);
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

  const executeCommand = async () => {
    if (!command.trim() || !id) return;

    try {
      const response = await api.docker.executeCommand(id, command);
      setLogs((prev) => [...prev, response.output]);
      setCommand("");

      if (logContainerRef.current) {
        logContainerRef.current.scrollTop =
          logContainerRef.current.scrollHeight;
      }
    } catch (err) {
      console.error("Failed to execute command", err);
      toast.error("Failed to execute command");
    }
  };

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return {
    logs,
    command,
    setCommand,
    logContainerRef,
    fetchLogs,
    connectToLogStream,
    disconnectLogStream,
    executeCommand,
  };
}

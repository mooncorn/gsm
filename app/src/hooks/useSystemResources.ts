import { useState, useRef, useEffect } from "react";
import { api } from "../api";
import { SystemResources } from "../types/system";

export function useSystemResources() {
  const [resources, setResources] = useState<SystemResources | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connectToResourceStream = () => {
    if (!eventSourceRef.current) {
      eventSourceRef.current = api.system.streamResources();

      eventSourceRef.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data) as SystemResources;
          setResources(parsedData);
          setError(null);
        } catch (err) {
          console.error("Failed to parse system resources data:", err);
          setError("Failed to parse system resources data");
        }
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

  useEffect(() => {
    connectToResourceStream();
    return () => {
      disconnectResourceStream();
    };
  }, []);

  return {
    resources,
    error,
  };
}

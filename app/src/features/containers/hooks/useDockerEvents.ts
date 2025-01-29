import { useRef } from "react";
import { api } from "../../../api";

export function useDockerEvents(onContainerEvent: () => void) {
  const dockerEventSourceRef = useRef<EventSource | null>(null);

  const connectToDockerEvents = () => {
    if (!dockerEventSourceRef.current) {
      dockerEventSourceRef.current = api.docker.streamDockerEvents();

      dockerEventSourceRef.current.onmessage = (event) => {
        const eventData = JSON.parse(event.data);

        // Check if this event is for a container
        if (eventData.event_type === "container") {
          if (["start", "die"].includes(eventData.action)) {
            onContainerEvent();
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

  return {
    connectToDockerEvents,
    disconnectDockerEvents,
  };
}

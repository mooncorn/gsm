import React, { useEffect, useState, useRef } from 'react';
import { TbCpu, TbDeviceDesktop, TbDatabase } from 'react-icons/tb';
import { apiUrl } from '../../config/constants';

interface SystemResourcesData {
  cpu: number;
  memory: number;
  disk: number;
  gpuUsed: boolean;
}

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
          console.error('System resources EventSource error:', error);
          setError('Failed to load system resources');
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

  if (error) {
    return null; // Don't show anything if there's an error
  }

  if (!resources) {
    return null; // Don't show anything while loading
  }

  return (
    <div className="mt-auto p-4 border-t border-gray-700">
      <div className="text-sm text-gray-400 mb-2">System Resources</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TbCpu className="text-blue-400" />
            <span className="text-sm">CPU</span>
          </div>
          <span className="text-sm">{resources.cpu.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TbDeviceDesktop className="text-green-400" />
            <span className="text-sm">Memory</span>
          </div>
          <span className="text-sm">{resources.memory.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TbDatabase className="text-purple-400" />
            <span className="text-sm">Disk</span>
          </div>
          <span className="text-sm">{resources.disk.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default SystemResources; 
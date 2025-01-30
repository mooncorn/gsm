import React from "react";
import { ContainerDetailsResponseData } from "../../../api";
import { formatDate } from "../../../utils/format";
import { useUser } from "../../../UserContext";
import Button from "../../../components/ui/Button";

interface LogsTabProps {
  logs: string[];
  command: string;
  onCommandChange: (value: string) => void;
  onExecute: () => void;
  logContainerRef: React.RefObject<HTMLDivElement>;
  isRunning: boolean;
}

export function LogsTab({
  logs,
  command,
  onCommandChange,
  onExecute,
  logContainerRef,
  isRunning,
}: LogsTabProps) {
  const { user } = useUser();

  return (
    <div>
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

      {user?.role === "admin" && isRunning && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => onCommandChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onExecute()}
            placeholder="Enter command to execute..."
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <Button
            onClick={onExecute}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded whitespace-nowrap"
          >
            Execute
          </Button>
        </div>
      )}
    </div>
  );
}

interface StateTabProps {
  container: ContainerDetailsResponseData;
}

export function StateTab({ container }: StateTabProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto min-w-full">
        <tbody>
          <tr>
            <td className="px-2 sm:px-3 py-2 sm:py-3">Status</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">
              {container.state.status}
            </td>
          </tr>
          <tr>
            <td className="px-2 sm:px-3 py-2 sm:py-3">Running</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">
              {container.state.running ? "true" : "false"}
            </td>
          </tr>
          <tr>
            <td className="px-2 sm:px-3 py-2 sm:py-3">Started At</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">
              {container.state.startedAt
                ? formatDate(new Date(container.state.startedAt))
                : ""}
            </td>
          </tr>
          <tr>
            <td className="px-2 sm:px-3 py-2 sm:py-3">Finished At</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">
              {container.state.finishedAt
                ? formatDate(new Date(container.state.finishedAt))
                : ""}
            </td>
          </tr>
          <tr>
            <td className="px-2 sm:px-3 py-2 sm:py-3">TTY</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">
              {container.config.tty ? "true" : "false"}
            </td>
          </tr>
          <tr>
            <td className="px-2 sm:px-3 py-2 sm:py-3">Attach STDIN</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">
              {container.config.attachStdin ? "true" : "false"}
            </td>
          </tr>
          <tr>
            <td className="px-2 sm:px-3 py-2 sm:py-3">Attach STDOUT</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">
              {container.config.attachStdout ? "true" : "false"}
            </td>
          </tr>
          <tr>
            <td className="px-2 sm:px-3 py-2 sm:py-3">Attach STDERR</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">
              {container.config.attachStderr ? "true" : "false"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface PortsTabProps {
  container: ContainerDetailsResponseData;
}

export function PortsTab({ container }: PortsTabProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto min-w-full">
        <thead className="border-b border-gray-700">
          <tr className="font-semibold">
            <td className="px-2 sm:px-3 py-2 sm:py-3">Container Port</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">Host Port</td>
          </tr>
        </thead>
        <tbody>
          {container.hostConfig.portBindings &&
            Object.entries(container.hostConfig.portBindings).map(
              ([containerPort, hostPorts]) => (
                <tr key={containerPort}>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">{containerPort}</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3">
                    {hostPorts.map((hostPort) => hostPort.hostPort)}
                  </td>
                </tr>
              )
            )}
        </tbody>
      </table>
    </div>
  );
}

interface MountsTabProps {
  container: ContainerDetailsResponseData;
}

export function MountsTab({ container }: MountsTabProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto min-w-full">
        <thead className="border-b border-gray-700">
          <tr className="font-semibold">
            <td className="px-2 sm:px-3 py-2 sm:py-3">Source</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">Destination</td>
          </tr>
        </thead>
        <tbody>
          {container.mounts &&
            container.mounts.map((mount) => (
              <tr key={mount.source}>
                <td className="px-2 sm:px-3 py-2 sm:py-3 break-all">
                  {mount.source}
                </td>
                <td className="px-2 sm:px-3 py-2 sm:py-3 break-all">
                  {mount.target}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

interface EnvironmentTabProps {
  container: ContainerDetailsResponseData;
}

export function EnvironmentTab({ container }: EnvironmentTabProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto min-w-full">
        <thead className="border-b border-gray-700">
          <tr className="font-semibold">
            <td className="px-2 sm:px-3 py-2 sm:py-3">Name</td>
            <td className="px-2 sm:px-3 py-2 sm:py-3">Value</td>
          </tr>
        </thead>
        <tbody>
          {container.config.env &&
            container.config.env.map((env) => {
              const [key, value] = env.split("=");
              return (
                <tr key={env}>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 break-all">{key}</td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 break-all">
                    {value}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

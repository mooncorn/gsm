import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { IoPlay, IoStop } from "react-icons/io5";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import TabPanel from "../../components/ui/TabPanel";
import Modal from "../../components/ui/Modal";
import { formatDate } from "../../utils/format";
import { useContainerOperations } from "./hooks/useContainerOperations";
import { useContainerLogs } from "./hooks/useContainerLogs";
import { useDockerEvents } from "./hooks/useDockerEvents";
import {
  LogsTab,
  StateTab,
  PortsTab,
  MountsTab,
  EnvironmentTab,
} from "./components/ContainerTabs";
import { FaTrash } from "react-icons/fa6";

const TABS = ["Logs", "State", "Ports", "Mounts", "Environment"];

export default function Container() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const {
    container,
    isStarting,
    isStopping,
    isDeleting,
    fetchContainerDetails,
    start,
    stop,
    deleteContainer,
  } = useContainerOperations(id);

  const {
    logs,
    command,
    setCommand,
    logContainerRef,
    fetchLogs,
    connectToLogStream,
    disconnectLogStream,
    executeCommand,
  } = useContainerLogs(id);

  const { connectToDockerEvents, disconnectDockerEvents } = useDockerEvents(
    fetchContainerDetails
  );

  useEffect(() => {
    fetchContainerDetails();
    fetchLogs();
    connectToDockerEvents();
    connectToLogStream();

    return () => {
      disconnectDockerEvents();
      disconnectLogStream();
    };
  }, [id]);

  useEffect(() => {
    if (container?.state.running) {
      connectToLogStream();
    } else {
      disconnectLogStream();
    }
  }, [container?.state.running]);

  const capitalizeFirstLetter = (val: string) => {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  };

  if (!container) {
    return null;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={container.name.replace("/", "") || ""}
        showBackButton
        backTo="/containers"
      />

      <div className="flex flex-col h-full w-full">
        <div className="flex flex-row justify-between items-center space-y-2">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                  container.state.running
                    ? "bg-green-900 text-green-100"
                    : "bg-red-900 text-red-100"
                }`}
              >
                {capitalizeFirstLetter(container.state.status || "unknown")}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-gray-400">
                {container.config.image}
              </span>
              <span className="text-xs text-gray-500">
                {container.state.running
                  ? `Started ${formatDate(new Date(container.state.startedAt))}`
                  : `Stopped ${
                      container.state.finishedAt
                        ? formatDate(new Date(container.state.finishedAt))
                        : ""
                    }`}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDeleteConfirmation(true)}
              className="bg-red-600 hover:bg-red-500"
              disabled={container.state.running}
              isLoading={isDeleting}
              icon={<FaTrash />}
            />
            <Button
              onClick={container.state.running ? stop : start}
              className={`${
                container.state.running
                  ? "bg-yellow-600 hover:bg-yellow-500"
                  : "bg-green-600 hover:bg-green-500"
              } px-4 py-2 flex items-center space-x-2`}
              isLoading={isStarting || isStopping}
              icon={container.state.running ? <IoStop /> : <IoPlay />}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 overflow-x-auto">
          <nav
            className="flex flex-nowrap min-w-max space-x-4"
            aria-label="Tabs"
          >
            {TABS.map((tab, index) => (
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
            ))}
          </nav>
        </div>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <LogsTab
            logs={logs}
            command={command}
            onCommandChange={setCommand}
            onExecute={executeCommand}
            logContainerRef={logContainerRef}
            isRunning={container.state.running}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <StateTab container={container} />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <PortsTab container={container} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <MountsTab container={container} />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <EnvironmentTab container={container} />
        </TabPanel>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={deleteContainer}
        confirmText="Delete"
        confirmStyle="danger"
        isLoading={isDeleting}
      >
        <p className="mb-6">
          Are you sure you want to delete container{" "}
          <span className="font-semibold">{container.name || id}</span>?
        </p>
      </Modal>
    </div>
  );
}

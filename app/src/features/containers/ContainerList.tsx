import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaPlus } from "react-icons/fa6";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { useContainerList } from "./hooks/useContainerList";
import { useDockerEvents } from "./hooks/useDockerEvents";
import { ContainerCard } from "./components/ContainerCard";

export default function ContainerList() {
  const navigate = useNavigate();
  const {
    containers,
    isLoading,
    fetchContainers,
    getContainerName,
    capitalizeFirstLetter,
    cleanStatus,
  } = useContainerList();

  const { connectToDockerEvents, disconnectDockerEvents } =
    useDockerEvents(fetchContainers);

  useEffect(() => {
    fetchContainers();
    connectToDockerEvents();

    return () => {
      disconnectDockerEvents();
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Containers"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/containers/create")}
              icon={<FaPlus />}
            />
            <Button
              onClick={fetchContainers}
              icon={
                <HiOutlineRefresh className={isLoading ? "animate-spin" : ""} />
              }
              disabled={isLoading}
            />
          </div>
        }
      />

      {/* Mobile and Desktop Views */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {containers.map((container) => (
          <ContainerCard
            key={container.id}
            container={container}
            getContainerName={getContainerName}
            capitalizeFirstLetter={capitalizeFirstLetter}
            cleanStatus={cleanStatus}
            onContainerClick={(name) => navigate(`/containers/${name}`)}
          />
        ))}
      </div>
    </div>
  );
}

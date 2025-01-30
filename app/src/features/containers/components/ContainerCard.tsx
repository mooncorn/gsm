import { ContainerListItemResponseData } from "../../../api";
import ContainerStatusLabel from "./ContainerStateLabel";

interface ContainerCardProps {
  container: ContainerListItemResponseData;
  onContainerClick: (name: string) => void;
}

export function ContainerCard({
  container,
  onContainerClick,
}: ContainerCardProps) {
  const getContainerName = (container: ContainerListItemResponseData) => {
    return container.names[0].replace("/", "");
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div
            className="text-blue-300 hover:underline cursor-pointer text-lg font-medium"
            onClick={() => onContainerClick(getContainerName(container))}
          >
            {getContainerName(container)}
          </div>
          <div className="flex items-center gap-2">
            <ContainerStatusLabel state={container.state} />
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-gray-400 break-all">
            {container.image}
          </span>
          <span className="text-xs text-gray-500">
            {container.status.replace(/\s*\([^)]*\)/, "")}
          </span>
        </div>
      </div>
    </div>
  );
}

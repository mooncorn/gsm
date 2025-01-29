import { ContainerListItem } from "../../../api";

interface ContainerCardProps {
  container: ContainerListItem;
  getContainerName: (container: ContainerListItem) => string;
  capitalizeFirstLetter: (val: string) => string;
  cleanStatus: (status: string) => string;
  onContainerClick: (name: string) => void;
}

export function ContainerCard({
  container,
  getContainerName,
  capitalizeFirstLetter,
  cleanStatus,
  onContainerClick,
}: ContainerCardProps) {
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
            <span
              className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                container.state === "running"
                  ? "bg-green-900 text-green-100"
                  : "bg-red-900 text-red-100"
              }`}
            >
              {capitalizeFirstLetter(container.state)}
            </span>
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-gray-400 break-all">
            {container.image}
          </span>
          <span className="text-xs text-gray-500">
            {cleanStatus(container.status)}
          </span>
        </div>
      </div>
    </div>
  );
}

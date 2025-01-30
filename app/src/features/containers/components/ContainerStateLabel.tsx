import { capitalizeFirstLetter } from "../../../utils/format";

interface ContainerStateLabelProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  state: string;
}

export default function ContainerStateLabel({
  state,
  className,
}: ContainerStateLabelProps) {
  const getContainerStateStyle = (state: string) => {
    switch (state) {
      case "running":
        return "bg-green-900 text-green-100";
      case "exited":
        return "bg-red-900 text-red-100";
      case "paused":
        return "bg-yellow-900 text-yellow-100";
      case "restarting":
        return "bg-blue-900 text-blue-100";
      case "dead":
      case "created":
        return "bg-gray-900 text-gray-100";
      default:
        return "";
    }
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded whitespace-nowrap ${getContainerStateStyle(
        state
      )} ${className}`}
    >
      {capitalizeFirstLetter(state)}
    </span>
  );
}

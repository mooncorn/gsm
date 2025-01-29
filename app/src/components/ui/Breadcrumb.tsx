import React from "react";
import { TbChevronRight } from "react-icons/tb";

const Breadcrumb: React.FC<{
  root: string;
  path: string;
  onNavigate: (path: string) => void;
}> = ({ root, path, onNavigate }) => {
  const segments = path.split("/").filter(Boolean);

  return (
    <div className="flex items-center gap-1 text-sm flex-wrap">
      <button
        onClick={() => onNavigate("")}
        className="text-blue-400 hover:text-blue-300 font-medium"
      >
        {root}
      </button>
      {segments.map((segment, index) => (
        <React.Fragment key={index}>
          <TbChevronRight className="text-gray-500" />
          <button
            onClick={() => onNavigate(segments.slice(0, index + 1).join("/"))}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            {segment}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb;

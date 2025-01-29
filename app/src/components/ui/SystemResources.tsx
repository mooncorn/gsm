import React from "react";
import {
  TbCpu,
  TbDeviceDesktop,
  TbDatabase,
  TbContainer,
} from "react-icons/tb";
import { useSystemResources } from "../../hooks/useSystemResources";
import {
  formatMemoryMB,
  formatDiskGB,
  formatPercent,
} from "../../utils/formatSystem";

interface ResourceItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

function ResourceItem({ icon, label, value, subValue }: ResourceItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm">{value}</span>
        {subValue && <div className="text-xs text-gray-400">{subValue}</div>}
      </div>
    </div>
  );
}

export default function SystemResources() {
  const { resources, error } = useSystemResources();

  if (error || !resources) {
    return null;
  }

  return (
    <div className="mt-auto p-4 border-t border-gray-700">
      <div className="text-sm text-gray-400 mb-2">System Resources</div>
      <div className="space-y-2">
        <ResourceItem
          icon={<TbCpu className="text-blue-400" />}
          label={`CPU (${resources.cpu?.cores || 0} cores)`}
          value={`${formatPercent(resources.cpu?.used)}%`}
        />

        <ResourceItem
          icon={<TbDeviceDesktop className="text-green-400" />}
          label="Memory"
          value={`${formatPercent(resources.memory?.used_percent)}%`}
          subValue={`${formatMemoryMB(
            resources.memory?.used
          )} / ${formatMemoryMB(resources.memory?.total)} MB`}
        />

        <ResourceItem
          icon={<TbDatabase className="text-purple-400" />}
          label="Disk"
          value={`${formatPercent(resources.disk?.used_percent)}%`}
          subValue={`${formatDiskGB(resources.disk?.used)} / ${formatDiskGB(
            resources.disk?.total
          )} GB`}
        />

        <ResourceItem
          icon={<TbContainer className="text-yellow-400" />}
          label="Containers"
          value={`${resources.docker?.running_containers || 0} / ${
            resources.docker?.total_containers || 0
          }`}
        />
      </div>
    </div>
  );
}

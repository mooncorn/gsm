import React from "react";
import FormSection from "../../../components/ui/FormSection";
import FormInput from "../../../components/ui/FormInput";
import Card from "../../../components/ui/Card";
import { SystemResources } from "../types";

interface ResourceLimitsSectionProps {
  systemResources: SystemResources | null;
  memory: string;
  cpu: string;
  onMemoryChange: (value: string) => void;
  onCpuChange: (value: string) => void;
}

export const ResourceLimitsSection: React.FC<ResourceLimitsSectionProps> = ({
  systemResources,
  memory,
  cpu,
  onMemoryChange,
  onCpuChange,
}) => {
  return (
    <FormSection title="Resource Limits">
      {systemResources && (
        <Card className="mb-4">
          <h4 className="text-sm font-medium text-blue-400 mb-2">
            Available System Resources
          </h4>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Memory:</p>
                <p className="text-white">
                  {systemResources.memory?.free
                    ? Math.round(systemResources.memory.free / (1024 * 1024))
                    : 0}{" "}
                  MB free
                  <span className="text-gray-400 text-xs ml-1">
                    of{" "}
                    {systemResources.memory?.total
                      ? Math.round(systemResources.memory.total / (1024 * 1024))
                      : 0}{" "}
                    MB
                  </span>
                </p>
                <p className="text-gray-400 text-xs">
                  {typeof systemResources.memory?.used_percent === "number"
                    ? systemResources.memory.used_percent.toFixed(1)
                    : "0"}
                  % used
                </p>
              </div>
              <div>
                <p className="text-gray-400">CPU:</p>
                <p className="text-white">
                  {systemResources.cpu?.cores || 0} cores
                  <span className="text-gray-400 text-xs ml-1">
                    (
                    {typeof systemResources.cpu?.used === "number"
                      ? systemResources.cpu.used.toFixed(1)
                      : "0"}
                    % used)
                  </span>
                </p>
                <p className="text-gray-400 text-xs">
                  {systemResources.cpu?.model_name || "Unknown CPU"}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs">Docker Containers:</p>
                  <p className="text-white">
                    {systemResources.docker?.running_containers || 0} running
                    <span className="text-gray-400 text-xs ml-1">
                      of {systemResources.docker?.total_containers || 0} total
                    </span>
                  </p>
                  <p className="text-gray-400 text-xs">
                    {systemResources.docker?.total_images || 0} images available
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">System:</p>
                  <p className="text-white text-xs">
                    {systemResources.system?.platform || "Unknown"} (
                    {systemResources.cpu?.architecture || "Unknown"})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          label="Memory (MB)"
          placeholder="e.g. 512"
          value={memory}
          onChange={(e) => onMemoryChange(e.target.value)}
        />
        <FormInput
          label="CPU Cores"
          placeholder="e.g. 0.5"
          value={cpu}
          onChange={(e) => onCpuChange(e.target.value)}
        />
      </div>
    </FormSection>
  );
};

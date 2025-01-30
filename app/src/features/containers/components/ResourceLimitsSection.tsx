import FormSection from "../../../components/ui/FormSection";
import FormInput from "../../../components/ui/FormInput";
import Card from "../../../components/ui/Card";
import { formatMemoryMB, formatPercent } from "../../../utils/formatSystem";
import { useSystemResources } from "../../../hooks/useSystemResources";

interface ResourceLimitsSectionProps {
  memory: string;
  cpu: string;
  onMemoryChange: (value: string) => void;
  onCpuChange: (value: string) => void;
}

interface ResourceInfoProps {
  label: string;
  value: string;
  subValue?: string;
}

function ResourceInfo({ label, value, subValue }: ResourceInfoProps) {
  return (
    <div>
      <p className="text-gray-400">{label}:</p>
      <p className="text-white">
        {value}
        {subValue && (
          <span className="text-gray-400 text-xs ml-1">{subValue}</span>
        )}
      </p>
    </div>
  );
}

export function ResourceLimitsSection({
  memory,
  cpu,
  onMemoryChange,
  onCpuChange,
}: ResourceLimitsSectionProps) {
  const { resources } = useSystemResources();

  const memoryMB = formatMemoryMB(resources?.memory?.available);
  const totalMemoryMB = formatMemoryMB(resources?.memory?.total);

  return (
    <FormSection title="Resource Limits">
      <Card className="mb-4">
        <h4 className="text-sm font-medium text-blue-400 mb-2">
          Available System Resources
        </h4>
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <ResourceInfo
              label="Memory"
              value={`${memoryMB} MB free`}
              subValue={`of ${totalMemoryMB} MB`}
            />
            <ResourceInfo
              label="CPU"
              value={`${resources?.cpu?.cores || 0} cores`}
              subValue={`(${formatPercent(resources?.cpu?.used)}% used)`}
            />
          </div>

          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <ResourceInfo
                label="Docker Containers"
                value={`${resources?.docker?.running_containers || 0} running`}
                subValue={`of ${
                  resources?.docker?.total_containers || 0
                } total`}
              />
              <ResourceInfo
                label="System"
                value={`${resources?.system?.platform || "Unknown"} (${
                  resources?.cpu?.architecture || "Unknown"
                })`}
              />
            </div>
          </div>
        </div>
      </Card>
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
}

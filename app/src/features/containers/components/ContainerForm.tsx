import { ContainerTemplate } from "../../../types/docker";
import FormInput from "../../../components/ui/FormInput";
import FormSection from "../../../components/ui/FormSection";
import Select from "../../../components/ui/Select";
import SearchDropdown from "../../../components/ui/SearchDropdown";
import { PortsSection } from "./PortsSection";
import { EnvironmentSection } from "./EnvironmentSection";
import { VolumesSection } from "./VolumesSection";
import { TerminalOptionsSection } from "./TerminalOptionsSection";
import { ResourceLimitsSection } from "./ResourceLimitsSection";

interface ContainerFormProps {
  formData: ContainerTemplate;
  onFormDataChange: (formData: ContainerTemplate) => void;
  imageSearch: {
    value: string;
    filteredImages: string[];
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
    handleSearch: (value: string) => void;
    isLoading: boolean;
  };
}

const RESTART_OPTIONS = [
  { value: "no", label: "No" },
  { value: "on-failure", label: "On Failure" },
  { value: "always", label: "Always" },
  { value: "unless-stopped", label: "Unless Stopped" },
];

export function ContainerForm({
  formData,
  onFormDataChange,
  imageSearch,
}: ContainerFormProps) {
  const handleTerminalOptionChange = (
    key: keyof Pick<
      ContainerTemplate,
      "tty" | "attachStdin" | "attachStdout" | "attachStderr"
    >,
    value: boolean
  ) => {
    onFormDataChange({ ...formData, [key]: value });
  };

  return (
    <div className="space-y-4">
      <FormInput
        label="Container Name"
        value={formData.containerName}
        onChange={(e) =>
          onFormDataChange({
            ...formData,
            containerName: e.target.value,
          })
        }
        required
      />

      <SearchDropdown
        label="Image"
        value={formData.image}
        onChange={(value) => {
          imageSearch.handleSearch(value);
          onFormDataChange({ ...formData, image: value });
        }}
        onSelect={(image) => {
          onFormDataChange({ ...formData, image });
          imageSearch.setShowDropdown(false);
        }}
        options={imageSearch.filteredImages}
        showDropdown={imageSearch.showDropdown}
        setShowDropdown={imageSearch.setShowDropdown}
        placeholder={
          imageSearch.isLoading ? "Loading images..." : "Search for an image..."
        }
        required
        isLoading={imageSearch.isLoading}
      />

      <PortsSection
        ports={formData.ports}
        onChange={(ports) => onFormDataChange({ ...formData, ports })}
      />

      <EnvironmentSection
        variables={formData.environment}
        onChange={(environment) =>
          onFormDataChange({ ...formData, environment })
        }
      />

      <VolumesSection
        volumes={formData.volumes}
        containerName={formData.containerName}
        onChange={(volumes: string[]) =>
          onFormDataChange({ ...formData, volumes })
        }
      />

      <FormSection title="Restart Policy">
        <Select
          options={RESTART_OPTIONS}
          value={formData.restart}
          onChange={(value) =>
            onFormDataChange({ ...formData, restart: value })
          }
        />
      </FormSection>

      <ResourceLimitsSection
        memory={formData.memory}
        cpu={formData.cpu}
        onMemoryChange={(value) =>
          onFormDataChange({ ...formData, memory: value })
        }
        onCpuChange={(value) => onFormDataChange({ ...formData, cpu: value })}
      />

      <TerminalOptionsSection
        tty={formData.tty}
        attachStdin={formData.attachStdin}
        attachStdout={formData.attachStdout}
        attachStderr={formData.attachStderr}
        onChange={handleTerminalOptionChange}
      />
    </div>
  );
}

import React from "react";
import FormSection from "../../../components/ui/FormSection";
import FormInput from "../../../components/ui/FormInput";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import { IoAddCircleOutline, IoRemoveCircleOutline } from "react-icons/io5";

interface Port {
  container: string;
  host: string;
  protocol: string;
}

interface PortsSectionProps {
  ports: Port[];
  onChange: (ports: Port[]) => void;
}

export const PortsSection: React.FC<PortsSectionProps> = ({
  ports,
  onChange,
}) => {
  const protocolOptions = ["tcp", "udp"];

  const addPort = () => {
    onChange([...ports, { container: "", host: "", protocol: "tcp" }]);
  };

  const removePort = (index: number) => {
    onChange(ports.filter((_, i) => i !== index));
  };

  const updatePort = (index: number, field: keyof Port, value: string) => {
    const newPorts = [...ports];
    newPorts[index] = { ...newPorts[index], [field]: value };
    onChange(newPorts);
  };

  return (
    <FormSection title="Ports">
      {ports.map((port, index) => (
        <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
          <FormInput
            placeholder="Container Port"
            value={port.container}
            onChange={(e) => updatePort(index, "container", e.target.value)}
          />
          <FormInput
            placeholder="Host Port"
            value={port.host}
            onChange={(e) => updatePort(index, "host", e.target.value)}
          />
          <Select
            options={protocolOptions.map((p) => ({
              value: p,
              label: p.toUpperCase(),
            }))}
            value={port.protocol}
            onChange={(value) => updatePort(index, "protocol", value)}
          />
          <Button
            type="button"
            onClick={() => removePort(index)}
            icon={<IoRemoveCircleOutline className="h-5 w-5" />}
            className="w-full sm:w-auto hover:bg-red-500"
          />
        </div>
      ))}
      <Button
        type="button"
        onClick={addPort}
        icon={<IoAddCircleOutline className="h-5 w-5" />}
        className="w-full sm:w-auto text-sm bg-gray-700 hover:bg-gray-600"
      >
        Add Port
      </Button>
    </FormSection>
  );
};

import React from "react";
import FormSection from "../../../components/ui/FormSection";
import FormInput from "../../../components/ui/FormInput";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { IoAddCircleOutline, IoRemoveCircleOutline } from "react-icons/io5";

interface VolumesSectionProps {
  volumes: string[];
  containerName: string;
  onChange: (volumes: string[]) => void;
}

export const VolumesSection: React.FC<VolumesSectionProps> = ({
  volumes,
  containerName,
  onChange,
}) => {
  const addVolume = () => {
    onChange([...volumes, ""]);
  };

  const removeVolume = (index: number) => {
    onChange(volumes.filter((_, i) => i !== index));
  };

  const updateVolume = (index: number, path: string) => {
    const newVolumes = [...volumes];
    newVolumes[index] = path;
    onChange(newVolumes);
  };

  return (
    <FormSection title="Volumes">
      <Card className="mb-4">
        <h4 className="text-sm font-medium text-blue-400 mb-2">
          Volume Path Mapping
        </h4>
        <p className="text-sm text-gray-400 mb-2">
          Enter the path you want to use inside the container. The same path
          will be created under the shared directory:
        </p>
        <div className="bg-gray-900 p-3 rounded-md text-sm mb-2">
          <p className="mb-1">
            <span className="text-green-400">Container path:</span> /data
          </p>
          <p>
            <span className="text-blue-400">Host path:</span> /gsm/shared/
            {containerName || "<container_name>"}/data
          </p>
        </div>
        <p className="text-sm text-gray-400">
          Files placed in either location will be accessible from both paths.
        </p>
      </Card>
      {volumes.map((volume, index) => (
        <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
          <FormInput
            placeholder="Path (e.g. /data)"
            value={volume}
            onChange={(e) => updateVolume(index, e.target.value)}
          />
          <Button
            type="button"
            onClick={() => removeVolume(index)}
            icon={<IoRemoveCircleOutline className="h-5 w-5" />}
            className="w-full sm:w-auto hover:bg-red-500"
          />
        </div>
      ))}
      <Button
        type="button"
        onClick={addVolume}
        icon={<IoAddCircleOutline className="h-5 w-5" />}
        className="w-full sm:w-auto text-sm bg-gray-700 hover:bg-gray-600"
      >
        Add Volume
      </Button>
    </FormSection>
  );
};

import React from "react";
import FormSection from "../../../components/ui/FormSection";
import FormInput from "../../../components/ui/FormInput";
import Button from "../../../components/ui/Button";
import { IoAddCircleOutline, IoRemoveCircleOutline } from "react-icons/io5";

interface EnvVar {
  key: string;
  value: string;
}

interface EnvironmentSectionProps {
  variables: EnvVar[];
  onChange: (variables: EnvVar[]) => void;
}

export const EnvironmentSection: React.FC<EnvironmentSectionProps> = ({
  variables,
  onChange,
}) => {
  const addVariable = () => {
    onChange([...variables, { key: "", value: "" }]);
  };

  const removeVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (
    index: number,
    field: keyof EnvVar,
    value: string
  ) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    onChange(newVariables);
  };

  return (
    <FormSection title="Environment Variables">
      {variables.map((env, index) => (
        <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
          <FormInput
            placeholder="Key"
            value={env.key}
            onChange={(e) => updateVariable(index, "key", e.target.value)}
          />
          <FormInput
            placeholder="Value"
            value={env.value}
            onChange={(e) => updateVariable(index, "value", e.target.value)}
          />
          <Button
            type="button"
            onClick={() => removeVariable(index)}
            icon={<IoRemoveCircleOutline className="h-5 w-5" />}
            className="w-full sm:w-auto hover:bg-red-500"
          />
        </div>
      ))}
      <Button
        type="button"
        onClick={addVariable}
        icon={<IoAddCircleOutline className="h-5 w-5" />}
        className="w-full sm:w-auto text-sm bg-gray-700 hover:bg-gray-600"
      >
        Add Environment Variable
      </Button>
    </FormSection>
  );
};

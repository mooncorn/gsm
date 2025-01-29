import React from "react";
import Button from "./Button";
import Select from "./Select";
import { FaSave, FaEdit, FaTrash } from "react-icons/fa";

interface Template {
  name: string;
  [key: string]: any;
}

interface TemplateControlsProps {
  templates: Template[];
  selectedTemplate: string;
  onTemplateSelect: (value: string) => void;
  onSaveNew: () => void;
  onUpdate: () => void;
  onDelete: (template: string) => void;
}

const TemplateControls: React.FC<TemplateControlsProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onSaveNew,
  onUpdate,
  onDelete,
}) => {
  const templateOptions = [
    { value: "", label: "Select Template" },
    ...templates.map((t) => ({ value: t.name, label: t.name })),
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-700 pb-4">
      <h1 className="text-2xl font-bold">Templates</h1>
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <div className="w-full sm:w-auto sm:flex-grow">
          <Select
            options={templateOptions}
            value={selectedTemplate}
            onChange={onTemplateSelect}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSaveNew}
            className="bg-green-600 hover:bg-green-500"
            icon={<FaSave />}
          >
            Save New
          </Button>
          {selectedTemplate && (
            <>
              <Button
                onClick={onUpdate}
                className="bg-blue-600 hover:bg-blue-500"
                icon={<FaEdit />}
              >
                Update
              </Button>
              <Button
                onClick={() => onDelete(selectedTemplate)}
                className="bg-red-600 hover:bg-red-500"
                icon={<FaTrash />}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateControls;

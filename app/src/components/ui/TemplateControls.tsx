import React from "react";
import Button from "./Button";
import Select from "./Select";

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
  onDelete: () => void;
}

const TemplateControls: React.FC<TemplateControlsProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onSaveNew,
  onUpdate,
  onDelete,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-700 pb-4">
      <h1 className="text-2xl font-bold">Templates</h1>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <Select
          className="w-full sm:w-auto min-w-[200px]"
          options={[
            { value: "", label: "Select Template" },
            ...templates.map((t) => ({ value: t.name, label: t.name })),
          ]}
          value={selectedTemplate}
          onChange={onTemplateSelect}
        />
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={onSaveNew}
            className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600"
          >
            Save New
          </Button>
          <Button
            onClick={onUpdate}
            disabled={!selectedTemplate}
            className={`flex-1 sm:flex-none ${
              !selectedTemplate ? "opacity-50 cursor-not-allowed" : ""
            } bg-green-600 hover:bg-green-700`}
          >
            Update
          </Button>
          <Button
            onClick={onDelete}
            disabled={!selectedTemplate}
            className={`flex-1 sm:flex-none ${
              !selectedTemplate ? "opacity-50 cursor-not-allowed" : ""
            } bg-red-600 hover:bg-red-700`}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateControls;

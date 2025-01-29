import React from "react";
import Button from "./Button";
import Select from "./Select";

interface TemplateControlsProps {
  templates: string[];
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
  const templateOptions = [
    { value: "", label: "Select a template" },
    ...templates.map((template) => ({
      value: template,
      label: template,
    })),
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1">
        <Select
          value={selectedTemplate}
          onChange={onTemplateSelect}
          options={templateOptions}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={onSaveNew} className="bg-blue-500 hover:bg-blue-600">
          Save New
        </Button>
        {selectedTemplate && (
          <>
            <Button
              onClick={onUpdate}
              className="bg-green-600 hover:bg-green-700"
            >
              Update
            </Button>
            <Button onClick={onDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateControls;

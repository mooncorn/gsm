import React from "react";
import Modal from "../../../components/ui/Modal";
import FormInput from "../../../components/ui/FormInput";

interface SaveTemplateModalProps {
  isOpen: boolean;
  templateName: string;
  onClose: () => void;
  onSave: () => void;
  onNameChange: (name: string) => void;
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  templateName,
  onClose,
  onSave,
  onNameChange,
}) => {
  return (
    <Modal
      title="Save as Template"
      isOpen={isOpen}
      onClose={() => {
        onClose();
      }}
      onConfirm={onSave}
      confirmText="Save"
      confirmDisabled={!templateName.trim()}
    >
      <FormInput
        value={templateName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Enter template name"
      />
    </Modal>
  );
};

export default SaveTemplateModal;

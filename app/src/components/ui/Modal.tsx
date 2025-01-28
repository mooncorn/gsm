import React from "react";
import Button from "./Button";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  children: React.ReactNode;
  confirmDisabled?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  title,
  isOpen,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  children,
  confirmDisabled = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} className="bg-gray-700 hover:bg-gray-600">
            Cancel
          </Button>
          {onConfirm && (
            <Button
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;

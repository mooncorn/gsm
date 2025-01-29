import React from "react";
import Button from "./Button";

export interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  confirmDisabled?: boolean;
  confirmStyle?: "primary" | "danger";
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Modal({
  title,
  isOpen,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  confirmDisabled = false,
  confirmStyle = "primary",
  isLoading = false,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600"
            disabled={isLoading}
          >
            Cancel
          </Button>
          {onConfirm && (
            <Button
              onClick={onConfirm}
              disabled={confirmDisabled}
              isLoading={isLoading}
              className={
                confirmStyle === "danger"
                  ? "bg-red-500 hover:bg-red-600 disabled:bg-red-800"
                  : "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800"
              }
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

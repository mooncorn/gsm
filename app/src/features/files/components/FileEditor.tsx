import { useState } from "react";
import { FileInfoResponseData } from "../../../api";
import Button from "../../../components/ui/Button";
import { IoArrowBack } from "react-icons/io5";

interface FileEditorProps {
  file: FileInfoResponseData;
  initialContent: string;
  onSave: (content: string) => Promise<boolean>;
  onClose: () => void;
}

export function FileEditor({
  file,
  initialContent,
  onSave,
  onClose,
}: FileEditorProps) {
  const [content, setContent] = useState(initialContent);

  const handleSave = async () => {
    const success = await onSave(content);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={onClose}
          icon={<IoArrowBack className="h-5 w-5" />}
          className="bg-gray-700 hover:bg-gray-600"
        >
          Back to Files
        </Button>
        <h2 className="text-2xl font-bold">Edit {file.name}</h2>
      </div>

      <div className="max-w-4xl">
        <div className="bg-gray-800 rounded-lg p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[60vh] px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none font-mono resize-none"
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={onClose} className="bg-gray-700 hover:bg-gray-600">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

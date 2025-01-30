import React, { useState } from "react";
import { FileInfoResponseData } from "../../api";
import { api } from "../../api";
import Button from "../../components/ui/Button";
import { TbFolderPlus, TbUpload, TbArrowLeft } from "react-icons/tb";
import Breadcrumb from "../../components/ui/Breadcrumb";
import { FileList } from "./components/FileList";
import { FileEditor } from "./components/FileEditor";
import { useFiles } from "./hooks/useFiles";
import Modal from "../../components/ui/Modal";
import FormInput from "../../components/ui/FormInput";
import { useToast } from "../../hooks/useToast";

export function Files() {
  const {
    files,
    currentPath,
    isLoading,
    createDirectory,
    deleteFile,
    uploadFiles,
    readFile,
    writeFile,
    navigateToParent,
    navigateToPath,
  } = useFiles();

  const [selectedFile, setSelectedFile] = useState<FileInfoResponseData | null>(
    null
  );
  const [fileContent, setFileContent] = useState("");
  const [showFileEditor, setShowFileEditor] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileInfoResponseData | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();
  const handleFileClick = async (file: FileInfoResponseData) => {
    if (file.isDir) {
      navigateToPath(file.path);
    } else if (file.isReadable) {
      const content = await readFile(file);
      if (content !== null) {
        setFileContent(content);
        setSelectedFile(file);
        setShowFileEditor(true);
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;

    try {
      setIsCreatingFolder(true);
      const success = await createDirectory(newFolderName);
      if (success) {
        setShowNewFolderDialog(false);
        setNewFolderName("");
      }
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDelete = (file: FileInfoResponseData) => {
    setFileToDelete(file);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      setIsDeleting(true);
      const success = await deleteFile(fileToDelete);
      if (success) {
        setShowDeleteConfirmation(false);
        setFileToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      await uploadFiles(files);
    } catch (error) {
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      // Clear the input value to allow uploading the same file again
      event.target.value = "";
    }
  };

  if (showFileEditor && selectedFile) {
    return (
      <FileEditor
        file={selectedFile}
        initialContent={fileContent}
        onSave={(content) => writeFile(selectedFile.path, content)}
        onClose={() => {
          setShowFileEditor(false);
          setSelectedFile(null);
          setFileContent("");
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-row gap-2 sm:items-center sm:gap-4">
            {currentPath && (
              <Button
                onClick={navigateToParent}
                icon={<TbArrowLeft />}
                className="bg-gray-700 hover:bg-gray-600"
              />
            )}
            <h1 className="text-2xl font-bold">Files</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowNewFolderDialog(true)}
              icon={<TbFolderPlus />}
              className="bg-gray-700 hover:bg-gray-600"
            />
            <div className="flex gap-2">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleUpload}
                multiple
                disabled={isUploading}
              />
              <Button
                onClick={() => document.getElementById("file-upload")?.click()}
                icon={<TbUpload />}
                className="bg-blue-500 hover:bg-blue-600"
                isLoading={isUploading}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Breadcrumb
            root="files"
            path={currentPath}
            onNavigate={navigateToPath}
          />
        </div>
      </div>

      <FileList
        files={files}
        isLoading={isLoading}
        onFileClick={handleFileClick}
        onDownload={(file) => api.files.download(file.path)}
        onDelete={handleDelete}
      />

      {/* New Folder Dialog */}
      <Modal
        title="Create New Folder"
        isOpen={showNewFolderDialog}
        onClose={() => {
          setShowNewFolderDialog(false);
          setNewFolderName("");
        }}
        onConfirm={handleCreateFolder}
        confirmText="Create"
        confirmDisabled={!newFolderName.trim()}
        isLoading={isCreatingFolder}
      >
        <FormInput
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Folder name"
          disabled={isCreatingFolder}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && fileToDelete && (
        <Modal
          title="Confirm Delete"
          isOpen={showDeleteConfirmation}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setFileToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          confirmText="Delete"
          confirmStyle="danger"
          isLoading={isDeleting}
        >
          <p className="mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{fileToDelete.name}</span>?
            {fileToDelete.isDir && (
              <span className="block mt-2 text-red-400">
                Warning: This will delete the folder and all its contents.
              </span>
            )}
          </p>
        </Modal>
      )}

      {/* Create some space to not hide the buttons with menu button on mobile */}
      <div className="h-12 sm:h-0"></div>
    </div>
  );
}

export default Files;

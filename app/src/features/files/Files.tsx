import React, { useState, useEffect, useCallback } from "react";
import { FileInfo } from "../../types/files";
import { toast, Bounce } from "react-toastify";
import Button from "../../components/ui/Button";
import {
  TbFile,
  TbFolder,
  TbDownload,
  TbTrash,
  TbEdit,
  TbFolderPlus,
  TbUpload,
  TbArrowLeft,
} from "react-icons/tb";
import { formatBytes, formatDate } from "../../utils/format";
import { IoArrowBack } from "react-icons/io5";
import { api } from "../../api-client";

// This interface is used in the type assertion for directory upload
interface DirectoryInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "webkitdirectory" | "directory"
  > {
  webkitdirectory?: string;
  directory?: string;
}

const Files: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFileEditor, setShowFileEditor] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.files.list(currentPath);
      setFiles(data || []);
    } catch (err: any) {
      setFiles([]);
      toast.error(err.message || "Failed to fetch files", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileClick = async (file: FileInfo) => {
    if (file.isDir) {
      setCurrentPath(file.path);
    } else if (file.isReadable) {
      try {
        const data = await api.files.getContent(file.path);
        setFileContent(data.content);
        setSelectedFile(file);
        setShowFileEditor(true);
      } catch (err: any) {
        if (err.response?.data?.mime) {
          // This is a binary file
          toast.error(`Cannot edit binary file (${err.response.data.mime})`, {
            position: "bottom-right",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
            transition: Bounce,
          });
        } else {
          toast.error(err.message || "Failed to read file", {
            position: "bottom-right",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
            transition: Bounce,
          });
        }
      }
    }
  };

  const handleNavigateUp = () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    setCurrentPath(parentPath);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;

    try {
      await api.files.createDirectory(
        `${currentPath}/${newFolderName}`.replace(/^\/+/, "")
      );
      setShowNewFolderDialog(false);
      setNewFolderName("");
      fetchFiles();
      toast.success("Folder created successfully", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to create folder", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;

    try {
      await api.files.write(selectedFile.path, fileContent);
      setShowFileEditor(false);
      fetchFiles();
      toast.success("File saved successfully", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save file", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    }
  };

  const handleDelete = async (file: FileInfo) => {
    setFileToDelete(file);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      await api.files.delete(fileToDelete.path);
      fetchFiles();
      toast.success("Deleted successfully", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    } finally {
      setShowDeleteConfirmation(false);
      setFileToDelete(null);
    }
  };

  const handleDownload = async (file: FileInfo) => {
    api.files.download(file.path);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        await api.files.upload(currentPath, file);
      }
      fetchFiles();
      toast.success(
        fileArray.length > 1
          ? "Files uploaded successfully"
          : "File uploaded successfully",
        {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          transition: Bounce,
        }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file(s)", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    }
  };

  if (showFileEditor && selectedFile) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => {
              setShowFileEditor(false);
              setSelectedFile(null);
              setFileContent("");
            }}
            icon={<IoArrowBack className="h-5 w-5" />}
            className="bg-gray-700 hover:bg-gray-600"
          >
            Back to Files
          </Button>
          <h2 className="text-2xl font-bold">Edit {selectedFile.name}</h2>
        </div>

        <div className="max-w-4xl">
          <div className="bg-gray-800 rounded-lg p-4">
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full h-[60vh] px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none font-mono resize-none"
            />

            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => {
                  setShowFileEditor(false);
                  setSelectedFile(null);
                  setFileContent("");
                }}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFile}
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

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {currentPath && (
            <Button
              onClick={handleNavigateUp}
              icon={<TbArrowLeft className="h-5 w-5" />}
              className="bg-gray-700 hover:bg-gray-600"
            />
          )}
          <h1 className="text-2xl font-bold">Files</h1>
          <span className="text-gray-400">{currentPath || "/"}</span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowNewFolderDialog(true)}
            icon={<TbFolderPlus className="h-5 w-5" />}
            className="bg-gray-700 hover:bg-gray-600"
          >
            New Folder
          </Button>
          <div className="flex gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleUpload}
              multiple
            />
            <input
              type="file"
              id="folder-upload"
              className="hidden"
              onChange={handleUpload}
              {...({
                webkitdirectory: "",
                directory: "",
              } as DirectoryInputProps)}
              multiple
            />
            <Button
              onClick={() => document.getElementById("file-upload")?.click()}
              icon={<TbUpload className="h-5 w-5" />}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Upload File
            </Button>
            <Button
              onClick={() => document.getElementById("folder-upload")?.click()}
              icon={<TbFolderPlus className="h-5 w-5" />}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Upload Folder
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Modified
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Permissions
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center">
                    Loading...
                  </td>
                </tr>
              ) : !files || files.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center">
                    No files found
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr
                    key={file.path}
                    className="hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => handleFileClick(file)}
                      >
                        {file.isDir ? (
                          <TbFolder className="text-yellow-400 text-xl" />
                        ) : (
                          <TbFile className="text-blue-400 text-xl" />
                        )}
                        <span>{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {file.isDir ? "--" : formatBytes(file.size)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(new Date(file.modTime))}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {file.permissions}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {file.isReadable && (
                          <Button
                            onClick={() => handleDownload(file)}
                            icon={<TbDownload className="h-4 w-4" />}
                            className="p-1"
                            title={file.isDir ? "Download as ZIP" : "Download"}
                          />
                        )}
                        {!file.isDir && file.isWritable && (
                          <Button
                            onClick={() => handleFileClick(file)}
                            icon={<TbEdit className="h-4 w-4" />}
                            className="p-1"
                            title="Edit"
                          />
                        )}
                        <Button
                          onClick={() => handleDelete(file)}
                          icon={<TbTrash className="h-4 w-4" />}
                          className="p-1 hover:bg-red-500"
                          title="Delete"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Folder</h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
              placeholder="Folder name"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName("");
                }}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && fileToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{fileToDelete.name}</span>?
              {fileToDelete.isDir && (
                <span className="block mt-2 text-red-400">
                  Warning: This will delete the folder and all its contents.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setFileToDelete(null);
                }}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Files;

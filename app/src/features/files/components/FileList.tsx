import { FileInfo } from "../../../api";
import { TbFile, TbFolder, TbDownload, TbTrash, TbEdit } from "react-icons/tb";
import Button from "../../../components/ui/Button";
import { formatBytes, formatDate } from "../../../utils/format";
import FileCard from "./FileCard";

interface FileListProps {
  files: FileInfo[];
  isLoading: boolean;
  onFileClick: (file: FileInfo) => void;
  onDownload: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
}

export function FileList({
  files,
  isLoading,
  onFileClick,
  onDownload,
  onDelete,
}: FileListProps) {
  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!files || files.length === 0) {
    return <div className="text-center py-4">No files found</div>;
  }

  // Mobile View
  const mobileView = (
    <div className="lg:hidden">
      {files.map((file) => (
        <FileCard
          key={file.path}
          file={file}
          onFileClick={onFileClick}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  );

  // Desktop View
  const desktopView = (
    <div className="hidden lg:block">
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
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {files.map((file) => (
                <tr
                  key={file.path}
                  className="hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => onFileClick(file)}
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
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {file.isReadable && (
                        <Button
                          onClick={() => onDownload(file)}
                          icon={<TbDownload className="h-4 w-4" />}
                          className="p-1 hover:text-blue-500"
                          title={file.isDir ? "Download as ZIP" : "Download"}
                        />
                      )}
                      {!file.isDir && file.isWritable && (
                        <Button
                          onClick={() => onFileClick(file)}
                          icon={<TbEdit className="h-4 w-4" />}
                          className="p-1 hover:text-green-500"
                          title="Edit"
                        />
                      )}
                      <Button
                        onClick={() => onDelete(file)}
                        icon={<TbTrash className="h-4 w-4" />}
                        className="p-1 hover:text-red-500"
                        title="Delete"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  );
}

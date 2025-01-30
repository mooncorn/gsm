import { FileInfoResponseData } from "../../../api";
import { TbFile, TbFolder, TbDownload, TbTrash, TbEdit } from "react-icons/tb";
import Button from "../../../components/ui/Button";
import { formatBytes, formatDate } from "../../../utils/format";

interface FileCardProps {
  file: FileInfoResponseData;
  onFileClick: (file: FileInfoResponseData) => void;
  onDownload: (file: FileInfoResponseData) => void;
  onDelete: (file: FileInfoResponseData) => void;
}

export default function FileCard({
  file,
  onFileClick,
  onDownload,
  onDelete,
}: FileCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div
        className="flex items-center gap-2 cursor-pointer mb-2"
        onClick={() => onFileClick(file)}
      >
        {file.isDir ? (
          <TbFolder className="text-yellow-400 text-xl" />
        ) : (
          <TbFile className="text-blue-400 text-xl" />
        )}
        <span className="font-medium">{file.name}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 mb-3">
        <div>
          <span className="block">Size</span>
          <span className="text-white">
            {file.isDir ? "--" : formatBytes(file.size)}
          </span>
        </div>
        <div>
          <span className="block">Modified</span>
          <span className="text-white">
            {formatDate(new Date(file.modTime))}
          </span>
        </div>
      </div>

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
    </div>
  );
}

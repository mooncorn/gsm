import { Image } from "../../../api";
import { formatBytes, formatDate } from "../../../utils/format";
import Button from "../../../components/ui/Button";
import { useUser } from "../../../UserContext";
import { FaTrash } from "react-icons/fa";

interface ImageCardProps {
  image: Image;
  onDelete: (id: string) => void;
  isDeleting: (id: string) => boolean;
}

export function ImageCard({ image, onDelete, isDeleting }: ImageCardProps) {
  const { user } = useUser();
  const [repo, tag] = (image.RepoTags?.[0] || ":").split(":");

  return (
    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-lg font-medium mb-1 break-all">
            {repo || "<none>"}
          </div>
          <div className="text-sm text-gray-400 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Tag:</span>
              <span className="break-all">{tag || "<none>"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">ID:</span>
              <span className="font-mono">
                {image.Id.replace("sha256:", "").substring(0, 12)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Created:</span>
              <span>{formatDate(new Date(image.Created * 1000))}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Size:</span>
              <span>{formatBytes(image.Size)}</span>
            </div>
          </div>
        </div>
        {user?.role === "admin" && (
          <Button
            onClick={() => onDelete(image.Id)}
            className="text-red-600 hover:text-red-300"
            icon={<FaTrash />}
            isLoading={isDeleting(image.Id)}
          />
        )}
      </div>
    </div>
  );
}

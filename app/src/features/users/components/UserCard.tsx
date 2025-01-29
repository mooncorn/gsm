import { AllowedUser } from "../../../api";
import { formatDate } from "../../../utils/format";
import Button from "../../../components/ui/Button";
import { FaTrash } from "react-icons/fa";

interface UserCardProps {
  user: AllowedUser;
  onRemove: (email: string) => void;
  isRemoving: (email: string) => boolean;
}

export function UserCard({ user, onRemove, isRemoving }: UserCardProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500";
      case "mod":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-lg font-medium mb-1 break-all">{user.email}</div>
          <div className="text-sm text-gray-400 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Role:</span>
              <span
                className={`inline-block px-2 py-1 rounded text-xs text-white ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Added:</span>
              <span>{formatDate(new Date(user.CreatedAt))}</span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => onRemove(user.email)}
          className="text-red-600 hover:text-red-300"
          icon={<FaTrash />}
          isLoading={isRemoving(user.email)}
        />
      </div>
    </div>
  );
}

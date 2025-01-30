import { PullProgressResponseData } from "../../../api";
import { formatBytes } from "../../../utils/format";

interface PullProgressProps {
  progress: { [key: string]: PullProgressResponseData };
}

export function PullProgress({ progress }: PullProgressProps) {
  if (Object.keys(progress).length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 bg-gray-800 p-4 rounded-lg">
      <h3 className="font-semibold">Download Progress</h3>
      {Object.entries(progress).map(([id, progress]) => (
        <div key={id} className="text-sm">
          <div className="flex justify-between text-gray-300">
            <span>{id}</span>
            <span>
              {progress.progressDetail
                ? `${formatBytes(
                    progress.progressDetail.current
                  )}/${formatBytes(progress.progressDetail.total)}`
                : ""}
            </span>
          </div>
          {progress.progressDetail && (
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    (progress.progressDetail.current /
                      progress.progressDetail.total) *
                    100
                  }%`,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

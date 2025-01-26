import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { apiUrl } from "../../config/constants";
import { toast, Bounce } from "react-toastify";
import Button from "../../components/ui/Button";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaTrash } from "react-icons/fa";
import { useUser } from "../../UserContext";
import { DockerImage, PullProgress } from "../../types/docker";
import { formatBytes, formatDate } from "../../utils/format";

const DockerImages = () => {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageName, setImageName] = useState("");
  const [pullProgress, setPullProgress] = useState<{ [key: string]: PullProgress }>({});
  const { user } = useUser();
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`${apiUrl}/docker/images`, {
        withCredentials: true,
      });
      setImages(response.data);
    } catch (err) {
      console.error("Failed to fetch images", err);
      toast.error("Failed to fetch images", {
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

  useEffect(() => {
    fetchImages();
  }, []);

  const pullImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageName) return;

    setIsLoading(true);
    setPullProgress({});

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(
        `${apiUrl}/docker/pull?imageName=${encodeURIComponent(imageName)}`,
        { withCredentials: true }
      );

      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        if (event.data === "[EOF]") {
          eventSource.close();
          setIsLoading(false);
          fetchImages();
          setImageName("");
          return;
        }

        try {
          const data = JSON.parse(event.data);
          
          // Check for error messages
          if (data.error) {
            eventSource.close();
            setIsLoading(false);
            setPullProgress({});
            toast.error(data.error, {
              position: "bottom-right",
              autoClose: 5000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
              transition: Bounce,
            });
            return;
          }

          // Show status messages as toasts
          if (data.status && !data.progressDetail) {
            toast.info(data.status, {
              position: "bottom-right",
              autoClose: 2000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
              transition: Bounce,
            });
            return;
          }

          // Only update progress for actual download progress
          if (data.progressDetail?.current !== undefined) {
            setPullProgress((prev) => {
              const newProgress = { ...prev };
              
              // If download is complete, remove it
              if (data.progressDetail.current === data.progressDetail.total) {
                delete newProgress[data.id || "status"];
                return Object.keys(newProgress).length > 0 ? newProgress : {};
              }
              
              // Otherwise update the progress
              return {
                ...newProgress,
                [data.id || "status"]: data,
              };
            });
          }
        } catch (err) {
          console.error("Failed to parse pull progress", err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsLoading(false);
        toast.error("Failed to pull image", {
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
      };
    } catch (err) {
      console.error("Failed to pull image", err);
      setIsLoading(false);
      toast.error("Failed to pull image", {
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

  const deleteImage = async (id: string) => {
    try {
      await axios.delete(`${apiUrl}/docker/images/${id}`, {
        withCredentials: true,
      });
      fetchImages();
      toast.success("Image deleted successfully", {
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
    } catch (err) {
      console.error("Failed to delete image", err);
      toast.error("Failed to delete image", {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold m-2">Images</h2>
        <Button
          onClick={fetchImages}
          icon={<HiOutlineRefresh className={isLoading ? "animate-spin" : ""} />}
          disabled={isLoading}
        />
      </div>

      {user?.role === "admin" && (
        <form onSubmit={pullImage} className="flex gap-2">
          <input
            type="text"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
            placeholder="Image name (e.g. nginx:latest)"
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !imageName}>
            Pull
          </Button>
        </form>
      )}

      {/* Pull Progress */}
      {Object.keys(pullProgress).length > 0 && (
        <div className="space-y-2 bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Download Progress</h3>
            <Button
              onClick={() => setPullProgress({})}
              className="text-gray-400 hover:text-white"
              icon={<span className="text-lg">×</span>}
            />
          </div>
          {Object.entries(pullProgress).map(([id, progress]) => (
            <div key={id} className="text-sm">
              <div className="flex justify-between text-gray-300">
                <span>{id}</span>
                <span>
                  {progress.progressDetail ? 
                    `${formatBytes(progress.progressDetail.current)}/${formatBytes(progress.progressDetail.total)}` : 
                    ''}
                </span>
              </div>
              {progress.progressDetail && (
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{
                      width: `${(progress.progressDetail.current / progress.progressDetail.total) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Images Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Repository
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Tag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Image ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Size
              </th>
              {user?.role === "admin" && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {images.map((image) => {
              const [repo, tag] = (image.RepoTags?.[0] || ":").split(":");
              return (
                <tr key={image.Id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{repo || "<none>"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{tag || "<none>"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    {image.Id.replace("sha256:", "").substring(0, 12)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(new Date(image.Created * 1000))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatBytes(image.Size)}</td>
                  {user?.role === "admin" && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <Button
                        onClick={() => deleteImage(image.Id)}
                        className="bg-red-800 hover:bg-red-700"
                        icon={<FaTrash />}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DockerImages;

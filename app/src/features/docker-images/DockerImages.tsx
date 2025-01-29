import { useState, useEffect, useRef } from "react";
import { toast, Bounce } from "react-toastify";
import Button from "../../components/ui/Button";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaTrash } from "react-icons/fa";
import { useUser } from "../../UserContext";
import { formatBytes, formatDate } from "../../utils/format";
import PageHeader from "../../components/ui/PageHeader";
import FormInput from "../../components/ui/FormInput";
import { api, DockerImage, PullProgress } from "../../api-client";

const DockerImages = () => {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageName, setImageName] = useState("");
  const [pullProgress, setPullProgress] = useState<{
    [key: string]: PullProgress;
  }>({});
  const { user } = useUser();
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchImages = async () => {
    try {
      const data = await api.docker.listImages();
      setImages(data);
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
      eventSourceRef.current = api.docker.pullImage(imageName);

      eventSourceRef.current.onmessage = (event) => {
        if (event.data === "[EOF]") {
          eventSourceRef.current?.close();
          setIsLoading(false);
          fetchImages();
          setImageName("");
          return;
        }

        try {
          const data = JSON.parse(event.data);

          // Check for error messages
          if (data.error) {
            eventSourceRef.current?.close();
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

      eventSourceRef.current.onerror = () => {
        eventSourceRef.current?.close();
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
      await api.docker.removeImage(id);
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

  const renderImageCards = () => {
    return images.map((image) => {
      const [repo, tag] = (image.RepoTags?.[0] || ":").split(":");
      return (
        <div
          key={image.Id}
          className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200"
        >
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
                onClick={() => deleteImage(image.Id)}
                className="bg-red-800 hover:bg-red-700 shrink-0"
                icon={<FaTrash />}
              />
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Images"
        actions={
          <Button
            onClick={fetchImages}
            icon={
              <HiOutlineRefresh className={isLoading ? "animate-spin" : ""} />
            }
            disabled={isLoading}
          />
        }
      />

      {user?.role === "admin" && (
        <div className="w-full">
          <form
            onSubmit={pullImage}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="flex-grow">
              <FormInput
                type="text"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="Image name"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading || !imageName}>
              Pull
            </Button>
          </form>
        </div>
      )}

      {/* Pull Progress */}
      {Object.keys(pullProgress).length > 0 && (
        <div className="space-y-2 bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold">Download Progress</h3>
          {Object.entries(pullProgress).map(([id, progress]) => (
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
      )}

      {/* Image Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {renderImageCards()}
      </div>
    </div>
  );
};

export default DockerImages;

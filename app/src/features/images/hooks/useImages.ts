import { useState, useRef } from "react";
import {
  api,
  ContainerImageResponseData,
  PullProgressResponseData,
} from "../../../api";
import { useToast } from "../../../hooks/useToast";

export function useImages() {
  const toast = useToast();
  const [images, setImages] = useState<ContainerImageResponseData[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());
  const [imageName, setImageName] = useState("");
  const [pullProgress, setPullProgress] = useState<{
    [key: string]: PullProgressResponseData;
  }>({});
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchImages = async () => {
    try {
      setIsFetching(true);
      const data = await api.docker.listImages();
      setImages(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch images");
    } finally {
      setIsFetching(false);
    }
  };

  const pullImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageName) return;

    setIsPulling(true);
    setPullProgress({});

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      eventSourceRef.current = api.docker.pullImage(imageName);

      eventSourceRef.current.onmessage = (event) => {
        if (event.data === "[EOF]") {
          eventSourceRef.current?.close();
          setIsPulling(false);
          fetchImages();
          setImageName("");
          return;
        }

        try {
          const data = JSON.parse(event.data);

          // Check for error messages
          if (data.error) {
            eventSourceRef.current?.close();
            setIsPulling(false);
            setPullProgress({});
            toast.error(data.error);
            return;
          }

          // Show status messages as toasts
          if (data.status && !data.progressDetail) {
            toast.info(data.status);
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
        setIsPulling(false);
        toast.error("Failed to pull image");
      };
    } catch (err: any) {
      console.error("Failed to pull image", err);
      setIsPulling(false);
      toast.error(err.message || "Failed to pull image");
    }
  };

  const deleteImage = async (id: string) => {
    try {
      setDeletingImages((prev) => new Set(prev).add(id));
      await api.docker.removeImage(id);
      await fetchImages();
      toast.success("Image deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete image");
    } finally {
      setDeletingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const isDeleting = (id: string) => deletingImages.has(id);

  return {
    images,
    isFetching,
    isPulling,
    imageName,
    setImageName,
    pullProgress,
    fetchImages,
    pullImage,
    deleteImage,
    isDeleting,
  };
}

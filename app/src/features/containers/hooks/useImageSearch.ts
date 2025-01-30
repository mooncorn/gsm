import { useState, useEffect, useRef, useCallback } from "react";
import { ContainerImageResponseData } from "../../../api";
import { api } from "../../../api";
import { useToast } from "../../../hooks/useToast";

// Cache for storing fetched images
let imageCache: ContainerImageResponseData[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useImageSearch() {
  const [images, setImages] = useState<ContainerImageResponseData[]>([]);
  const [filteredImages, setFilteredImages] = useState<string[]>([]);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imageInputRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const toast = useToast();

  const fetchImages = useCallback(async () => {
    // Check if we have valid cached data
    const now = Date.now();
    if (imageCache && now - lastFetchTime < CACHE_DURATION) {
      setImages(imageCache);
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.docker.listImages();
      imageCache = data;
      lastFetchTime = now;
      setImages(data);
    } catch (err) {
      console.error("Failed to fetch images", err);
      toast.error("Failed to fetch available images");
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        imageInputRef.current &&
        !imageInputRef.current.contains(event.target as Node)
      ) {
        setShowImageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleImageSearch = useCallback(
    (value: string) => {
      // Clear any pending search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (!value.trim()) {
        setFilteredImages([]);
        setShowImageDropdown(false);
        return;
      }

      // Debounce the search to prevent too many state updates
      searchTimeoutRef.current = setTimeout(() => {
        const searchTerm = value.toLowerCase();
        const filtered = images
          .flatMap((img) => img.RepoTags)
          .filter(
            (tag) =>
              tag &&
              tag !== "<none>:<none>" &&
              tag.toLowerCase().includes(searchTerm)
          )
          .slice(0, 10);

        setFilteredImages(filtered);
        setShowImageDropdown(true);
      }, 300);
    },
    [images]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const refreshImages = () => {
    // Force clear cache and refetch
    imageCache = null;
    lastFetchTime = 0;
    fetchImages();
  };

  return {
    filteredImages,
    showImageDropdown,
    setShowImageDropdown,
    imageInputRef,
    handleImageSearch,
    isLoading,
    refreshImages,
  };
}

import { useEffect } from "react";
import { useUser } from "../../UserContext";
import Button from "../../components/ui/Button";
import { HiOutlineRefresh } from "react-icons/hi";
import { LuHardDriveDownload } from "react-icons/lu";
import PageHeader from "../../components/ui/PageHeader";
import FormInput from "../../components/ui/FormInput";
import { useImages } from "./hooks/useImages";
import { ImageCard } from "./components/ImageCard";
import { PullProgress } from "./components/PullProgress";

export default function Images() {
  const { user } = useUser();
  const {
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
  } = useImages();

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Images"
        actions={
          <Button
            onClick={fetchImages}
            icon={<HiOutlineRefresh />}
            isLoading={isFetching}
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
                disabled={isPulling}
              />
            </div>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600"
              disabled={isPulling || !imageName}
              icon={<LuHardDriveDownload />}
              isLoading={isPulling}
            >
              {isPulling ? "Pulling..." : "Pull"}
            </Button>
          </form>
        </div>
      )}

      {/* Pull Progress */}
      <PullProgress progress={pullProgress} />

      {/* Image Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {images.map((image) => (
          <ImageCard
            key={image.Id}
            image={image}
            onDelete={deleteImage}
            isDeleting={isDeleting}
          />
        ))}
      </div>
    </div>
  );
}

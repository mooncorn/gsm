const DockerImages = () => {
  return (
    <div className="">
      <h2 className="text-2xl font-bold mb-4">Images</h2>
      <form className="mb-4">
        <input
          type="text"
          placeholder="Image Name"
          className="bg-gray-800 text-white py-2 px-4 rounded mr-2"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
        >
          Pull
        </button>
      </form>
      <p>List of images with delete actions.</p>
    </div>
  );
};

export default DockerImages;

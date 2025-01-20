const Users = () => {
  return (
    <div className="">
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <form className="mb-4">
        <input
          type="email"
          placeholder="Email"
          className="bg-gray-800 text-white py-2 px-4 rounded mr-2"
        />
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
        >
          Add User
        </button>
      </form>
      <p>List of users with delete actions.</p>
    </div>
  );
};

export default Users;

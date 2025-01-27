import { useState, useEffect } from "react";
import { Bounce, toast } from "react-toastify";
import axios from "axios";
import { apiUrl } from "../../config/constants";
import { formatDate } from "../../utils/format";
import Button from "../../components/ui/Button";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaTrash } from "react-icons/fa";

interface AllowedUser {
  Id: number;
  email: string;
  role: string;
  CreatedAt: string;
  UpdatedAt: string;
}

const Users = () => {
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/users/allowed`, {
        withCredentials: true,
      });
      setUsers(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load users", {
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
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await axios.post(
        `${apiUrl}/users/allowed`,
        { email, role },
        { withCredentials: true }
      );

      toast.success("User added successfully", {
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
      setEmail("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add user", {
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (email: string) => {
    try {
      await axios.delete(
        `${apiUrl}/users/allowed/${encodeURIComponent(email)}`,
        { withCredentials: true }
      );

      toast.success("User removed successfully", {
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
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove user", {
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
      console.error(err);
    }
  };

  const renderUserCards = () => {
    return users.map((user) => (
      <div
        key={user.email}
        className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-lg font-medium mb-1 break-all">
              {user.email}
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Role:</span>
                <span className={`inline-block px-2 py-1 rounded text-xs text-white ${
                  user.role === "admin"
                    ? "bg-red-500"
                    : user.role === "mod"
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}>
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
            onClick={() => handleRemove(user.email)}
            className="bg-red-800 hover:bg-red-700 shrink-0"
            icon={<FaTrash />}
          />
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Manage Users</h2>
        <Button
          onClick={fetchUsers}
          icon={<HiOutlineRefresh className={loading ? "animate-spin" : ""} />}
          disabled={loading}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="flex-1 px-4 py-2 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-4 py-2 pr-8 bg-gray-800 text-gray-100 rounded border border-gray-700 focus:outline-none focus:border-blue-500 appearance-none"
          style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.7rem top 50%", backgroundSize: "0.65rem auto" }}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="mod">Moderator</option>
        </select>
        <Button type="submit" disabled={loading || !email}>
          Add
        </Button>
      </form>

      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No users found
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {renderUserCards()}
        </div>
      )}
    </div>
  );
};

export default Users;

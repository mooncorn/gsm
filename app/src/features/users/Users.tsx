import { useState, useEffect } from "react";
import { Bounce, toast } from "react-toastify";
import { formatDate } from "../../utils/format";
import Button from "../../components/ui/Button";
import { HiOutlineRefresh } from "react-icons/hi";
import { FaTrash } from "react-icons/fa";
import PageHeader from "../../components/ui/PageHeader";
import FormInput from "../../components/ui/FormInput";
import Select from "../../components/ui/Select";
import { api } from "../../api-client";
import { AllowedUser } from "../../api-client/types";

const Users = () => {
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.auth.getAllowedUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users", {
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
      await api.auth.addAllowedUser(email, role);

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
      toast.error(err.message || "Failed to add user", {
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
      await api.auth.removeAllowedUser(email);

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
      toast.error(err.message || "Failed to remove user", {
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Manage Users"
        actions={
          <Button
            onClick={fetchUsers}
            icon={
              <HiOutlineRefresh className={loading ? "animate-spin" : ""} />
            }
            disabled={loading}
          />
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <FormInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="flex-1"
          required
        />
        <Select
          options={[
            { value: "user", label: "User" },
            { value: "admin", label: "Admin" },
            { value: "mod", label: "Moderator" },
          ]}
          value={role}
          onChange={(value) => setRole(value)}
          className="w-full sm:w-auto"
        />
        <Button type="submit" disabled={loading || !email}>
          Add
        </Button>
      </form>

      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No users found</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
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
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs text-white ${
                          user.role === "admin"
                            ? "bg-red-500"
                            : user.role === "mod"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
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
                  onClick={() => handleRemove(user.email)}
                  className="bg-red-800 hover:bg-red-700 shrink-0"
                  icon={<FaTrash />}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;

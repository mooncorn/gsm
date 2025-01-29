import React, { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { HiOutlineRefresh } from "react-icons/hi";
import PageHeader from "../../components/ui/PageHeader";
import FormInput from "../../components/ui/FormInput";
import Select from "../../components/ui/Select";
import { useUsers } from "./hooks/useUsers";
import { UserCard } from "./components/UserCard";
import { IoMdPersonAdd } from "react-icons/io";

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "mod", label: "Moderator" },
];

export default function Users() {
  const {
    users,
    isFetching,
    isAdding,
    fetchUsers,
    addUser,
    removeUser,
    isRemoving,
  } = useUsers();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const success = await addUser(email, role);
    if (success) {
      setEmail("");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Manage Users"
        actions={
          <Button
            onClick={fetchUsers}
            icon={<HiOutlineRefresh />}
            isLoading={isFetching}
          />
        }
      />

      <div className="w-full">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="flex-grow">
            <FormInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="flex"
              required
              disabled={isAdding}
            />
          </div>
          <Select
            options={ROLE_OPTIONS}
            value={role}
            onChange={(value) => setRole(value)}
            className="w-full sm:w-auto"
            disabled={isAdding}
          />
          <Button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600"
            disabled={isAdding || !email}
            icon={<IoMdPersonAdd />}
            isLoading={isAdding}
          >
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </form>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No users found</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <UserCard
              key={user.email}
              user={user}
              onRemove={removeUser}
              isRemoving={isRemoving}
            />
          ))}
        </div>
      )}
    </div>
  );
}

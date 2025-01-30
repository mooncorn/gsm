import { useState } from "react";
import { api, AllowedUserResponseData } from "../../../api";
import { useToast } from "../../../hooks/useToast";

export function useUsers() {
  const toast = useToast();
  const [users, setUsers] = useState<AllowedUserResponseData[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [removingUsers, setRemovingUsers] = useState<Set<string>>(new Set());

  const fetchUsers = async () => {
    try {
      setIsFetching(true);
      const data = await api.auth.getAllowedUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setIsFetching(false);
    }
  };

  const addUser = async (email: string, role: string) => {
    if (!email) return false;

    try {
      setIsAdding(true);
      await api.auth.addAllowedUser(email, role);
      toast.success("User added successfully");
      await fetchUsers();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to add user");
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const removeUser = async (email: string) => {
    try {
      setRemovingUsers((prev) => new Set(prev).add(email));
      await api.auth.removeAllowedUser(email);
      await fetchUsers();
      toast.success("User removed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove user");
    } finally {
      setRemovingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(email);
        return newSet;
      });
    }
  };

  const isRemoving = (email: string) => removingUsers.has(email);

  return {
    users,
    isFetching,
    isAdding,
    fetchUsers,
    addUser,
    removeUser,
    isRemoving,
  };
}

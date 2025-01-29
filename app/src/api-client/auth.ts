import { apiClient } from "./config";
import { User, AllowedUser } from "./types";

export const authApi = {
  getCurrentUser: async () => {
    const response = await apiClient.get<User>("/user");
    return response.data;
  },

  signOut: async () => {
    await apiClient.post("/auth/signout");
  },

  getAllowedUsers: async () => {
    const response = await apiClient.get<AllowedUser[]>("/users/allowed");
    return response.data;
  },

  addAllowedUser: async (email: string, role: string) => {
    await apiClient.post("/users/allowed", { email, role });
  },

  removeAllowedUser: async (email: string) => {
    await apiClient.delete(`/users/allowed/${encodeURIComponent(email)}`);
  },
};

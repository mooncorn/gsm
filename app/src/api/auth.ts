import { apiClient } from "./config";
import { UserResponseData, AllowedUserResponseData } from "./types";

export const authApi = {
  getCurrentUser: async () => {
    const response = await apiClient.get<UserResponseData>("/auth/");
    return response.data;
  },

  getAllowedUsers: async () => {
    const response = await apiClient.get<AllowedUserResponseData[]>("/users/");
    return response.data;
  },

  addAllowedUser: async (email: string, role: string) => {
    await apiClient.post("/users/", { email, role });
  },

  removeAllowedUser: async (email: string) => {
    await apiClient.delete(`/users/${encodeURIComponent(email)}`);
  },
};

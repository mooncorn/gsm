import { apiClient } from "./config";
import { UserResponseData, AllowedUserResponseData } from "./types";

export const authApi = {
  getCurrentUser: async () => {
    const response = await apiClient.get<UserResponseData>("/user");
    return response.data;
  },

  getAllowedUsers: async () => {
    const response = await apiClient.get<AllowedUserResponseData[]>(
      "/users/allowed"
    );
    return response.data;
  },

  addAllowedUser: async (email: string, role: string) => {
    await apiClient.post("/users/allowed", { email, role });
  },

  removeAllowedUser: async (email: string) => {
    await apiClient.delete(`/users/allowed/${encodeURIComponent(email)}`);
  },
};

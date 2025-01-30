import { UserResponseData } from "../api";

export interface UserContextType {
  user: UserResponseData | null;
  setUser: React.Dispatch<React.SetStateAction<UserResponseData | null>>;
}

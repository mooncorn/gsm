export interface User {
  email: string;
  role: string;
  picture?: string;
}

export interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
} 
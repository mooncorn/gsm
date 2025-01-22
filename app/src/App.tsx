import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React, { useEffect, useState } from "react";
import Login from "./SignIn";
import { ToastContainer } from "react-toastify";
import axios from "axios";
import Dashboard from "./Dashboard";

export const apiUrl = import.meta.env.VITE_API_URL;

export interface User {
  email: string;
  role: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${apiUrl}/user`, {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (err: any) {
      setUser(null);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {!user ? <Login /> : <Dashboard user={user} />}
      <ToastContainer />
    </>
  );
};

export default App;

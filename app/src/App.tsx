import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import SignIn from "./features/auth/SignIn";
import { ToastContainer } from "react-toastify";
import Dashboard from "./features/dashboard/Dashboard";
import { UserProvider, useUser } from "./UserContext";

export const apiUrl = import.meta.env.VITE_API_URL;

const AppContent: React.FC = () => {
  const { user } = useUser();

  return (
    <div>
      {!user ? <SignIn /> : <Dashboard />}
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </BrowserRouter>
  );
};

export default App;

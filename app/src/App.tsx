import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import Login from "./SignIn";
import { ToastContainer } from "react-toastify";
import Dashboard from "./Dashboard";
import { UserProvider, useUser } from "./UserContext";

export const apiUrl = import.meta.env.VITE_API_URL;

const AppContent: React.FC = () => {
  const { user } = useUser();

  return (
    <>
      {!user ? <Login /> : <Dashboard user={user} />}
      <ToastContainer />
    </>
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default App;

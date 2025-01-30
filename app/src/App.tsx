import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignIn from "./features/auth/SignIn";
import { ToastContainer } from "react-toastify";
import { UserProvider, useUser } from "./UserContext";
import Files from "./features/files/Files";
import ContainerList from "./features/containers/ContainerList";
import Container from "./features/containers/Container";
import CreateContainer from "./features/containers/CreateContainer";
import Images from "./features/images/Images";
import Users from "./features/users/Users";
import DashboardLayout from "./components/layouts/DashboardLayout";
import EditContainer from "./features/containers/EditContainer";
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/signin" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <UserProvider>
        <div className="page-container">
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route
              element={
                <RequireAuth>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Navigate to="/containers" replace />} />
              <Route path="/containers" element={<ContainerList />} />
              <Route path="/containers/:id" element={<Container />} />
              <Route path="/containers/create" element={<CreateContainer />} />
              <Route path="/containers/:id/edit" element={<EditContainer />} />
              <Route path="/images" element={<Images />} />
              <Route path="/files" element={<Files />} />
              <Route path="/users" element={<Users />} />
            </Route>
          </Routes>
        </div>
      </UserProvider>
      <ToastContainer />
    </Router>
  );
};

export default App;

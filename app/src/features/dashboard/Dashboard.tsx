import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ContainerList from "../containers/ContainerList";
import Container from "../containers/Container";
import CreateContainer from "../containers/CreateContainer";
import DockerImages from "../docker-images/DockerImages";
import Users from "../users/Users";
import { useUser } from "../../UserContext";

const Dashboard = () => {
  const { user } = useUser();

  if (!user) return null;

  return (
    <DashboardLayout>
      <Routes>
        <Route path="containers" element={<ContainerList />} />
        <Route path="containers/create" element={<CreateContainer />} />
        <Route path="containers/:id" element={<Container />} />
        <Route path="images" element={<DockerImages />} />
        <Route path="users" element={<Users />} />
        <Route path="/" element={<Navigate to="containers" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;

import { useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { TbBox, TbPhoto, TbUsers } from "react-icons/tb";
import Header from "../../components/ui/Header";
import ContainerList from "../containers/ContainerList";
import Container from "../containers/Container";
import DockerImages from "../docker-images/DockerImages";
import Users from "../users/Users";
import { useUser } from "../../UserContext";

const Dashboard = () => {
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: "containers", label: "Containers", icon: <TbBox className="text-xl" /> },
    { path: "images", label: "Images", icon: <TbPhoto className="text-xl" /> },
    { path: "users", label: "Users", icon: <TbUsers className="text-xl" /> },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header className="sticky top-0 z-50" />
      
      <div className="flex">
        {/* Mobile menu button */}
        <button
          className="lg:hidden fixed bottom-4 right-4 z-50 bg-gray-700 p-3 rounded-full shadow-lg"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Vertical Menu */}
        <aside className={`
          fixed lg:static lg:block
          w-64 h-[calc(100vh-57px)] 
          bg-gray-800 border-r border-gray-700
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          z-40
        `}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }: { isActive: boolean }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="w-full p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="containers" element={<ContainerList />} />
              <Route path="containers/:id" element={<Container />} />
              <Route path="images" element={<DockerImages />} />
              <Route path="users" element={<Users />} />
              <Route path="/" element={<Navigate to="containers" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

import { TbCubeSpark } from "react-icons/tb";
import { apiUrl, User } from "./App";
import { PiSignOutBold } from "react-icons/pi";
import Button from "./Button";

interface HeaderProps {
  user: User;
}

const Header = ({ user }: HeaderProps) => {
  const handleSignOut = () => {
    window.location.href = `${apiUrl}/signout`; // Redirect to backend login
  };

  const getRoleColor = () => {
    switch (user.role) {
      case "admin":
        return "text-red-500";
      case "user":
        return "text-green-500";
      case "mod":
        return "text-sky-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="border-b border-gray-700">
      <nav className="p-3 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <TbCubeSpark className="text-2xl" />
          <span className="text-xl font-bold">GSHUB</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`underline ${getRoleColor()} `}>{user.email}</span>
          <Button onClick={handleSignOut} icon={<PiSignOutBold />} />
        </div>
      </nav>
    </div>
  );
};

export default Header;

import { TbCubeSpark } from "react-icons/tb";
import { User } from "./App";

interface HeaderProps {
  user: User;
}

const Header = ({ user }: HeaderProps) => {
  return (
    <div className="border-b border-gray-700">
      <nav className="p-3 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <TbCubeSpark className="text-2xl" />
          <span className="text-xl font-bold">GSHUB</span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            Signed in as <span className="underline">{user.email}</span>
          </span>
          <button
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={() => console.log("Sign out clicked")}
          >
            Sign Out
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Header;

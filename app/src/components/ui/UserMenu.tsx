import { useState, useRef, useEffect } from 'react';
import { apiUrl } from '../../config/constants';
import { useUser } from '../../UserContext';
import { IoLogOutOutline } from 'react-icons/io5';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    window.location.href = `${apiUrl}/signout`;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-gray-700 hover:border-gray-500 transition-colors"
      >
        {user?.picture ? (
          <img src={user.picture} alt={user.email} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-700">
            <p className="text-sm text-gray-300 truncate">{user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <IoLogOutOutline className="text-lg" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu; 
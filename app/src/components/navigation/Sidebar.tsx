import React from 'react';
import { NavLink } from 'react-router-dom';
import { TbBox, TbCloud, TbUsers, TbFolder } from 'react-icons/tb';
import { navigationItems } from '../../config/constants';
import SystemResources from '../ui/SystemResources';

const iconComponents = {
  TbBox,
  TbCloud,
  TbUsers,
  TbFolder,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative
          top-0 left-0
          sidebar
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          z-40
        `}
      >
        <div className="flex flex-col h-full">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = iconComponents[item.icon as keyof typeof iconComponents];
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
                  }
                  onClick={onClose}
                >
                  <IconComponent className="text-xl" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <SystemResources />
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 
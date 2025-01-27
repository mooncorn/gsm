import React, { ReactNode, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../navigation/Sidebar';
import Header from '../ui/Header';
import { TbMenu2 } from 'react-icons/tb';

interface DashboardLayoutProps {
  children?: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <Header className="flex-none" />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto nice-scrollbar">
          <div className="max-w-6xl mx-auto p-4 lg:p-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile menu button */}
        <button
          className="lg:hidden fixed bottom-4 right-4 z-50 bg-gray-700 p-3 rounded-full shadow-lg"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <TbMenu2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default DashboardLayout; 
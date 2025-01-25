interface NavbarProps {
  tabs: string[];
  onTabChange: (tab: string, i: number) => void;
  activeTab: number;
}

const Navbar = ({ tabs, activeTab, onTabChange }: NavbarProps) => {
  return (
    <nav className="p-2 flex justify-start gap-4 max-w-6xl mx-auto">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          className={`px-3 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 ${
            activeTab === i ? "bg-gray-700" : ""
          }`}
          onClick={() => onTabChange(tab, i)}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;

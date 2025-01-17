import { useState } from "react";
import { User } from "./App";
import Header from "./Header";
import Navbar from "./Navbar";
import Containers from "./Containers";
import Images from "./Images";
import Users from "./Users";

interface UserProps {
  user: User;
}

const Dashboard = ({ user }: UserProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [tabRenderKey, setTabRenderKey] = useState(0);
  const tabs = ["Containers"];

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setTabRenderKey(Math.random()); // Update render key on tab change
  };

  const displayTabContent = () => {
    switch (activeTab) {
      case 0:
        return <Containers key={`containers-${tabRenderKey}`} />;
      case 1:
        return <Images key={`images-${tabRenderKey}`} />;
      case 2:
        return <Users key={`users-${tabRenderKey}`} />;
      default:
        return <div>Invalid tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header user={user} />

      <div className="bg-gray-800 border-b border-gray-700">
        <Navbar
          activeTab={activeTab}
          onTabChange={(_, i) => handleTabChange(i)}
          tabs={tabs}
        />
      </div>

      <div className="flex h-full p-4 max-w-6xl mx-auto">
        {displayTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;

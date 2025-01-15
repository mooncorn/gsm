import React, { useState } from "react";
import { User } from "./App";
import { TbCubeSpark } from "react-icons/tb";

interface UserProps {
  user: User;
}

const Dashboard = ({ user }: UserProps) => {
  const [activeTab, setActiveTab] = useState("Containers");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* First Navbar */}
      <div className="border-b border-gray-700">
        <nav className="p-3 flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <TbCubeSpark className="text-2xl" />
            <span className="text-xl font-bold">GSHUB</span>
          </div>
          <div className="flex items-center gap-4">
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

      {/* Second Navbar */}
      <div className="bg-gray-800 border-b border-gray-700">
        <nav className="p-2 flex justify-start gap-4 max-w-6xl mx-auto">
          {["Containers", "Images", "Users"].map((tab) => (
            <button
              key={tab}
              className={`px-3 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 ${
                activeTab === tab ? "bg-gray-700" : ""
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex h-full p-4 max-w-6xl mx-auto">
        {activeTab === "Containers" && (
          <div className="">
            <h2 className="text-2xl font-bold mb-4">Containers</h2>
            <p>List of containers with Start, Stop, Restart actions.</p>
            <p>Select a container to view logs and actions.</p>
          </div>
        )}

        {activeTab === "Images" && (
          <div className="">
            <h2 className="text-2xl font-bold mb-4">Images</h2>
            <form className="mb-4">
              <input
                type="text"
                placeholder="Image Name"
                className="bg-gray-800 text-white py-2 px-4 rounded mr-2"
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
              >
                Pull
              </button>
            </form>
            <p>List of images with delete actions.</p>
          </div>
        )}

        {activeTab === "Users" && (
          <div className="">
            <h2 className="text-2xl font-bold mb-4">Users</h2>
            <form className="mb-4">
              <input
                type="email"
                placeholder="Email"
                className="bg-gray-800 text-white py-2 px-4 rounded mr-2"
              />
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
              >
                Add User
              </button>
            </form>
            <p>List of users with delete actions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

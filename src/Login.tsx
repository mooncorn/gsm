import React from "react";
import { TbCubeSpark } from "react-icons/tb";

const apiUrl = import.meta.env.VITE_API_URL;

const Login: React.FC = () => {
  const handleLogin = () => {
    window.location.href = `${apiUrl}/login`; // Redirect to backend login
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white flex flex-col py-10 px-5 overflow-hidden">
      <TbCubeSpark
        className="absolute top-10 left-1/2 transform -translate-x-1/2 md:top-1/2 md:-translate-y-1/2 opacity-10"
        style={{ fontSize: "50vw" }}
      />

      <div className="flex-grow flex items-center">
        <div className="relative p-6 rounded-lg">
          <h1 className="flex gap-2 text-6xl font-bold mb-2">GSHUB</h1>
          <p className="text-xl text-gray-300 mb-6">
            You have to sign in to access the dashboard.
          </p>
          <button
            onClick={handleLogin}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

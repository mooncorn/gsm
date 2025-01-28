import React from "react";
import { TbCubeSpark } from "react-icons/tb";
import { apiUrl } from "../../config/constants";

const SignIn: React.FC = () => {
  const handleSignIn = () => {
    window.location.href = `${apiUrl}/signin`;
  };

  return (
    <div className="page-container py-10 px-5">
      <TbCubeSpark
        className="absolute top-10 left-1/2 transform -translate-x-1/2 md:top-1/2 md:-translate-y-1/2 opacity-10 transition-all duration-500"
        style={{ fontSize: "min(50vw, 600px)" }}
      />

      <div className="flex-grow flex items-center">
        <div className="relative p-6 rounded-lg">
          <h1 className="flex gap-2 text-4xl md:text-6xl font-bold mb-2">
            GSHUB
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-6">
            You have to sign in to access the dashboard.
          </p>
          <button
            onClick={handleSignIn}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                     transition duration-200"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

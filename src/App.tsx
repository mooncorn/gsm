/** @format */

import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    window.location.href = "http://localhost:8080/login"; // Redirect to backend login
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:8080/user", {
        withCredentials: true, // Include cookies with the request
      });
      setUser(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch user");
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      fetchUser();
    }
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>User Authentication</h1>

      {!user ? (
        <div>
          <p>Please log in to access your account.</p>
          <button onClick={handleLogin} style={{ padding: "0.5rem 1rem" }}>
            Log In with Google
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      ) : (
        <div>
          <h2>Welcome, {user.email}!</h2>
          <p>Role: {user.role}</p>
          <button
            onClick={() => {
              Cookies.remove("token"); // Clear token
              setUser(null);
            }}
            style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default App;

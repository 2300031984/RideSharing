import axios from "axios";

const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8081";

// 🔹 Login (role-aware)
const login = (role, email, password) => {
  const payload = {
    email: email.trim(),
    password: password.trim(),
    role: role,
  };

  const url = role === "Driver"
    ? `${API_URL}/api/drivers/login`
    : `${API_URL}/api/riders/login`;

  return axios.post(url, payload, { 
    headers: { "Content-Type": "application/json" },
    timeout: 10000
  });
};

// 🔹 Signup (rider)
const signup = (userData) => {
  // Default to User role on signup unless provided
  const body = { role: "User", ...userData };
  return axios.post(`${API_URL}/api/riders/signup`, body, { headers: { "Content-Type": "application/json" } });
};

// 🔹 Driver registration (optional helper)
const driverSignup = (driverData) => {
  const body = {
    role: "Driver",
    email: (driverData.email || "").toLowerCase(),
    name: driverData.name || driverData.username || "",
    password: driverData.password,
    licenseNumber: driverData.licenseNumber || driverData.license_number || "",
    phoneNumber: driverData.phoneNumber || driverData.phone || "",
  };
  return axios.post(`${API_URL}/api/drivers/register`, body, { headers: { "Content-Type": "application/json" } });
};

// 🔹 Logout
const logout = () => {
  localStorage.removeItem("user");
};

// 🔹 Get current user from localStorage
const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

export default {
  login,
  signup,
  driverSignup,
  logout,
  getCurrentUser
};

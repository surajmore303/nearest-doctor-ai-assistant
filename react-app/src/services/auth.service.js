import axios from "axios";
import API_BASE_URL from "../api-config";

const API_URL = `${API_BASE_URL}/api/auth/`;

// Each role gets its own localStorage key so both can be active simultaneously
const storageKey = (role) => role ? `user_${role}` : "user_unknown";

const saveUser = (data) => {
  const role = data.role || "";
  localStorage.setItem(storageKey(role), JSON.stringify(data));
  // Also keep a generic "last_user" for backward compat with any code reading "user"
  localStorage.setItem("user", JSON.stringify(data));
};

const register = (username, email, password, birthdate, firstname, lastname, phone, role) => {
  return axios.post(API_URL + "signup", { username, email, password, birthdate, firstname, lastname, phone, role });
};

const login = (username, password) => {
  return axios.post(API_URL + "signin", { username, password }).then((response) => {
    if (response.data.accessToken) saveUser(response.data);
    return response.data;
  });
};

const loginlinkedin = (email) => {
  return axios.post(API_URL + "signinlinkedin", { email }).then((response) => {
    if (response.data.accessToken) saveUser(response.data);
    return response.data;
  });
};

const loginface = (username) => {
  return axios.post(API_URL + "signinface", { username }).then((response) => {
    if (response.data.accessToken) saveUser(response.data);
    return response.data;
  });
};

// Logout only the specified role, or all if no role given
const logout = (role) => {
  if (role) {
    localStorage.removeItem(storageKey(role));
  } else {
    localStorage.removeItem("user_patient");
    localStorage.removeItem("user_doctor");
    localStorage.removeItem("user_admin");
  }
  localStorage.removeItem("user");
  localStorage.removeItem("role");
};

// Returns the currently active user for the current browser tab context.
// Checks role-specific keys first, falls back to generic "user".
const getCurrentUser = () => {
  try {
    // Try role-specific keys first (supports simultaneous sessions)
    for (const role of ["patient", "doctor", "admin"]) {
      const stored = localStorage.getItem(storageKey(role));
      if (stored) {
        const parsed = JSON.parse(stored);
        // Return the one whose role matches the current page context
        const path = window.location.pathname;
        if (path.startsWith("/doctor") && role === "doctor") return parsed;
        if (path.startsWith("/patient") && role === "patient") return parsed;
        if (path.startsWith("/admin") && role === "admin") return parsed;
      }
    }
    // Fallback: return whichever role-specific user exists
    for (const role of ["patient", "doctor", "admin"]) {
      const stored = localStorage.getItem(storageKey(role));
      if (stored) return JSON.parse(stored);
    }
    // Final fallback to generic key
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const getUserByRole = (role) => {
  try {
    const stored = localStorage.getItem(storageKey(role));
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const verifyUser = (code) => {
  return axios.get(API_URL + "confirm/" + code).then((response) => response.data);
};

const forgotPass = (email) => {
  return axios.post(API_URL + "forgot", { email });
};

const AuthService = { register, login, logout, getCurrentUser, getUserByRole, verifyUser, forgotPass, loginlinkedin, loginface };

export default AuthService;

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthContextType } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE_URL = "http://localhost:3000";

type ApiUser = Partial<User> & {
  fullName?: string;
  full_name?: string;
};

const normalizeApiRole = (role?: string): User["role"] => {
  if (role === "cashier") return "manager";
  if (
    role === "owner" ||
    role === "manager" ||
    role === "trainer" ||
    role === "member"
  ) {
    return role;
  }

  return "member";
};

const requestJson = async <T,>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `Request failed with ${response.status}`);
  }

  return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
};

const mapApiUser = (apiUser: ApiUser): User => ({
  id: String(apiUser.id ?? ""),
  email: apiUser.email ?? "",
  name: apiUser.name ?? apiUser.fullName ?? apiUser.full_name ?? "",
  role: normalizeApiRole(apiUser.role),
  avatar:
    apiUser.avatar ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      apiUser.email ?? apiUser.name ?? "user",
    )}`,
  createdAt: apiUser.createdAt ?? new Date().toISOString(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("gym_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as User;
      const normalizedUser = {
        ...parsedUser,
        role: normalizeApiRole(parsedUser.role),
      };
      setUser(normalizedUser);
      localStorage.setItem("gym_user", JSON.stringify(normalizedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const apiUser = await requestJson<ApiUser>("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const loggedInUser = mapApiUser(apiUser);
    setUser(loggedInUser);
    localStorage.setItem("gym_user", JSON.stringify(loggedInUser));
    return loggedInUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("gym_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

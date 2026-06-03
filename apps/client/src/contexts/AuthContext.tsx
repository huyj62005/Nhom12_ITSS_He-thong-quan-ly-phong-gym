import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthContextType } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "1",
    email: "admin@gym.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    email: "manager@gym.com",
    password: "manager123",
    name: "Manager User",
    role: "manager",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=manager",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    email: "cashier@gym.com",
    password: "cashier123",
    name: "Cashier User",
    role: "cashier",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=cashier",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    email: "trainer@gym.com",
    password: "trainer123",
    name: "Trainer User",
    role: "trainer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=trainer",
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    email: "member@gym.com",
    password: "member123",
    name: "Member User",
    role: "member",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=member",
    createdAt: new Date().toISOString(),
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("gym_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const foundUser = MOCK_USERS.find(
      (u) => u.email === email && u.password === password,
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem("gym_user", JSON.stringify(userWithoutPassword));
    } else {
      throw new Error("Invalid credentials");
    }
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

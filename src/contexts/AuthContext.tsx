"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get user data if token exists
  const {
    data: user,
    isLoading: isUserLoading,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  useEffect(() => {
    // Load token from localStorage on mount
    const storedToken = localStorage.getItem("auth-token");
    if (storedToken) {
      setToken(storedToken);
    }
    setIsInitialized(true);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    setToken(result.token);
    localStorage.setItem("auth-token", result.token);
    refetch();
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await registerMutation.mutateAsync({
      name,
      email,
      password,
    });
    setToken(result.token);
    localStorage.setItem("auth-token", result.token);
    refetch();
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("auth-token");
  };

  const isLoading = !isInitialized || (!!token && isUserLoading);

  const value: AuthContextType = {
    user: user ? { ...user, createdAt: new Date(user.createdAt) } : null,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

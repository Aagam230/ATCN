"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { login as apiLogin, register as apiRegister, setToken, clearToken, getToken } from "@/lib/api";

interface User {
  id:    number;
  name:  string;
  email: string;
}

interface AuthContextValue {
  user:     User | null;
  isLoading: boolean;
  login:    (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout:   () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from stored token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      // Decode the JWT payload (no signature verification — just read sub/name/email)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          // Token still valid — restore a minimal user object.
          // Full user data is fetched from the API on next load if needed.
          setUser({ id: Number(payload.sub), name: "", email: "" });
        } else {
          clearToken();
        }
      } catch {
        clearToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setToken(result.access_token);
    setUser({ id: result.user_id, name: result.name, email: result.email });
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    await apiRegister(email, name, password);
    // Auto-login after register
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

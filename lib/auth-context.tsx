/**
 * lib/auth-context.tsx – React Context for session-based auth state.
 * Reads the token from localStorage, validates via Convex query,
 * and exposes user info + helpers throughout the app.
 */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SESSION_TOKEN_KEY } from "@/lib/utils";

export interface AuthUser {
  userId: string;
  campusId: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Internal component that validates the token via Convex */
function TokenValidator({
  token,
  onResult,
}: {
  token: string;
  onResult: (user: AuthUser | null) => void;
}) {
  const result = useQuery(api.auth.validateSession, { token });

  useEffect(() => {
    if (result === undefined) return; // still loading
    if (result === null) {
      onResult(null);
    } else {
      onResult(result as AuthUser);
    }
  }, [result, onResult]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_TOKEN_KEY);
    setTokenState(stored);
    if (!stored) {
      setIsLoading(false);
    }
  }, []);

  const handleResult = useCallback((resolved: AuthUser | null) => {
    setUser(resolved);
    setIsLoading(false);
  }, []);

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem(SESSION_TOKEN_KEY, newToken);
      setIsLoading(true);
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin: user?.role === "admin",
        setToken,
        logout,
      }}
    >
      {/* Validate token if we have one */}
      {token && <TokenValidator token={token} onResult={handleResult} />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

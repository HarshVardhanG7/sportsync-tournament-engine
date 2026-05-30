import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiErrorMessage, SESSION_EXPIRED_EVENT, setAccessToken } from "../services/api";
import * as authService from "../services/auth";
import type { AuthResponse, User } from "../types/auth";

const ACCESS_TOKEN_KEY = "sportsync.accessToken";
const REFRESH_TOKEN_KEY = "sportsync.refreshToken";
const USER_KEY = "sportsync.user";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: authService.LoginPayload) => Promise<void>;
  register: (payload: authService.RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setTokenState] = useState<string | null>(() =>
    localStorage.getItem(ACCESS_TOKEN_KEY),
  );
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [isInitializing, setIsInitializing] = useState(true);

  const persistSession = useCallback((session: AuthResponse) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setAccessToken(session.accessToken);
    setTokenState(session.accessToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (!accessToken) {
        setIsInitializing(false);
        return;
      }

      setAccessToken(accessToken);

      try {
        const currentUser = await authService.getMe();
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        setUser(currentUser);
      } catch {
        clearSession();
      } finally {
        setIsInitializing(false);
      }
    }

    void bootstrap();
  }, [accessToken, clearSession]);

  useEffect(() => {
    function handleSessionExpired() {
      clearSession();
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [clearSession]);

  const login = useCallback(
    async (payload: authService.LoginPayload) => {
      const session = await authService.login(payload);
      persistSession(session);
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: authService.RegisterPayload) => {
      const session = await authService.register(payload);
      persistSession(session);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.warn(getApiErrorMessage(error));
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isInitializing,
      login,
      register,
      logout,
    }),
    [accessToken, isInitializing, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

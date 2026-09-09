// Telegram WebApp Authentication Client Service
import { User } from "../types";

export interface TelegramUserUnsafe {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: TelegramUserUnsafe;
          auth_date?: string;
          hash?: string;
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        colorScheme?: "light" | "dark";
        themeParams?: Record<string, string>;
        isExpanded?: boolean;
        viewportHeight?: number;
        viewportStableHeight?: number;
        headerColor?: string;
        backgroundColor?: string;
        enableClosingConfirmation?: () => void;
      };
    };
  }
}

const TOKEN_KEY = "dastyorchi_session_token";

export function getTelegramWebApp() {
  if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function isTelegramWebAppEnvironment(): boolean {
  const tg = getTelegramWebApp();
  return Boolean(tg && tg.initData && tg.initData.length > 0);
}

export function getTelegramUnsafeUser(): TelegramUserUnsafe | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

export async function authenticateWithTelegramInitData(initData: string): Promise<{ user: User; token: string }> {
  const response = await fetch("/api/auth/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Telegram orqali avtorizatsiya amalga oshmadi");
  }

  const data = await response.json();
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  return data;
}

export async function verifyStoredSession(): Promise<User | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const response = await fetch("/api/auth/session", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (err) {
    console.warn("Session check network warning:", err);
    return null;
  }
}

export async function devLoginBypass(): Promise<{ user: User; token: string }> {
  const response = await fetch("/api/auth/dev-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Dev login muvaffaqiyatsiz bo'ldi");
  }

  const data = await response.json();
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  return data;
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
}

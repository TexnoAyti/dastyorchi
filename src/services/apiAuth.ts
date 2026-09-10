/**
 * Dastyorchi Canonical API Authentication & Token Manager
 * Ensures valid token selection and automatic Telegram session recovery.
 */
import { auth } from "../firebase";

const TOKEN_KEY = "dastyorchi_session_token";

export interface SessionTokenPayload {
  uid: string;
  telegramId?: number;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Safely parses the JSON payload from a 2-part Dastyorchi HMAC session token.
 */
export function parseSessionToken(token: string | null): SessionTokenPayload | null {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 2 || !parts[0]) return null;

    // Base64url decode
    const base64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const jsonStr = atob(padded);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Validates if the Dastyorchi session token is well-formed and unexpired.
 * Includes a 15-second grace buffer against premature clock skew.
 */
export function isSessionTokenValid(token: string | null): boolean {
  if (!token) return false;
  const payload = parseSessionToken(token);
  if (!payload || !payload.uid) return false;

  if (payload.exp && typeof payload.exp === "number") {
    const nowSec = Math.floor(Date.now() / 1000);
    // If expired or expiring within 15 seconds, treat as expired
    if (payload.exp <= nowSec + 15) {
      return false;
    }
  }

  return true;
}

/**
 * Attempts a silent Telegram re-authentication using window.Telegram.WebApp.initData.
 * Returns the fresh session token on success, or null on failure.
 */
export async function silentTelegramReauth(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const tg = window.Telegram?.WebApp;
  const initData = tg?.initData;

  if (!initData || initData.trim().length === 0) {
    console.log("[TelegramAuth] Silent reauth skipped: Telegram.WebApp.initData is empty");
    return null;
  }

  try {
    console.log("[TelegramAuth] Initiating silent Telegram re-authentication via initData...");
    const res = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData })
    });

    if (!res.ok) {
      console.warn("[TelegramAuth] Silent reauth failed with status:", res.status);
      return null;
    }

    const data = await res.json();
    if (data?.token && isSessionTokenValid(data.token)) {
      localStorage.setItem(TOKEN_KEY, data.token);
      console.log("[TelegramAuth] Silent reauth succeeded: fresh session token saved");
      return data.token;
    }
  } catch (err: any) {
    console.error("[TelegramAuth] Silent reauth exception:", err.message || err);
  }

  return null;
}

/**
 * Canonical helper to retrieve the authorization header for backend API calls.
 * 1. Prefers a valid, non-expired Dastyorchi Telegram session token.
 * 2. If unavailable or expired, removes stale token and attempts to use a valid Firebase ID token.
 * 3. Never returns stale tokens.
 */
export async function getApiAuthorizationHeader(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};

  // 1. Check local session token
  const storedToken = localStorage.getItem(TOKEN_KEY);
  if (storedToken) {
    if (isSessionTokenValid(storedToken)) {
      return { Authorization: `Bearer ${storedToken.trim()}` };
    } else {
      // Stale or expired token; remove it to avoid sending invalid credentials
      console.warn("[API Auth] Stored session token is invalid or expired. Removing stale token.");
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  // 2. Check Firebase ID Token
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      if (idToken) {
        return { Authorization: `Bearer ${idToken.trim()}` };
      }
    } catch (e: any) {
      console.warn("[API Auth] Error fetching Firebase ID token:", e.message);
    }
  }

  return {};
}

/**
 * Returns raw token string if available.
 */
export async function getApiAuthToken(): Promise<string | null> {
  const headers = await getApiAuthorizationHeader();
  const authVal = headers["Authorization"] || headers["authorization"];
  if (authVal && authVal.startsWith("Bearer ")) {
    return authVal.substring(7);
  }
  return null;
}

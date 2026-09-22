import React, { useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "../Navbar";
import { MobileBottomDock } from "../MobileBottomDock";
import { useViewport } from "../../contexts/ViewportContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getTelegramWebApp } from "../../services/telegramAuthService";

interface AppShellProps {
  user: any;
  onLogout: () => void;
  children: ReactNode;
  offlineBanner?: ReactNode;
}

export function AppShell({ user, onLogout, children, offlineBanner }: AppShellProps) {
  const { theme } = useTheme();
  const { isMobile, isFullScreenEditorOpen } = useViewport();
  const location = useLocation();

  // Initialize and synchronize Telegram WebApp viewport & theme
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;

    try {
      tg.ready?.();
      tg.expand?.();

      // Synchronize header & background colors
      const isDark = theme === "dark" || (!theme && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
      const bgHex = isDark ? "#09090b" : "#f8fafc";
      
      if (tg.setHeaderColor) {
        tg.setHeaderColor(bgHex);
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor(bgHex);
      }
    } catch (e) {
      console.warn("[AppShell] Telegram WebApp config notice:", e);
    }
  }, [theme]);

  // When mobile editor is full screen, Navbar top header can be hidden to avoid double headers
  return (
    <div
      style={{
        minHeight: "100dvh",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
      className="w-full max-w-full min-w-0 flex flex-col bg-gray-50 dark:bg-zinc-950 overflow-x-hidden relative text-gray-900 dark:text-zinc-100 font-sans"
    >
      <Navbar user={user}>
        {children}
        {offlineBanner}
      </Navbar>

      <MobileBottomDock user={user} onLogout={onLogout} />
    </div>
  );
}

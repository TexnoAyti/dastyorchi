import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getTelegramWebApp } from "../services/telegramAuthService";

interface ViewportContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewportHeight: number;
  keyboardHeight: number;
  isKeyboardOpen: boolean;
  isFullScreenEditorOpen: boolean;
  setIsFullScreenEditorOpen: (open: boolean) => void;
  hideBottomDock: boolean;
  setHideBottomDock: (hide: boolean) => void;
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [windowWidth, setWindowWidth] = useState(() => 
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [viewportHeight, setViewportHeight] = useState(() => 
    typeof window !== "undefined" ? (window.visualViewport?.height || window.innerHeight) : 800
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isFullScreenEditorOpen, setIsFullScreenEditorOpen] = useState(false);
  const [hideBottomDockManual, setHideBottomDock] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);

      const vv = window.visualViewport;
      if (vv) {
        const currentHeight = vv.height;
        setViewportHeight(currentHeight);

        // Compute estimated keyboard height
        const screenHeight = window.innerHeight;
        const diff = screenHeight - currentHeight;
        if (diff > 140) {
          setIsKeyboardOpen(true);
          setKeyboardHeight(diff);
        } else {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }

        // Sync with CSS variable
        document.documentElement.style.setProperty("--visual-viewport-height", `${currentHeight}px`);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }

    // Telegram WebApp Viewport Listeners
    const tg = getTelegramWebApp();
    if (tg) {
      try {
        tg.expand?.();
        const handleTgViewportChanged = () => {
          handleResize();
          if (tg.viewportHeight) {
            document.documentElement.style.setProperty("--tg-viewport-height", `${tg.viewportHeight}px`);
          }
          if (tg.viewportStableHeight) {
            document.documentElement.style.setProperty("--tg-viewport-stable-height", `${tg.viewportStableHeight}px`);
          }
        };
        tg.onEvent?.("viewportChanged", handleTgViewportChanged);
        return () => {
          tg.offEvent?.("viewportChanged", handleTgViewportChanged);
          window.removeEventListener("resize", handleResize);
          if (window.visualViewport) {
            window.visualViewport.removeEventListener("resize", handleResize);
            window.visualViewport.removeEventListener("scroll", handleResize);
          }
        };
      } catch (err) {
        console.warn("[Telegram WebApp] Viewport event setup error:", err);
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
    };
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // Auto-hide bottom dock if user is in mobile full-screen editor or keyboard is active
  const hideBottomDock = hideBottomDockManual || (isMobile && (isFullScreenEditorOpen || isKeyboardOpen));

  return (
    <ViewportContext.Provider
      value={{
        isMobile,
        isTablet,
        isDesktop,
        viewportHeight,
        keyboardHeight,
        isKeyboardOpen,
        isFullScreenEditorOpen,
        setIsFullScreenEditorOpen,
        hideBottomDock,
        setHideBottomDock,
      }}
    >
      {children}
    </ViewportContext.Provider>
  );
}

export function useViewport() {
  const context = useContext(ViewportContext);
  if (!context) {
    // Fallback safe values if used outside provider
    const isMob = typeof window !== "undefined" ? window.innerWidth < 768 : false;
    return {
      isMobile: isMob,
      isTablet: false,
      isDesktop: !isMob,
      viewportHeight: typeof window !== "undefined" ? window.innerHeight : 800,
      keyboardHeight: 0,
      isKeyboardOpen: false,
      isFullScreenEditorOpen: false,
      setIsFullScreenEditorOpen: () => {},
      hideBottomDock: false,
      setHideBottomDock: () => {},
    };
  }
  return context;
}

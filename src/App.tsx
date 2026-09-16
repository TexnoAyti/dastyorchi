import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { MobileBottomDock } from "./components/MobileBottomDock";
import { TelegramBrowserFallback } from "./components/TelegramBrowserFallback";
import { Dashboard } from "./pages/Dashboard";
import { CalendarPage } from "./pages/CalendarPage";
import { Builder } from "./pages/Builder";
import { Result } from "./pages/Result";
import { Login } from "./pages/Login";
import { Consultation } from "./pages/Consultation";
import { Profiles } from "./pages/Profiles";
import { UserProfile } from "./pages/UserProfile";
import { Cases } from "./pages/Cases";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { DocumentsPage } from "./pages/Documents";
import { TemplatesLibrary } from "./pages/TemplatesLibrary";
import { SearchPage } from "./pages/Search";
import { ActivityPage } from "./pages/Activity";
import { AdminPanel } from "./pages/Admin";
import { LanguageCenter } from "./pages/LanguageCenter";
import { Research } from "./pages/Research";
import { EvidencePage } from "./pages/Evidence";
import { TimelinePage } from "./pages/TimelinePage";
import { db, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { requestNotificationPermission, triggerStartupTestNotification } from "./services/notificationService";
import { NotificationProvider } from "./contexts/NotificationContext";
import { PaywallProvider } from "./contexts/PaywallContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { 
  getTelegramWebApp, 
  isTelegramWebAppEnvironment, 
  authenticateWithTelegramInitData, 
  verifyStoredSession, 
  devLoginBypass, 
  logoutUser 
} from "./services/telegramAuthService";
import { WifiOff, AlertCircle } from "lucide-react";

interface AppContentProps {
  user: any;
  onLogout: () => void;
  onDevLogin: () => Promise<void>;
  devLoading: boolean;
  authError: string;
  isNotMiniApp?: boolean;
}

function AppContent({ user, onLogout, onDevLogin, devLoading, authError, isNotMiniApp }: AppContentProps) {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? window.navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const offlineBanner = !isOnline && (
    <div className="fixed bottom-20 sm:bottom-6 left-6 z-[999999] bg-amber-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-amber-500 max-w-sm">
      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
        <WifiOff className="w-5 h-5 text-white" />
      </div>
      <div className="text-left">
        <span className="font-bold text-xs block">Oflayn Rejim (Offline Mode)</span>
        <span className="text-[10px] text-amber-100 block mt-0.5 leading-snug font-medium">
          Internet aloqasi uzildi. Ishingiz xavfsiz saqlanmoqda va ulanish tiklanganda sinxronlanadi.
        </span>
      </div>
    </div>
  );

  // If unauthenticated: render clean Telegram fallback page
  if (!user) {
    return (
      <div className="min-h-[100dvh] h-[100dvh] w-full max-w-full flex flex-col bg-gray-50 dark:bg-zinc-950 overflow-hidden relative">
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={() => window.location.reload()} />} />
          <Route path="*" element={
            <TelegramBrowserFallback 
              onDevLogin={onDevLogin} 
              devLoading={devLoading} 
              errorMessage={authError} 
              isNotMiniApp={isNotMiniApp}
            />
          } />
        </Routes>
        {offlineBanner}
      </div>
    );
  }

  const routesElement = (
    <Routes>
      <Route path="/" element={<Consultation user={user} />} />
      <Route path="/consultation" element={<Consultation user={user} />} />
      <Route path="/chat" element={<Consultation user={user} />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/cases" element={<Cases user={user} />} />
      <Route path="/research" element={<Research />} />
      <Route path="/evidence" element={<EvidencePage />} />
      <Route path="/timeline" element={<TimelinePage />} />
      <Route path="/documents" element={<DocumentsPage user={user} />} />
      <Route path="/templates" element={<TemplatesLibrary />} />
      <Route path="/search" element={<SearchPage user={user} />} />
      <Route path="/activity" element={<ActivityPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/language" element={<LanguageCenter />} />
      <Route path="/profiles" element={<Profiles />} />
      <Route path="/knowledge" element={<KnowledgeBase />} />
      <Route path="/profile" element={<UserProfile user={user} />} />
      <Route path="/settings" element={<UserProfile user={user} />} />
      <Route path="/builder/:templateId" element={<Builder />} />
      <Route path="/result/:documentId" element={<Result />} />
      <Route path="/admin" element={<AdminPanel user={user} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full max-w-full flex flex-col bg-gray-50 dark:bg-zinc-950 overflow-hidden relative">
      <Navbar user={user}>
        {routesElement}
        {offlineBanner}
      </Navbar>
      {/* Liquid Glass Mobile Bottom Dock */}
      <MobileBottomDock user={user} onLogout={onLogout} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startupTimeoutError, setStartupTimeoutError] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const [isNotMiniApp, setIsNotMiniApp] = useState(false);

  useEffect(() => {
    // Defensive startup timeout (10 seconds) to prevent infinite loading screen
    const startupTimer = setTimeout(() => {
      setLoading((currentLoading) => {
        if (currentLoading) {
          console.warn("[App Init] Startup timeout reached (10s). Releasing loading state.");
          setStartupTimeoutError(true);
          return false;
        }
        return false;
      });
    }, 10000);

    // Request notification permission on app start and trigger test alert
    requestNotificationPermission()
      .then((perm) => {
        if (perm === "granted") {
          triggerStartupTestNotification();
        }
      })
      .catch((err) => {
        console.error("[App Init] Permission check / startup test notification failed:", err);
      });

    let unsubscribeSnapshot: (() => void) | null = null;
    let isHandlingTelegramLogin = false;

    const startUserSync = (uid: string, fallbackUser?: any) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
        console.log("[Firestore] listener detached: App User Profile");
      }

      const initialUser = fallbackUser || {
        uid,
        id: uid,
      };

      // AUTH SUCCESS MUST RELEASE APP UI IMMEDIATELY
      setUser(initialUser);
      setLoading(false);
      clearTimeout(startupTimer);

      try {
        const userRef = doc(db, "users", uid);
        console.log("[Firestore] listener attached: App User Profile");

        unsubscribeSnapshot = onSnapshot(
          userRef,
          (snap) => {
            if (snap.exists()) {
              setUser((current: any) => ({
                ...current,
                ...snap.data(),
                uid,
                id: uid,
              }));
            }
          },
          (err) => {
            console.warn(
              "[App Init] User profile snapshot failed; continuing with authenticated fallback user:",
              err
            );
          }
        );
      } catch (err) {
        console.warn(
          "[App Init] Could not attach user profile listener; continuing without blocking UI:",
          err
        );
      }
    };

    const handleTelegramLogin = async () => {
      if (isHandlingTelegramLogin) return;
      isHandlingTelegramLogin = true;

      const windowTelegramExists = typeof window !== "undefined" && Boolean((window as any).Telegram);
      const webAppExists = typeof window !== "undefined" && Boolean((window as any).Telegram?.WebApp);
      const rawInitData = typeof window !== "undefined" ? (window as any).Telegram?.WebApp?.initData : "";
      const initDataLength = rawInitData ? rawInitData.length : 0;

      console.log("[TelegramCheck] window.Telegram exists:", windowTelegramExists ? "yes" : "no");
      console.log("[TelegramCheck] WebApp exists:", webAppExists ? "yes" : "no");
      console.log("[TelegramCheck] initData length:", initDataLength);

      const tg = getTelegramWebApp();
      if (tg) {
        try {
          tg.ready();
          tg.expand();
        } catch (e) {}
      }

      // If running inside Telegram WebApp with valid initData
      if (isTelegramWebAppEnvironment() && rawInitData) {
        try {
          const authResult = await authenticateWithTelegramInitData(rawInitData);
          if (authResult?.user) {
            startUserSync(authResult.user.uid, authResult.user);
            return;
          }
        } catch (err: any) {
          console.error("[TelegramAuth] Telegram initData authentication error:", err);
          const isMismatch = 
            err?.message?.includes("custom-token-mismatch") ||
            err?.code === "auth/custom-token-mismatch" ||
            err?.message?.includes("Firebase loyihasi backend bilan mos emas");
          const displayError = isMismatch
            ? "Firebase loyihasi backend bilan mos emas. Ilova konfiguratsiyasini tekshiring."
            : (err.message || "Telegram avtorizatsiyasida xatolik yuz berdi");
          setAuthError(displayError);
          setLoading(false);
          clearTimeout(startupTimer);
          return;
        }
      }

      // If opened inside Telegram but NOT as a proper Mini App (initData.length === 0)
      if (windowTelegramExists && initDataLength === 0) {
        console.warn("[TelegramAuth] Mini App Telegram WebApp sifatida ishga tushirilmagan");
        setIsNotMiniApp(true);
        setLoading(false);
        clearTimeout(startupTimer);
        return;
      }

      // Check stored session token fallback if any
      try {
        const storedUser = await verifyStoredSession();
        if (storedUser) {
          startUserSync(storedUser.uid, storedUser);
          return;
        }
      } catch (err: any) {
        console.warn("[TelegramAuth] Stored session check error:", err);
      }

      // If neither, render browser fallback page
      setUser(null);
      setLoading(false);
      clearTimeout(startupTimer);
    };

    // A. Check Firebase onAuthStateChanged first
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("[TelegramAuth] Firebase persistent session found for UID:", firebaseUser.uid);
        startUserSync(firebaseUser.uid, {
          uid: firebaseUser.uid,
          id: firebaseUser.uid,
          displayName: firebaseUser.displayName || "",
          photoUrl: firebaseUser.photoURL || ""
        });
      } else {
        // B. If Firebase user does not exist: proceed with Telegram login
        await handleTelegramLogin();
      }
    });

    return () => {
      clearTimeout(startupTimer);
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        console.log("[Firestore] listener detached: App User Profile");
      }
    };
  }, []);

  const handleDevLogin = async () => {
    setDevLoading(true);
    setAuthError("");
    try {
      const result = await devLoginBypass();
      if (result.user) {
        setUser(result.user);
      }
    } catch (err: any) {
      const isMismatch = 
        err?.message?.includes("custom-token-mismatch") ||
        err?.code === "auth/custom-token-mismatch" ||
        err?.message?.includes("Firebase loyihasi backend bilan mos emas");
      const displayError = isMismatch
        ? "Firebase loyihasi backend bilan mos emas. Ilova konfiguratsiyasini tekshiring."
        : (err.message || "Dev login xatoligi");
      setAuthError(displayError);
    } finally {
      setDevLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 tracking-tight">Dastyorchi yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (startupTimeoutError && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-2">
            Ilovani ishga tushirishda muammo yuz berdi
          </h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6 leading-relaxed">
            Ilovani ishga tushirishda muammo yuz berdi. Qayta urinib ko‘ring.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <PaywallProvider>
            <Router>
              <AppContent 
                user={user} 
                onLogout={handleLogout}
                onDevLogin={handleDevLogin}
                devLoading={devLoading}
                authError={authError}
                isNotMiniApp={isNotMiniApp}
              />
            </Router>
          </PaywallProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

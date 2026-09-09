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
import { db } from "./firebase";
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
import { WifiOff } from "lucide-react";

interface AppContentProps {
  user: any;
  onLogout: () => void;
  onDevLogin: () => Promise<void>;
  devLoading: boolean;
  authError: string;
}

function AppContent({ user, onLogout, onDevLogin, devLoading, authError }: AppContentProps) {
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
          <Route path="/login" element={<Login onLoginSuccess={(u) => window.location.reload()} />} />
          <Route path="*" element={
            <TelegramBrowserFallback 
              onDevLogin={onDevLogin} 
              devLoading={devLoading} 
              errorMessage={authError} 
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
      <Route path="/cases" element={<Cases />} />
      <Route path="/research" element={<Research />} />
      <Route path="/evidence" element={<EvidencePage />} />
      <Route path="/timeline" element={<TimelinePage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/templates" element={<TemplatesLibrary />} />
      <Route path="/search" element={<SearchPage />} />
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
  const [devLoading, setDevLoading] = useState(false);
  const [authError, setAuthError] = useState<string>("");

  useEffect(() => {
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

    const startUserSync = (uid: string, initialUser: any) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      const userRef = doc(db, "users", uid);
      unsubscribeSnapshot = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUser({
            ...initialUser,
            ...data,
            uid,
            id: uid
          });
        } else {
          setUser(initialUser);
        }
        setLoading(false);
      }, (err) => {
        console.warn("User profile snapshot warning:", err);
        setUser(initialUser);
        setLoading(false);
      });
    };

    const initAuth = async () => {
      setLoading(true);
      setAuthError("");

      const tg = getTelegramWebApp();
      if (tg) {
        try {
          tg.ready();
          tg.expand();
        } catch (e) {}
      }

      // 1. If running inside Telegram WebApp with initData
      if (isTelegramWebAppEnvironment() && tg?.initData) {
        try {
          const authResult = await authenticateWithTelegramInitData(tg.initData);
          if (authResult?.user) {
            startUserSync(authResult.user.uid, authResult.user);
            return;
          }
        } catch (err: any) {
          console.error("Telegram initData authentication error:", err);
          setAuthError(err.message || "Telegram avtorizatsiyasida xatolik yuz berdi");
        }
      }

      // 2. If existing session token exists in localStorage (e.g. page refresh)
      try {
        const storedUser = await verifyStoredSession();
        if (storedUser) {
          startUserSync(storedUser.uid, storedUser);
          return;
        }
      } catch (err: any) {
        console.warn("Stored session validation error:", err);
      }

      // 3. If neither, show the non-Telegram browser fallback page
      setUser(null);
      setLoading(false);
    };

    initAuth();

    return () => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const handleDevLogin = async () => {
    setDevLoading(true);
    setAuthError("");
    try {
      const result = await devLoginBypass();
      if (result.user) {
        const userRef = doc(db, "users", result.user.uid);
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUser({ ...result.user, ...snap.data(), uid: result.user.uid, id: result.user.uid });
          } else {
            setUser(result.user);
          }
        });
        setUser(result.user);
      }
    } catch (err: any) {
      setAuthError(err.message || "Dev login xatoligi");
    } finally {
      setDevLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
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
              />
            </Router>
          </PaywallProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

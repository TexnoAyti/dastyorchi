import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
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
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { requestNotificationPermission, triggerStartupTestNotification } from "./services/notificationService";
import { NotificationProvider } from "./contexts/NotificationContext";
import { PaywallProvider } from "./contexts/PaywallContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WifiOff } from "lucide-react";
import { PipelineObservabilityPanel } from "./components/PipelineObservabilityPanel";

function AppContent({ user }: { user: any }) {
  const location = useLocation();
  const isConsultation = location.pathname === "/" || location.pathname === "/consultation" || location.pathname === "/chat";
  const [destinationRoute, setDestinationRoute] = useState<string>("");
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

  useEffect(() => {
    // When location changes, reset the destination route (or keep it as the current path)
    setDestinationRoute("");
  }, [location.pathname]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const closestLink = target.closest("a");
      if (closestLink) {
        const href = closestLink.getAttribute("href");
        if (href) {
          setDestinationRoute(href);
        }
      }
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  const isLoginPage = location.pathname === "/login";
  const isHideNavbar = !user || isLoginPage;

  const routesElement = (
    <Routes>
      <Route path="/" element={<Consultation user={user} />} />
      <Route path="/consultation" element={<Consultation user={user} />} />
      <Route path="/chat" element={<Consultation user={user} />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/cases" element={user ? <Cases /> : <Navigate to="/login" replace />} />
      <Route path="/research" element={user ? <Research /> : <Navigate to="/login" replace />} />
      <Route path="/evidence" element={user ? <EvidencePage /> : <Navigate to="/login" replace />} />
      <Route path="/timeline" element={user ? <TimelinePage /> : <Navigate to="/login" replace />} />
      <Route path="/documents" element={user ? <DocumentsPage /> : <Navigate to="/login" replace />} />
      <Route path="/templates" element={user ? <TemplatesLibrary /> : <Navigate to="/login" replace />} />
      <Route path="/search" element={user ? <SearchPage /> : <Navigate to="/login" replace />} />
      <Route path="/activity" element={user ? <ActivityPage /> : <Navigate to="/login" replace />} />
      <Route path="/calendar" element={user ? <CalendarPage /> : <Navigate to="/login" replace />} />
      <Route path="/language" element={user ? <LanguageCenter /> : <Navigate to="/login" replace />} />
      <Route path="/profiles" element={user ? <Profiles /> : <Navigate to="/login" replace />} />
      <Route path="/knowledge" element={user ? <KnowledgeBase /> : <Navigate to="/login" replace />} />
      <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={user ? <UserProfile /> : <Navigate to="/login" replace />} />
      <Route path="/builder/:templateId" element={user ? <Builder /> : <Navigate to="/login" replace />} />
      <Route path="/result/:documentId" element={user ? <Result /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={<AdminPanel user={user} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  const debugOverlay = user && (
    <div className="fixed bottom-4 right-4 z-[9999] bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white p-3.5 rounded-2xl shadow-xl flex flex-col gap-1.5 text-[10px] font-mono max-w-xs transition-all pointer-events-none opacity-90 select-none">
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 mb-1 text-slate-400 font-bold uppercase tracking-wider text-[8px]">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Yuridik Tizim Debugger
      </div>
      <div>
        <span className="text-slate-400 block font-bold uppercase tracking-wide text-[8px]">Current Route:</span>
        <span className="text-emerald-400 font-extrabold text-[11px] block truncate mt-0.5">{location.pathname + location.search}</span>
      </div>
      <div>
        <span className="text-slate-400 block font-bold uppercase tracking-wide text-[8px]">Destination Route:</span>
        <span className="text-indigo-400 font-extrabold text-[11px] block truncate mt-0.5">{destinationRoute || location.pathname}</span>
      </div>
    </div>
  );

  const offlineBanner = !isOnline && (
    <div className="fixed bottom-6 left-6 z-[999999] bg-amber-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-amber-500 max-w-sm">
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

  if (isHideNavbar) {
    return (
      <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-zinc-950 overflow-hidden relative">
        <main className="flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden">
          {routesElement}
        </main>
        {debugOverlay}
        {offlineBanner}
        <PipelineObservabilityPanel />
      </div>
    );
  }

  return (
    <Navbar user={user}>
      {routesElement}
      {debugOverlay}
      {offlineBanner}
      <PipelineObservabilityPanel />
    </Navbar>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (authUser) {
        const userRef = doc(db, "users", authUser.uid);
        
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const customDisplayName = authUser.displayName || authUser.email?.split("@")[0] || "Foydalanuvchi";
            const isAdminEmail = authUser.email === "umidjonpremium6@gmail.com" || authUser.email === "arslonovazamat11@gmail.com";
            const initialProfile = {
              uid: authUser.uid,
              email: authUser.email || "",
              displayName: customDisplayName,
              role: isAdminEmail ? "admin" : "user",
              subscriptionTier: "free",
              subscriptionStatus: "active",
              requestsToday: 0,
              exportsToday: 0,
              lastRequestResetDate: new Date().toLocaleDateString("en-CA"),
              lastExportResetDate: new Date().toLocaleDateString("en-CA"),
              avatarUrl: authUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${authUser.uid}`,
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, initialProfile);
          }
        } catch (err) {
          console.error("Error ensuring user profile exists in Firestore:", err);
        }

        // Establish real-time sync for the user document in Firestore
        unsubscribeSnapshot = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const isAdminEmail = authUser.email === "umidjonpremium6@gmail.com" || authUser.email === "arslonovazamat11@gmail.com";
            
            // Automatically upgrade dev admin email to 'admin' role in storage
            if (isAdminEmail && data.role !== "admin") {
              try {
                await updateDoc(userRef, { role: "admin" });
              } catch (err) {
                console.error("Auto role promotion failed: ", err);
              }
            }

            setUser({
              ...authUser,
              ...data,
              id: snapshot.id,
              role: isAdminEmail ? "admin" : (data.role || "user")
            });
          } else {
            setUser(authUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error syncing user profile snapshot:", error);
          setUser(authUser);
          setLoading(false);
        });

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <PaywallProvider>
            <Router>
              <AppContent user={user} />
            </Router>
          </PaywallProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

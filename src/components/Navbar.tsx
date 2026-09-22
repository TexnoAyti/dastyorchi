import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Scale, LogOut, User, LayoutDashboard, Briefcase, Settings, 
  Crown, Bell, Trash2, FileText, CheckCheck, X, BookOpen, Clock, Search, Menu, Calendar, Globe, Sparkles, Bookmark, Sun, Moon, ShieldAlert, LayoutGrid, MessageSquare
} from "lucide-react";
import { cn } from "../lib/utils";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { useNotification } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function Navbar({ user, children }: { user: any; children?: React.ReactNode }) {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);
  const [annDismissed, setAnnDismissed] = useState(false);
  const { history, unreadCount, markAllAsRead, clearAllHistory, clearNotification, markAsRead } = useNotification();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const dropdownMobileRef = useRef<HTMLDivElement>(null);
  const dropdownDesktopRef = useRef<HTMLDivElement>(null);

  const { theme, toggleTheme } = useTheme();

  // Collapsible sidebar state (Expanded: 260px, Collapsed: 68px)
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const isEditor = window.location.pathname.startsWith("/result") || window.location.pathname === "/chat" || window.location.pathname === "/consultation" || window.location.pathname.startsWith("/builder");
      if (isEditor) return true;
      const stored = localStorage.getItem("sidebar_collapsed");
      // Default: Collapsed (true)
      return stored !== "false";
    }
    return true;
  });

  const setSidebarCollapsed = (val: boolean) => {
    setSidebarCollapsedState(val);
    localStorage.setItem("sidebar_collapsed", String(val));
  };

  // Automatically collapse sidebar on editor pages
  useEffect(() => {
    const isEditor = location.pathname.startsWith("/result") || location.pathname === "/chat" || location.pathname === "/consultation";
    if (isEditor) {
      setSidebarCollapsedState(true);
    }
  }, [location.pathname]);

  // Sync announcements
  useEffect(() => {
    if (!user?.uid) {
      setAnnouncement(null);
      return;
    }
    console.log("[Firestore] listener attached: Navbar Announcements");
    const unsubscribe = onSnapshot(
      collection(db, "announcements"), 
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (list.length > 0) {
          list.sort((a: any, b: any) => {
            const t1 = (a.createdAt as any)?.seconds || 0;
            const t2 = (b.createdAt as any)?.seconds || 0;
            return t2 - t1;
          });
          const latest = list[0];
          const isDismissed = localStorage.getItem(`ann_dismissed_${latest.id}`) === "true";
          setAnnouncement(latest);
          setAnnDismissed(isDismissed);
        } else {
          setAnnouncement(null);
        }
      },
      (error) => {
        console.warn("Announcements non-critical issue:", error.message || error);
        setAnnouncement(null);
      }
    );
    return () => {
      unsubscribe();
      console.log("[Firestore] listener detached: Navbar Announcements");
    };
  }, [user?.uid]);

  const handleNotificationClick = (item: any) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    setShowNotifications(false);
    if (item.documentId) {
      navigate(`/result/${item.documentId}`);
    } else if (item.chatId) {
      navigate(`/consultation?chatId=${item.chatId}`);
    } else {
      navigate("/consultation");
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isMobileClick = dropdownMobileRef.current && dropdownMobileRef.current.contains(event.target as Node);
      const isDesktopClick = dropdownDesktopRef.current && dropdownDesktopRef.current.contains(event.target as Node);
      if (!isMobileClick && !isDesktopClick) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
     if (!user) return;
     if (user.role === "admin") {
        setIsAdmin(true);
        return;
     }
     const checkAdmin = async () => {
          try {
             const userDoc = await getDoc(doc(db, "users", user.uid));
             if (userDoc.exists() && userDoc.data().role === "admin") {
                setIsAdmin(true);
             }
          } catch(e) {}
     };
     checkAdmin();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Nav Items customized specifically as requested by user
  const navItems = [
    { name: t.nav.dashboard, path: "/dashboard", icon: LayoutDashboard },
    { name: t.nav.cases, path: "/cases", icon: Briefcase },
    { name: t.nav.documentCenter, path: "/documents", icon: FileText },
    { name: t.nav.research, path: "/research", icon: Bookmark },
    { name: t.cases.evidence, path: "/evidence", icon: Scale },
    { name: t.nav.calendar, path: "/timeline", icon: Clock },
    { name: t.nav.templates, path: "/templates", icon: Sparkles },
    { name: t.nav.activityLog, path: "/activity", icon: Calendar },
    { name: t.nav.settings, path: "/settings", icon: Settings },
  ];

  const getPageTitle = () => {
    const matched = navItems.find((item) => location.pathname === item.path);
    if (matched) return matched.name;
    if (location.pathname === "/" || location.pathname === "/consultation" || location.pathname === "/chat") {
      return t.chat.lawyerTitle;
    }
    if (location.pathname === "/admin") return t.admin.title;
    if (location.pathname.startsWith("/builder")) return t.templates.generateDoc;
    if (location.pathname.startsWith("/result")) return t.editor.actions;
    return t.nav.dashboard;
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full max-w-full flex flex-row bg-[var(--bg-secondary)] font-sans overflow-hidden transition-colors duration-200 text-[var(--text-primary)] relative">
      
      {/* 1. PERMANENT LEFT SIDEBAR FOR DESKTOP */}
      <aside className={cn(
        "hidden lg:flex border-r border-[var(--border-primary)] bg-[var(--bg-card)] flex-col justify-between h-full shrink-0 select-none transition-all duration-350 ease-in-out",
        sidebarCollapsed ? "w-[68px]" : "w-[260px]"
      )}>
        
        {/* Upper Side */}
        <div className={cn("p-5 flex flex-col min-h-0", sidebarCollapsed ? "items-center px-2" : "")}>
          {/* Logo / Branding */}
          <Link to="/" className={cn("flex items-center gap-2.5 px-2 py-1 group mb-6 shrink-0", sidebarCollapsed ? "justify-center" : "")}>
            <div className="p-2 bg-zinc-900 dark:bg-zinc-100 rounded-lg group-hover:scale-102 transition-transform shrink-0">
              <Scale className="w-5 h-5 text-white dark:text-zinc-900" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fade-in block">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight block leading-none">Dastyorchi.uz</span>
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest block mt-1">YURIDIK TIZIM</span>
              </div>
            )}
          </Link>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto space-y-0.5 pr-1 py-1 w-full">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 tracking-tight",
                    sidebarCollapsed ? "justify-center px-1" : "",
                    isActive
                      ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                      : "text-gray-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-zinc-800/40"
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="animate-fade-in">{item.name}</span>}
                </Link>
              );
            })}

            {/* Admin navigation separator & link */}
            {isAdmin && (
              <>
                <div className="my-3 border-t border-gray-200 dark:border-zinc-800/60" />
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 tracking-tight",
                    sidebarCollapsed ? "justify-center px-1" : "",
                    location.pathname === "/admin"
                      ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                      : "text-gray-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-zinc-800/40"
                  )}
                  title={sidebarCollapsed ? "Admin Panel" : undefined}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                  {!sidebarCollapsed && <span className="animate-fade-in">Admin Panel</span>}
                </Link>
              </>
            )}

            {/* Manual collapse toggler button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 mt-4 rounded-lg text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-zinc-800/40 transition-all cursor-pointer",
                sidebarCollapsed ? "justify-center px-1" : ""
              )}
              title={sidebarCollapsed ? t.common.next : t.common.back}
            >
              <Menu className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="animate-fade-in">{t.common.close}</span>}
            </button>
          </nav>
        </div>

        {/* Brand Bottom User Profile area */}
        <div className={cn(
          "p-4 border-t border-gray-100 dark:border-zinc-800/60 bg-gray-50/50 dark:bg-zinc-900/40 flex flex-col gap-3 shrink-0",
          sidebarCollapsed ? "items-center px-2" : ""
        )}>
          
          <div className={cn("flex items-center gap-2 px-1 w-full", sidebarCollapsed ? "justify-center" : "justify-between")}>
            {/* User details */}
            <Link to="/settings" className="flex items-center gap-2 max-w-[150px] truncate" title={t.nav.settings}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || "Siz"}
                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-zinc-700 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="min-w-0 animate-fade-in">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100 block truncate leading-none">
                    {user?.displayName || user?.email?.split("@")[0] || t.common.empty}
                  </span>
                  {user?.subscriptionTier === "pro" ? (
                    <span className="text-[8px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest block mt-0.5">
                      PRO
                    </span>
                  ) : (
                    <span className="text-[8px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mt-0.5">
                      {t.common.all}
                    </span>
                  )}
                </div>
              )}
            </Link>

            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all shrink-0 cursor-pointer"
                title={t.nav.signOut}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!sidebarCollapsed ? (
            <Link
              to="/chat"
              className="w-full inline-flex items-center justify-center py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg text-[10px] font-bold transition shadow-xs tracking-tight uppercase"
            >
              {t.chat.lawyerTitle}
            </Link>
          ) : (
            <Link
              to="/chat"
              className="inline-flex items-center justify-center p-2 bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg hover:scale-105 transition shadow-xs"
              title={t.chat.lawyerTitle}
            >
              <Sparkles className="w-4 h-4" />
            </Link>
          )}

        </div>
      </aside>

      {/* 2. RIGHT WORKSPACE CONTENT AREA WITH TOP NAV BAR */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* Global Announcement Banner */}
        {announcement && !annDismissed && (
          <div className="bg-zinc-900 border-b border-zinc-800 dark:bg-zinc-950 text-zinc-100 relative py-1.5 px-4 text-center text-[11px] font-bold flex items-center justify-center select-none z-[190] w-full shrink-0">
            <div className="flex items-center gap-2 max-w-5xl mx-auto pr-8 flex-wrap justify-center">
              <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider">
                E'LOX
              </span>
              <span>{announcement.title}:</span>
              <span className="text-zinc-300 font-medium">{announcement.message}</span>
            </div>
            <button 
              onClick={() => {
                localStorage.setItem(`ann_dismissed_${announcement.id}`, "true");
                setAnnDismissed(true);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TOP BAR */}
        <header className="h-16 px-4 sm:px-6 bg-[var(--bg-card)] border-b border-[var(--border-primary)] flex items-center justify-between shrink-0 w-full z-40 relative">
          
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-all"
              title="Kengaytirilgan menyu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Expand Sidebar button when collapsed */}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-bold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer transition-all shadow-xs"
                id="expand_sidebar_top_btn"
              >
                <Menu className="w-3.5 h-3.5" />
                <span>Expand Sidebar</span>
              </button>
            )}

            {/* Page title */}
            <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-zinc-50 tracking-tight truncate max-w-[130px] xs:max-w-[190px] sm:max-w-xs md:max-w-none">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Quick Consultation trigger */}
            {location.pathname !== "/chat" && (
              <Link
                to="/chat"
                className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-zinc-900 border border-gray-200 hover:bg-gray-50 dark:text-neutral-200 dark:border-zinc-800 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t.chat.lawyerTitle}
              </Link>
            )}

            {/* Language Selector Dropdown */}
            <div className="relative group">
              <button
                className="p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title={t.common.language}
              >
                <Globe className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
                <span className="text-[10px] font-bold uppercase hidden xs:inline">{language.replace("uz_lat", "uz").replace("uz_cyr", "ўз").replace("ru", "ru").replace("en", "en")}</span>
              </button>
              
              <div className="absolute right-0 mt-2.5 w-44 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl z-[200] hidden group-hover:block hover:block">
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => setLanguage("uz_lat")}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-between cursor-pointer",
                      language === "uz_lat" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950" : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <span>🇺🇿 O'zbek (Lotin)</span>
                    {language === "uz_lat" && <span className="text-[9px]">✓</span>}
                  </button>
                  <button
                    onClick={() => setLanguage("uz_cyr")}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-between cursor-pointer",
                      language === "uz_cyr" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950" : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <span>🇺🇿 Ўзбек (Кирилл)</span>
                    {language === "uz_cyr" && <span className="text-[9px]">✓</span>}
                  </button>
                  <button
                    onClick={() => setLanguage("ru")}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-between cursor-pointer",
                      language === "ru" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950" : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <span>🇷🇺 Русский</span>
                    {language === "ru" && <span className="text-[9px]">✓</span>}
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-between cursor-pointer",
                      language === "en" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950" : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <span>🇺🇸 English</span>
                    {language === "en" && <span className="text-[9px]">✓</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* Dark & Light toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
              title={theme === "light" ? "Tungi rejim" : "Kunduzgi rejim"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-zinc-800 font-bold" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 font-bold" />
              )}
            </button>

            {/* Notification drop */}
            <div className="relative" ref={dropdownDesktopRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all relative cursor-pointer",
                  showNotifications && "text-zinc-900 bg-gray-100 dark:text-white dark:bg-zinc-800"
                )}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl z-[150] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/60">
                    <span className="font-bold text-xs text-gray-900 dark:text-zinc-100">Bildirishnomalar</span>
                    <button onClick={markAllAsRead} className="text-[10px] font-bold text-zinc-900 dark:text-zinc-200 hover:underline">O'qildi</button>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800">
                    {history.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-400 dark:text-zinc-500">Yangi xabarlar yo'q</div>
                    ) : (
                      history.map((item) => (
                        <div 
                           key={item.id} 
                           onClick={() => handleNotificationClick(item)} 
                           className="p-3.5 text-xs hover:bg-gray-50 dark:hover:bg-zinc-800/40 cursor-pointer"
                        >
                           <p className="font-bold text-gray-800 dark:text-zinc-200 truncate">{item.title}</p>
                           <p className="text-gray-400 dark:text-zinc-400 mt-0.5 line-clamp-2">{item.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mini profile metadata container link */}
            <Link
              to="/settings"
              className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
              title="Profil"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || "Profil"}
                  className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-zinc-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </Link>

          </div>

        </header>

        {/* WORKSPACE APP PAGE CONTENT WRAPPER */}
        <main className={cn(
          "flex-1 min-h-0 min-w-0 h-full w-full bg-[var(--bg-secondary)] relative transition-colors duration-200",
          location.pathname.startsWith("/result") || location.pathname === "/chat" || location.pathname === "/consultation" || location.pathname === "/" || location.pathname.startsWith("/builder")
            ? "overflow-hidden pb-[calc(4.5rem+max(12px,env(safe-area-inset-bottom,12px)))] lg:pb-0"
            : "overflow-y-auto pb-24 sm:pb-28 lg:pb-0"
        )}>
          {children}
        </main>
      </div>

      {/* 3. MORE MENU BOTTOM SHEET */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Bottom Sheet Container */}
          <div 
            style={{
              paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)"
            }}
            className="relative z-10 w-full bg-white/90 dark:bg-[#141418]/95 border-t border-white/60 dark:border-white/10 rounded-t-[32px] shadow-[0_-8px_32px_rgba(0,0,0,0.15)] p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 glass-scrollbar"
          >
            {/* Grab handle indicator */}
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200/50 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-50 leading-tight">Barcha Bo'limlar</h3>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400">Yuridik platformaning to'liq modullari</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2-Column Compact Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {[
                { name: "Dashboard", desc: "Boshqaruv paneli", path: "/dashboard", icon: LayoutDashboard, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
                { name: "Research", desc: "Yuridik tahlil", path: "/research", icon: Bookmark, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
                { name: "Evidence", desc: "Dalillar bazasi", path: "/evidence", icon: Scale, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
                { name: "Calendar", desc: "Taqvim va muddat", path: "/timeline", icon: Clock, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40" },
                { name: "Templates", desc: "Hujjat andozalari", path: "/templates", icon: Sparkles, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
                { name: "Activity", desc: "Faoliyat jurnali", path: "/activity", icon: Calendar, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/40" },
                { name: "Settings", desc: "Sozlamalar", path: "/settings", icon: Settings, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
                ...(isAdmin ? [
                  { name: "Admin", desc: "Admin Panel", path: "/admin", icon: ShieldAlert, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40" }
                ] : [])
              ].map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-xs select-none",
                      isActive
                        ? "bg-blue-50/90 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-xs"
                        : "bg-gray-50/70 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border-gray-200/50 dark:border-white/5 text-gray-800 dark:text-zinc-200"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl shrink-0", item.bg, item.color)}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold block truncate text-xs">{item.name}</span>
                      <span className="text-[10px] text-gray-500 dark:text-zinc-400 block truncate">{item.desc}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Profile & Footer controls */}
            <div className="pt-3.5 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between gap-3">
              <Link 
                to="/settings" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 min-w-0 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || "Profil"}
                    className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-zinc-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="block font-bold text-xs text-gray-900 dark:text-white truncate">
                    {user?.displayName || "Foydalanuvchi"}
                  </span>
                  <span className="block text-[10px] text-gray-500 dark:text-zinc-400 truncate">
                    {user?.email || "Yuridik profil"}
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2.5 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-gray-200/50 dark:border-white/10 cursor-pointer"
                  title="Mavzu"
                >
                  {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all border border-red-200/50 dark:border-red-900/30 cursor-pointer"
                  title="Chiqish"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Navbar;

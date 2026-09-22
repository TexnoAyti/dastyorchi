import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  MessageSquare, Briefcase, FileText, Search, LayoutGrid,
  LayoutDashboard, BookOpen, Clock, Calendar, Sparkles,
  User, Sun, Moon, LogOut, ShieldAlert, X
} from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme } from "../contexts/ThemeContext";
import { useViewport } from "../contexts/ViewportContext";
import { useNotification } from "../contexts/NotificationContext";

interface MobileBottomDockProps {
  user: any;
  onLogout?: () => void;
}

export function MobileBottomDock({ user, onLogout }: MobileBottomDockProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { hideBottomDock } = useViewport();
  const { unreadCount } = useNotification();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Check if current user is admin
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    setMoreMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("dastyorchi_session_token");
      navigate("/");
      window.location.reload();
    }
  };

  // Additional tools for the "More" expandable sheet
  const moreNavItems = [
    { name: "Boshqaruv paneli", path: "/dashboard", icon: LayoutDashboard, color: "text-indigo-500", bg: "bg-indigo-500/10", desc: "Statistika va monitoring" },
    { name: "Yuridik tadqiqot", path: "/research", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10", desc: "Qonunlar tahlili" },
    { name: "Dalillar bazasi", path: "/evidence", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10", desc: "Ish hujjatlari" },
    { name: "Xronologiya", path: "/timeline", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Voqealar zanjiri" },
    { name: "Sud taqvimi", path: "/calendar", icon: Calendar, color: "text-rose-500", bg: "bg-rose-500/10", desc: "Majlislar jadvali" },
    { name: "Shablonlar", path: "/templates", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Tayyor arizalar" },
    { name: "Harakatlar tarixi", path: "/activity", icon: Clock, color: "text-cyan-500", bg: "bg-cyan-500/10", desc: "Amallar jurnali" },
    { name: "Profil sozlamalari", path: "/settings", icon: User, color: "text-teal-500", bg: "bg-teal-500/10", desc: "Shaxsiy ma'lumotlar" },
  ];

  if (isAdmin) {
    moreNavItems.unshift({
      name: "Admin Boshqaruv",
      path: "/admin",
      icon: ShieldAlert,
      color: "text-red-500",
      bg: "bg-red-500/10",
      desc: "Tizim nazorati"
    });
  }

  // Active status helpers
  const isChatActive = location.pathname === "/" || location.pathname === "/chat" || location.pathname === "/consultation";
  const isCasesActive = location.pathname === "/cases";
  const isDocumentsActive = location.pathname === "/documents" || location.pathname.startsWith("/result") || location.pathname.startsWith("/builder");
  const isSearchActive = location.pathname === "/search";
  const isMoreActive = moreMenuOpen || [
    "/dashboard", "/research", "/evidence", "/timeline", 
    "/calendar", "/templates", "/activity", "/settings", "/profile", "/admin"
  ].includes(location.pathname);

  return (
    <>
      {/* 1. EXPANDABLE "MORE" BOTTOM SHEET */}
      {moreMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setMoreMenuOpen(false)}
        >
          <div 
            style={{
              paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
            }}
            className="w-full max-h-[82dvh] bg-white/95 dark:bg-[#141418]/95 border-t border-white/40 dark:border-white/10 rounded-t-[32px] p-5 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">Qo'shimcha bo'limlar</h3>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400">Barcha mavjud yuridik xizmatlar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Nav Grid */}
            <div className="overflow-y-auto py-3.5 space-y-1.5 flex-1 pr-1">
              {moreNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-2xl transition-all border",
                      isActive
                        ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold"
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

            {/* Telegram Profile & Footer Controls */}
            <div className="pt-3.5 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
              <Link 
                to="/settings" 
                onClick={() => setMoreMenuOpen(false)}
                className="flex items-center gap-2.5 min-w-0 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                {user?.avatarUrl || user?.photoUrl ? (
                  <img 
                    src={user.avatarUrl || user.photoUrl} 
                    alt={user.displayName || "User"} 
                    className="w-8 h-8 rounded-full object-cover border border-white/40 dark:border-white/20 shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {(user?.displayName || "D")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <span className="font-bold text-xs text-gray-900 dark:text-white block truncate leading-tight">
                    {user?.displayName || "Foydalanuvchi"}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400 block truncate">
                    {user?.telegramUsername ? `@${user.telegramUsername}` : "Sozlamalar"}
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  title="Mavzuni almashtirish"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Chiqish"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FLOATING MOBILE BOTTOM DOCK (Auto-hidden when keyboard or mobile editor is active) */}
      <div 
        className={cn(
          "lg:hidden fixed left-0 right-0 z-40 flex justify-center pointer-events-none px-3 sm:px-4 transition-all duration-300 ease-out",
          hideBottomDock ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}
        style={{
          bottom: "max(10px, env(safe-area-inset-bottom, 10px))"
        }}
      >
        <nav 
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          className="pointer-events-auto w-full max-w-md bg-white/80 dark:bg-[#141418]/85 border border-white/60 dark:border-white/10 rounded-[26px] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] p-1.5 transition-all select-none"
        >
          <div className="grid grid-cols-5 items-center gap-1">
            {/* 1. Chat */}
            <Link
              to="/chat"
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] py-1 px-0.5 rounded-[20px] transition-all duration-200 relative",
                isChatActive
                  ? "bg-white/95 dark:bg-white/15 text-blue-600 dark:text-blue-400 font-bold scale-[1.02] shadow-xs"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-white/5"
              )}
            >
              <MessageSquare className={cn("w-[18px] h-[18px] shrink-0 transition-transform", isChatActive ? "stroke-[2.25]" : "stroke-[1.75]")} />
              <span className="text-[10px] mt-0.5 leading-none tracking-tight font-medium">Chat</span>
              {isChatActive && <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />}
            </Link>

            {/* 2. Cases */}
            <Link
              to="/cases"
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] py-1 px-0.5 rounded-[20px] transition-all duration-200 relative",
                isCasesActive
                  ? "bg-white/95 dark:bg-white/15 text-blue-600 dark:text-blue-400 font-bold scale-[1.02] shadow-xs"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-white/5"
              )}
            >
              <Briefcase className={cn("w-[18px] h-[18px] shrink-0 transition-transform", isCasesActive ? "stroke-[2.25]" : "stroke-[1.75]")} />
              <span className="text-[10px] mt-0.5 leading-none tracking-tight font-medium">Ishlar</span>
              {isCasesActive && <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />}
            </Link>

            {/* 3. Documents */}
            <Link
              to="/documents"
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] py-1 px-0.5 rounded-[20px] transition-all duration-200 relative",
                isDocumentsActive
                  ? "bg-white/95 dark:bg-white/15 text-blue-600 dark:text-blue-400 font-bold scale-[1.02] shadow-xs"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-white/5"
              )}
            >
              <FileText className={cn("w-[18px] h-[18px] shrink-0 transition-transform", isDocumentsActive ? "stroke-[2.25]" : "stroke-[1.75]")} />
              <span className="text-[10px] mt-0.5 leading-none tracking-tight font-medium">Hujjatlar</span>
              {isDocumentsActive && <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />}
            </Link>

            {/* 4. Search */}
            <Link
              to="/search"
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] py-1 px-0.5 rounded-[20px] transition-all duration-200 relative",
                isSearchActive
                  ? "bg-white/95 dark:bg-white/15 text-blue-600 dark:text-blue-400 font-bold scale-[1.02] shadow-xs"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-white/5"
              )}
            >
              <Search className={cn("w-[18px] h-[18px] shrink-0 transition-transform", isSearchActive ? "stroke-[2.25]" : "stroke-[1.75]")} />
              <span className="text-[10px] mt-0.5 leading-none tracking-tight font-medium">Qidiruv</span>
              {isSearchActive && <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />}
            </Link>

            {/* 5. More / Profile */}
            <button
              type="button"
              onClick={() => setMoreMenuOpen(prev => !prev)}
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] py-1 px-0.5 rounded-[20px] transition-all duration-200 relative cursor-pointer",
                isMoreActive
                  ? "bg-white/95 dark:bg-white/15 text-blue-600 dark:text-blue-400 font-bold scale-[1.02] shadow-xs"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-white/5"
              )}
            >
              <div className="relative">
                <LayoutGrid className={cn("w-[18px] h-[18px] shrink-0 transition-transform", isMoreActive ? "stroke-[2.25]" : "stroke-[1.75]")} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 leading-none tracking-tight font-medium">Yana</span>
              {isMoreActive && <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, FileText, Trash2, Clock, Search, Filter, Loader2, Copy,
  Archive, RefreshCw, Edit3, Calendar, Layers, ArrowUpRight, Sparkles,
  ArrowUpDown, FolderDot, CheckCircle2, AlertTriangle, Scale, Compass,
  FileCheck, Shield, FolderOpen, Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DOCUMENT_TEMPLATES } from "../constants";
import { cn } from "@/src/lib/utils";
import { db } from "../firebase";
import {
  collection, query, where, orderBy, onSnapshot, deleteDoc, doc,
  limit, updateDoc, addDoc, getDocs
} from "firebase/firestore";
import { TemplateSelector } from "../components/TemplateSelector";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { logActivity } from "../services/activityService";
import { useAuth } from "../contexts/AuthContext";

// Category Constants
export const LEGAL_CATEGORIES = [
  "Arizalar",
  "Shikoyatlar",
  "Apellyatsiyalar",
  "Risk Tahlillari",
  "Strategiyalar",
  "Ekspertizalar",
  "Shartnomalar"
];

// Helper to determine document's category
export function getDocumentCategory(doc: any): string {
  if (doc.category && LEGAL_CATEGORIES.includes(doc.category)) {
    return doc.category;
  }
  
  const title = (doc.title || "").toLowerCase();
  const templateId = (doc.templateId || "").toLowerCase();
  const text = (doc.generatedText || doc.content || "").toLowerCase();

  if (title.includes("shartnoma") || templateId.includes("contract") || title.includes("bitim")) {
    return "Shartnomalar";
  }
  if (title.includes("shikoyat") || templateId.includes("shikoyat") || title.includes("e'tiroz")) {
    return "Shikoyatlar";
  }
  if (title.includes("apellyatsiya") || title.includes("appellate") || title.includes("apelyatsiya") || title.includes("kasatsiya")) {
    return "Apellyatsiyalar";
  }
  if (title.includes("risk") || title.includes("xavf") || title.includes("tahlil") || templateId.includes("risk") || doc.riskLevel || text.includes("kriminal") || text.includes("tahdid")) {
    return "Risk Tahlillari";
  }
  if (title.includes("strategiya") || title.includes("reja") || templateId.includes("strategy") || doc.strategy) {
    return "Strategiyalar";
  }
  if (title.includes("ekspert") || title.includes("expert") || title.includes("sinov") || templateId.includes("exper") || doc.expertise) {
    return "Ekspertizalar";
  }
  
  return "Arizalar";
}

// Categories visual themes
export const getCategoryTheme = (category: string) => {
  switch (category) {
    case "Arizalar":
      return {
        icon: FileText,
        colorClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30",
        badgeClass: "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/30",
        gradient: "from-blue-500 to-indigo-600",
        lightGlow: "shadow-blue-500/10"
      };
    case "Shikoyatlar":
      return {
        icon: AlertTriangle,
        colorClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
        badgeClass: "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/30",
        gradient: "from-amber-500 to-orange-600",
        lightGlow: "shadow-amber-500/10"
      };
    case "Apellyatsiyalar":
      return {
        icon: Scale,
        colorClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30",
        badgeClass: "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/30",
        gradient: "from-purple-500 to-pink-600",
        lightGlow: "shadow-purple-500/10"
      };
    case "Risk Tahlillari":
      return {
        icon: Shield,
        colorClass: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30",
        badgeClass: "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/30",
        gradient: "from-rose-500 to-red-600",
        lightGlow: "shadow-rose-500/10"
      };
    case "Strategiyalar":
      return {
        icon: Compass,
        colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
        badgeClass: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/30",
        gradient: "from-emerald-500 to-teal-600",
        lightGlow: "shadow-emerald-500/10"
      };
    case "Ekspertizalar":
      return {
        icon: Sparkles,
        colorClass: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20 border-cyan-100 dark:border-cyan-900/30",
        badgeClass: "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/30",
        gradient: "from-cyan-500 to-sky-600",
        lightGlow: "shadow-cyan-500/10"
      };
    case "Shartnomalar":
      return {
        icon: FileCheck,
        colorClass: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/30",
        badgeClass: "bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-900/30",
        gradient: "from-teal-500 to-green-600",
        lightGlow: "shadow-teal-500/10"
      };
    default:
      return {
        icon: FileText,
        colorClass: "text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800",
        badgeClass: "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-300 border-gray-200 dark:border-zinc-700",
        gradient: "from-gray-500 to-slate-600",
        lightGlow: "shadow-gray-500/10"
      };
  }
};

export function DocumentsPage({ user }: { user?: any }) {
  const navigate = useNavigate();
  const authContext = useAuth();
  const activeUid = user?.uid || authContext.uid || auth.currentUser?.uid || null;
  const authReady = authContext.authReady || Boolean(activeUid);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Barchasi");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "type">("newest");
  const [showArchived, setShowArchived] = useState(false);
  
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCaseId, setEditCaseId] = useState("");
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(Boolean(activeUid));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error"; visible: boolean }>({
    message: "",
    type: "success",
    visible: false
  });

  const showToastMsg = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Fetch Documents with explicit auth readiness and error safety
  useEffect(() => {
    if (!authReady) {
      // Waiting for auth readiness, but fail-safe release after 2 seconds
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }

    if (!activeUid) {
      // User is not signed in
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    // Defensive safety timeout: never hang the UI
    const timeoutTimer = setTimeout(() => {
      setLoading(false);
    }, 4500);

    const q = query(
      collection(db, "documents"),
      where("userId", "==", activeUid),
      limit(100)
    );

    console.log("[Firestore] listener attached: Documents List");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(timeoutTimer);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDocuments(docs);
      setLoadError(null);
      setLoading(false);
    }, (error: any) => {
      clearTimeout(timeoutTimer);
      console.error("[Firestore] documents onSnapshot error:", error);
      const isPermission = error?.code === "permission-denied" || error?.message?.includes("Missing or insufficient permissions");
      const isIndex = error?.message?.includes("index");
      if (isIndex) {
        setLoadError(`Firestore composite index talab qilinmoqda: ${error.message}`);
      } else if (isPermission) {
        setLoadError("Hujjatlarga kirish uchun ruxsat berilmadi (Ruxsat rad etildi).");
      } else {
        setLoadError("Hujjatlarni yuklashda tarmoq xatoligi yuz berdi.");
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutTimer);
      unsubscribe();
      console.log("[Firestore] listener detached: Documents List");
    };
  }, [activeUid, authReady, retryKey]);

  // Fetch Cases for linking dropdown
  useEffect(() => {
    if (!activeUid) return;
    const qCases = query(collection(db, "cases"), where("userId", "==", activeUid));
    console.log("[Firestore] listener attached: Documents Cases Link");
    const unsubscribe = onSnapshot(qCases, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCases(items);
    }, (error) => {
      console.error("[Firestore] cases link onSnapshot error:", error);
    });
    return () => {
      unsubscribe();
      console.log("[Firestore] listener detached: Documents Cases Link");
    };
  }, [activeUid]);

  const getDocDate = (doc: any) => {
    if (doc.createdAt?.seconds) return doc.createdAt.seconds * 1000;
    if (doc.createdAt?.toMillis) return doc.createdAt.toMillis();
    if (typeof doc.createdAt === "number") return doc.createdAt;
    if (doc.createdAt instanceof Date) return doc.createdAt.getTime();
    return 0;
  };

  const getDocModifiedDate = (doc: any) => {
    if (doc.updatedAt?.seconds) return doc.updatedAt.seconds * 1000;
    if (doc.updatedAt?.toMillis) return doc.updatedAt.toMillis();
    if (typeof doc.updatedAt === "number") return doc.updatedAt;
    if (doc.updatedAt instanceof Date) return doc.updatedAt.getTime();
    return getDocDate(doc);
  };

  const handleArchive = async (id: string, docTitle: string) => {
    try {
      await updateDoc(doc(db, "documents", id), {
        archived: true,
        updatedAt: Date.now()
      });
      showToastMsg("Hujjat arxivlandi", "info");
      await logActivity("document_archive", "Hujjat arxivlandi", `"${docTitle}" hujjati arxivlandi.`);
    } catch (error) {
      console.error("Archive error:", error);
      showToastMsg("Arxivlashda xatolik yuz berdi", "error");
    }
  };

  const handleRestore = async (id: string, docTitle: string) => {
    try {
      await updateDoc(doc(db, "documents", id), {
        archived: false,
        updatedAt: Date.now()
      });
      showToastMsg("Hujjat arxivdan qaytarildi", "success");
      await logActivity("document_create", "Hujjat qaytarildi", `"${docTitle}" hujjati arxivdan tiklandi.`);
    } catch (error) {
      console.error("Restore error:", error);
      showToastMsg("Tiklashda xatolik yuz berdi", "error");
    }
  };

  const handleDuplicate = async (docItem: any) => {
    try {
      const cat = getDocumentCategory(docItem);
      const cleanTitle = (docItem.title || "Hujjat").replace(" (Nusxa)", "");
      const clonedTitle = `${cleanTitle} (Nusxa)`;

      const newDoc = {
        userId: activeUid,
        title: clonedTitle,
        category: cat,
        caseId: docItem.caseId || null,
        templateId: docItem.templateId || "",
        inputData: docItem.inputData || {},
        generatedText: docItem.generatedText || docItem.content || "",
        language: docItem.language || "uz_lat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false
      };

      const added = await addDoc(collection(db, "documents"), newDoc);
      showToastMsg("Hujjat muvaffaqiyatli dublicate qilindi", "success");
      await logActivity(
        "document_create", 
        "Hujjat nusxalandi", 
        `"${clonedTitle}" yangi nusxa hujjati dublicate qilindi.`
      );
    } catch (error) {
      console.error("Duplicate error:", error);
      showToastMsg("Nusxalashda xatolik yuz berdi", "error");
    }
  };

  const handleDelete = async (id: string, docTitle: string) => {
    if (window.confirm("Hujjatni butunlay o'chirib tashlamoqchimisiz? Ushbu amaldan so'ng hujjatni qayta tiklab bo'lmaydi.")) {
      try {
        await deleteDoc(doc(db, "documents", id));
        showToastMsg("Hujjat butunlay o'chirildi", "success");
        await logActivity("case_delete", "Hujjat o'chirildi", `"${docTitle}" hujjati butunlay o'chirildi.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
        showToastMsg("O'chirishda xatolik yuz berdi", "error");
      }
    }
  };

  const handleRenameSave = async () => {
    if (!editingDoc) return;
    if (!editTitle.trim()) {
      showToastMsg("Hujjat nomi bo'sh bo'lishi mumkin emas", "error");
      return;
    }

    try {
      const originalTitle = editingDoc.title || "Hujjat";
      const updates: any = {
        title: editTitle.trim(),
        category: editCategory,
        caseId: editCaseId || null,
        updatedAt: Date.now()
      };
      
      await updateDoc(doc(db, "documents", editingDoc.id), updates);
      showToastMsg("O'zgarishlar saqlandi", "success");
      setEditingDoc(null);
      await logActivity(
        "document_create", 
        "Hujjat tahrirlandi", 
        `"${originalTitle}" hujjati yangi nomlanishga o'tkazildi: "${editTitle.trim()}" (${editCategory}).`
      );
    } catch (error) {
      console.error("Saving document metadata error:", error);
      showToastMsg("Saqlashda xatolik yuz berdi", "error");
    }
  };

  const filteredAndSortedDocs = documents
    .filter(doc => {
      const isDocArchived = doc.archived === true;
      if (showArchived !== isDocArchived) return false;

      const cat = getDocumentCategory(doc);
      const matchesCategory = selectedCategory === "Barchasi" || cat === selectedCategory;

      const template = DOCUMENT_TEMPLATES.find(t => t.id === doc.templateId);
      const lang = doc.language || "uz_lat";
      const templateTitleFallback = template?.name[lang as keyof typeof template.name] || "";
      const currentTitle = doc.title || templateTitleFallback || "Hujjat";
      const matchesSearch = currentTitle.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return getDocDate(b) - getDocDate(a);
      } else if (sortBy === "oldest") {
        return getDocDate(a) - getDocDate(b);
      } else if (sortBy === "type") {
        const catA = getDocumentCategory(a);
        const catB = getDocumentCategory(b);
        return catA.localeCompare(catB);
      }
      return 0;
    });

  const totalActive = documents.filter(d => !d.archived).length;
  const totalArchived = documents.filter(d => d.archived).length;

  const categoryActiveCounts = LEGAL_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = documents.filter(d => !d.archived && getDocumentCategory(d) === cat).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-zinc-950/50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-sm font-semibold text-gray-500 dark:text-zinc-400 font-sans tracking-wide">Hujjatlar yuklanmoqda...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-zinc-950/50">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/40 text-center shadow-lg">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-2">Hujjatlarni yuklashda xatolik yuz berdi</h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">{loadError}</p>
          <button
            onClick={() => setRetryKey(k => k + 1)}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f8fafc] dark:bg-zinc-950 overflow-hidden">
      {/* Background glass blur elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-10s/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-10s/15 blur-[100px] pointer-events-none" />

      {/* Floating toast alerts */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={cn(
              "fixed top-20 right-6 z-55 max-w-sm p-4 rounded-xl shadow-xl flex items-center gap-3 border backdrop-blur-md font-sans text-xs font-semibold",
              toast.type === "success" && "bg-white/80 dark:bg-zinc-900/80 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 shadow-emerald-100 dark:shadow-none",
              toast.type === "info" && "bg-white/80 dark:bg-zinc-900/80 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-400 shadow-blue-100 dark:shadow-none",
              toast.type === "error" && "bg-white/80 dark:bg-zinc-900/80 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-400 shadow-red-100 dark:shadow-none"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-lg shrink-0",
              toast.type === "success" && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
              toast.type === "info" && "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
              toast.type === "error" && "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
            )}>
              {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </div>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 font-sans">
        
        {/* Template Selector trigger */}
        <TemplateSelector isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} />

        {/* Header Board */}
        <div className="backdrop-blur-xl bg-white/50 dark:bg-zinc-900/40 border border-white/60 dark:border-zinc-800/80 p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] mb-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 border border-blue-100/50 dark:border-zinc-700 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3 font-sans">
                <Sparkles className="w-3.5 h-3.5" /> Hujjatlar Markazi
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight sm:text-3xl">
                Raqamli Hujjatlar Markazi
              </h1>
              <p className="mt-2 text-slate-500 dark:text-zinc-400 max-w-2xl font-normal leading-relaxed text-sm">
                Yuridik hujjatlarni markaziy saqlash, professional boshqarish, ishlarga biriktirish hamda protsessual tizimlash interfeysi.
              </p>
            </div>
            
            <button
              onClick={() => setIsSelectorOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3.5 border border-transparent text-xs font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none transform active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Yangi hujjat yaratish
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-200/50 dark:border-zinc-800">
            <div className="bg-white/45 dark:bg-zinc-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/80 dark:border-zinc-800/40 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Jami Hujjatlar</span>
              <span className="text-xl font-black text-slate-800 dark:text-zinc-100 block mt-1">{documents.length} ta</span>
            </div>
            <div className="bg-white/45 dark:bg-zinc-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/80 dark:border-zinc-800/40 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Faol Hujjatlar</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 block mt-1">{totalActive} ta</span>
            </div>
            <div className="bg-white/45 dark:bg-zinc-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/80 dark:border-zinc-800/40 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Arxivlanmoqda</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 block mt-1">{totalArchived} ta</span>
            </div>
            <div className="bg-white/45 dark:bg-zinc-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/80 dark:border-zinc-800/40 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Ma'lumotlar sinxi</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">Real-time</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar / Category Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Main Category Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Active vs Archived Selector */}
            <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/70 dark:border-zinc-800/60 shadow-xs flex gap-1">
              <button
                onClick={() => {
                  setShowArchived(false);
                  setSelectedCategory("Barchasi");
                }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointerBilling",
                  !showArchived ? "bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-400 shadow-xs" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Faol ({totalActive})
              </button>
              <button
                onClick={() => {
                  setShowArchived(true);
                  setSelectedCategory("Barchasi");
                }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointerBilling",
                  showArchived ? "bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-400 shadow-xs" : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                <Archive className="w-3.5 h-3.5" />
                Arxiv ({totalArchived})
              </button>
            </div>

            {/* Category Listing Card */}
            <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/70 dark:border-zinc-800/60 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-blue-500" />
                  Kategoriyalar
                </h3>
              </div>
              
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory("Barchasi")}
                  className={cn(
                    "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                    selectedCategory === "Barchasi" 
                      ? "bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-sm font-bold" 
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <FolderDot className="w-4 h-4 shrink-0" />
                    Barchasi
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    selectedCategory === "Barchasi" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                  )}>
                    {showArchived ? totalArchived : totalActive}
                  </span>
                </button>

                {LEGAL_CATEGORIES.map((cat) => {
                  const theme = getCategoryTheme(cat);
                  const CatIcon = theme.icon;
                  const activeCount = categoryActiveCounts[cat] || 0;
                  const archivedCount = documents.filter(d => d.archived && getDocumentCategory(d) === cat).length;
                  const currentDisplayCount = showArchived ? archivedCount : activeCount;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        selectedCategory === cat 
                          ? "bg-blue-600 dark:bg-blue-600 text-white shadow-sm font-bold" 
                          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200"
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <CatIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{cat}</span>
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                        selectedCategory === cat ? "bg-white/35 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                      )}>
                        {currentDisplayCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            
            {/* Filter controls */}
            <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md p-5 rounded-3xl border border-white/70 dark:border-zinc-800/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Search documents */}
              <div className="relative w-full sm:w-auto sm:flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Hujjat nomini qidiruvga bering..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm shadow-xs"
                />
              </div>

              {/* Sorting triggers */}
              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                <span className="text-[11px] font-extrabold text-slate-400 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Saralash:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-xs"
                >
                  <option value="newest">Yangi kiritilgan</option>
                  <option value="oldest">Eskilar</option>
                  <option value="type">Kategoriya bo'yicha</option>
                </select>
              </div>

            </div>

            {/* Documents List */}
            <div className="space-y-4">
              {filteredAndSortedDocs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredAndSortedDocs.map((docItem, idx) => {
                    const mappedCategory = getDocumentCategory(docItem);
                    const catTheme = getCategoryTheme(mappedCategory);
                    const CatIcon = catTheme.icon;
                    const createdTime = getDocDate(docItem);
                    const modifiedTime = getDocModifiedDate(docItem);
                    const lang = docItem.language || "uz_lat";
                    
                    const template = DOCUMENT_TEMPLATES.find(t => t.id === docItem.templateId);
                    const visualTitle = docItem.title || template?.name[lang as keyof typeof template.name] || "Hujjat";

                    const linkedCase = cases.find(c => c.id === docItem.caseId);

                    return (
                      <motion.div
                        key={docItem.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/80 dark:border-zinc-800/80 shadow-xs transition-all duration-300 hover:shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-6 group relative overflow-hidden"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b",
                          catTheme.gradient
                        )} />

                        <div className="flex items-start md:items-center gap-4 relative">
                          <div className={cn(
                            "p-3.5 rounded-2xl shrink-0 border",
                            catTheme.colorClass
                          )}>
                            <CatIcon className="w-5 h-5" />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {visualTitle}
                              </h3>
                              
                              <span className={cn(
                                "text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border",
                                catTheme.badgeClass
                              )}>
                                {mappedCategory}
                              </span>
                            </div>

                            {/* Case Link Banner */}
                            {linkedCase && (
                              <div className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold border border-indigo-100 dark:border-indigo-900/30">
                                <LinkIcon className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                                <span>Ilova qilinishi: {linkedCase.title}</span>
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {createdTime ? new Date(createdTime).toLocaleDateString() : "Hozirgina"}
                              </span>
                              {modifiedTime && modifiedTime !== createdTime && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Tahrirlangan: {new Date(modifiedTime).toLocaleDateString()}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 border border-emerald-100 dark:border-emerald-900/30 rounded">
                                <CheckCircle2 className="w-3 h-3" /> Tayyor
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions menu */}
                        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 dark:border-zinc-800 md:border-transparent pt-3 md:pt-0 shrink-0">
                          
                          <Link
                             to={`/result/${docItem.id}`}
                             className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-zinc-950 transition-all shadow-xs"
                             title="Ochish"
                          >
                            Tahrirlash
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => {
                              setEditingDoc(docItem);
                              setEditTitle(visualTitle);
                              setEditCategory(mappedCategory);
                              setEditCaseId(docItem.caseId || "");
                            }}
                            className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/50"
                            title="Nomini & ishini o'zgartirish"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDuplicate(docItem)}
                            className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/50"
                            title="Nusxa nusxalash"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {!showArchived ? (
                            <button
                              onClick={() => handleArchive(docItem.id, visualTitle)}
                              className="p-2 text-slate-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 rounded-xl transition-all border border-transparent hover:border-amber-100 dark:hover:border-amber-900/30"
                              title="Arxivlash"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(docItem.id, visualTitle)}
                              className="p-2 text-amber-600 dark:text-amber-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-all border border-transparent"
                              title="Arxivdan chiqarish"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(docItem.id, visualTitle)}
                            className="p-2 text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all border border-transparent"
                            title="Butunlay o'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 shadow-xs">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">
                    {documents.length === 0 ? "Hozircha hujjatlar yo‘q." : "Hujjatlar topilmadi"}
                  </h3>
                  <p className="text-slate-400 dark:text-zinc-400 text-xs mt-1 max-w-xs mx-auto">
                    {documents.length === 0
                      ? "Yangi huquqiy hujjat yaratish uchun pastdagi tugmani bosing."
                      : "Kategoriya yoki so'rovga mos hujjat saqlanmagan. Iltimos barchasini ko'rish yoki yangi loyiha yaratish uchun tugmani bosing."}
                  </p>
                  
                  <div className="mt-6 flex justify-center gap-3">
                    {documents.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedCategory("Barchasi");
                          setSearchQuery("");
                        }}
                        className="px-4 py-2 border border-slate-200 dark:border-zinc-700 text-xs font-semibold rounded-xl text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                      >
                        Kategoriyani tozalash
                      </button>
                    )}
                    <button
                      onClick={() => setIsSelectorOpen(true)}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs cursor-pointer"
                    >
                      Hujjat yaratish
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Editor Modal Dialog */}
      <AnimatePresence>
        {editingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDoc(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden relative z-10"
            >
              <div className="px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/20">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs uppercase tracking-wider">Hujjat sozlamalari</span>
                </div>
                <button
                  onClick={() => setEditingDoc(null)}
                  className="p-1 px-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Hujjat nomi</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Hujjat nomi..."
                    maxLength={120}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-xs"
                  />
                </div>

                {/* Categories */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Kategoriya</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-xs cursor-pointer"
                  >
                    {LEGAL_CATEGORIES.map(category => (
                      <option key={category} value={category} className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Association to Case Link */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Ish papkasiga biriktirish (Legal Case)</label>
                  <select
                    value={editCaseId}
                    onChange={(e) => setEditCaseId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl text-xs cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">-- Biriktirilmagan (Mustaqil) --</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
                        {c.title} ({c.category || "Umumiy"})
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleRenameSave}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs cursor-pointer"
                >
                  Saqlash
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

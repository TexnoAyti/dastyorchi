import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Settings, Shield, CreditCard, Lock, Loader2, Save, 
  Users, Sparkles, Crown, Search, RefreshCw, Check,
  BarChart3, LayoutDashboard, Coins, TrendingUp, AlertCircle, 
  Phone, UserX, UserCheck, Trash2, Plus, Megaphone, X, Menu,
  Layers, CheckCircle, Zap, ShieldCheck, Clock, AlertTriangle,
  Cpu, Server, Activity, ArrowUpRight
} from "lucide-react";
import { db, auth } from "../firebase";
import { 
  doc, getDoc, setDoc, updateDoc, collection, 
  getDocs, addDoc, deleteDoc, serverTimestamp,
  query, limit, orderBy
} from "firebase/firestore";
import { 
  getPlanLimits, savePlanLimits, PlanLimits, DEFAULT_PLAN_LIMITS, SubscriptionTier 
} from "../services/subscriptionService";
import { getApiAuthorizationHeader } from "../services/apiAuth";

interface Plan {
  id: string;
  name: string;
  price: number;
  priceUZS: number;
  requestLimit: number;
  exportLimit: number;
  features: string[];
  isEnabled: boolean;
}

export function AdminPanel({ user }: { user?: any }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "subscriptions" | "features" | "payments" | "notifications" | "errorMonitor" | "aiAnalytics">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data State
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [planLimits, setPlanLimits] = useState<PlanLimits>(DEFAULT_PLAN_LIMITS);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [aiAnalytics, setAiAnalytics] = useState<any | null>(null);
  const [loadingAiAnalytics, setLoadingAiAnalytics] = useState(false);
  
  // Loading flags
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [isSavingLimits, setIsSavingLimits] = useState(false);
  const [isSendingAnn, setIsSendingAnn] = useState(false);

  // Filter & Search states
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | "pending" | "approved" | "declined">("all");

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const USERS_PER_PAGE = 25;
  const PAYMENTS_PER_PAGE = 25;

  // Selected for edits
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<Partial<Plan>>({
    id: "",
    name: "",
    price: 0,
    priceUZS: 0,
    requestLimit: 10,
    exportLimit: 3,
    features: [],
    isEnabled: true
  });

  // Announcement state
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success"
  });

  // Load and cache all resources
  const loadAllData = async () => {
    setLoadingStats(true);
    try {
      // 1. Fetch Users (Hardened with limit to prevent excessive reads)
      const usersQuery = query(collection(db, "users"), limit(200));
      const usersSnap = await getDocs(usersQuery);
      const usersList: any[] = [];
      usersSnap.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(usersList);

      // 2. Fetch Payments (Hardened with limit to prevent excessive reads)
      const payQuery = query(collection(db, "paymentRequests"), limit(200));
      const paySnap = await getDocs(payQuery);
      const payList: any[] = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      payList.sort((a, b) => {
        const t1 = a.createdAt?.seconds || 0;
        const t2 = b.createdAt?.seconds || 0;
        return t2 - t1;
      });
      setPayments(payList);

      // 3. Fetch Dynamic Plans
      const plansDoc = await getDoc(doc(db, "internal", "plans"));
      if (plansDoc.exists()) {
        setPlans(plansDoc.data().plans || []);
      } else {
        // Populate standard defaults if empty
        const defaultPlans: Plan[] = [
          { id: "free", name: "Bepul (Free)", price: 0, priceUZS: 0, requestLimit: 10, exportLimit: 3, features: [], isEnabled: true },
          { id: "pro", name: "Pro Premium", price: 19.99, priceUZS: 250000, requestLimit: 100, exportLimit: 15, features: ["riskAnalysis", "strategyPlan", "aiExpertise"], isEnabled: true },
          { id: "business", name: "Business", price: 49.99, priceUZS: 630000, requestLimit: 300, exportLimit: 100, features: ["riskAnalysis", "strategyPlan", "aiExpertise", "advancedLegalAnalysis", "priorityProcessing"], isEnabled: true }
        ];
        await setDoc(doc(db, "internal", "plans"), { plans: defaultPlans });
        setPlans(defaultPlans);
      }

      // 4. Fetch Announcements
      const annSnap = await getDocs(collection(db, "announcements"));
      const annList = annSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      annList.sort((a: any, b: any) => {
        const t1 = a.createdAt?.seconds || 0;
        const t2 = b.createdAt?.seconds || 0;
        return t2 - t1;
      });
      setAnnouncements(annList);

      // 5. Fetch Matrix Limits
      const matrixLimits = await getPlanLimits();
      setPlanLimits(matrixLimits);

      // 6. Fetch System Logs for the Error Monitor Dashboard (Hardened with limit)
      try {
        const logsQuery = query(collection(db, "system_logs"), limit(50));
        const logsSnap = await getDocs(logsQuery);
        const logsList: any[] = [];
        logsSnap.forEach((docSnap) => {
          logsList.push({ id: docSnap.id, ...docSnap.data() });
        });
        logsList.sort((a, b) => {
          const t1 = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : Number(a.timestamp) || 0;
          const t2 = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : Number(b.timestamp) || 0;
          return t2 - t1;
        });
        setSystemLogs(logsList);
      } catch (errLogs) {
        console.error("Failed to sync system logs inside Admin Dashboard:", errLogs);
      }

      // 7. Fetch AI Gateway Analytics
      await fetchAiAnalytics();

    } catch (err) {
      console.error("Critical Admin sync error: ", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAiAnalytics = async () => {
    setLoadingAiAnalytics(true);
    try {
      const headers = await getApiAuthorizationHeader();
      const res = await fetch("/api/admin/ai-analytics", { headers });
      if (res.ok) {
        const data = await res.json();
        setAiAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to load AI analytics:", err);
    } finally {
      setLoadingAiAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === "aiAnalytics") {
      fetchAiAnalytics();
    }
  }, [activeTab]);

  useEffect(() => {
    const runVerification = async () => {
      if (user) {
        setIsAdmin(user.role === "admin");
        setLoading(false);
        return;
      }
      const token = localStorage.getItem("dastyorchi_session_token");
      if (!token && !auth.currentUser) {
        setLoading(false);
        return;
      }
      try {
        const uid = user?.uid || auth.currentUser?.uid;
        if (uid) {
          const ref = doc(db, "users", uid);
          const snap = await getDoc(ref);
          if (snap.exists() && snap.data().role === "admin") {
            setIsAdmin(true);
          }
        }
      } catch (e) {
        console.error("Admin role verification issue: ", e);
      } finally {
        setLoading(false);
      }
    };
    runVerification();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  // Auth Redirection
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-400 mt-4 text-xs font-mono">Ma'murlar tarmog'i sinxronlashtirilmoqda...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Shield className="w-12 h-12 text-red-500 animate-bounce" />
        <p className="text-slate-400 mt-4 text-xs font-semibold">Taqiqlangan hudud. Bosh sahifaga qaytishingiz kutilmoqda...</p>
      </div>
    );
  }

  // Statistics calculation helpers
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.subscriptionStatus === "active" && !u.blocked).length;
  const freeUsers = users.filter(u => !u.subscriptionTier || u.subscriptionTier === "free").length;
  const proUsers = users.filter(u => u.subscriptionTier === "pro").length;
  const businessUsers = users.filter(u => u.subscriptionTier === "business").length;
  
  const totalRequestsToday = users.reduce((acc, u) => acc + (Number(u.requestsToday) || 0), 0);
  const totalExportsToday = users.reduce((acc, u) => acc + (Number(u.exportsToday) || 0), 0);

  const approvedInvoices = payments.filter(p => p.status === "approved");
  const pendingInvoicesCount = payments.filter(p => p.status === "pending").length;
  const totalRevenue = approvedInvoices.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  
  // Calculate est. monthly recurring revenue: UZS (pro = 250,000, biz = 630,000)
  const estimatedMRR = (proUsers * 250000) + (businessUsers * 630000);

  // User Actions
  const handleUpdateUserStatus = async (userObj: any, updates: any) => {
    try {
      const headers = await getApiAuthorizationHeader();
      const res = await fetch("/api/admin/user-action", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          targetUserId: userObj.id,
          action: "update",
          updates
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Foydalanuvchini yangilash muvaffaqiyatsiz bo'ldi");
      }

      alert("Foydalanuvchi ma'lumoti muvaffaqiyatli saqlandi.");
      
      // Update local state smoothly
      setUsers(prev => prev.map(u => u.id === userObj.id ? { ...u, ...updates } : u));
      if (selectedUser && selectedUser.id === userObj.id) {
        setSelectedUser({ ...selectedUser, ...updates });
      }
    } catch (e: any) {
      alert("Foydalanuvchini yangilashda xatolik: " + e.message);
    }
  };

  const handleBlockToggle = async (userObj: any) => {
    const isBlocking = !userObj.blocked;
    const confirmMsg = isBlocking 
      ? `Haqiqatan ham ${userObj.email || userObj.displayName || userObj.id} hisobini bloklamoqchisiz?` 
      : `${userObj.email || userObj.displayName || userObj.id} hisobini blokdan chiqarmoqchisiz?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const headers = await getApiAuthorizationHeader();
      const res = await fetch("/api/admin/user-action", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          targetUserId: userObj.id,
          action: isBlocking ? "block" : "unblock"
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Blok holatini o'zgartirish muvaffaqiyatsiz bo'ldi");
      }

      const updates = { blocked: isBlocking };
      setUsers(prev => prev.map(u => u.id === userObj.id ? { ...u, ...updates } : u));
      if (selectedUser && selectedUser.id === userObj.id) {
        setSelectedUser({ ...selectedUser, ...updates });
      }
      alert(isBlocking ? "Foydalanuvchi bloklandi." : "Foydalanuvchi blokdan chiqarildi.");
    } catch (e: any) {
      alert("Blok holatini o'zgartirishda xatolik: " + e.message);
    }
  };

  const handleResetLimits = async (userObj: any) => {
    if (!window.confirm(`${userObj.email || userObj.displayName || userObj.id} uchun bugungi limitlarni nollamoqchisiz?`)) return;
    try {
      const headers = await getApiAuthorizationHeader();
      const res = await fetch("/api/admin/user-action", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          targetUserId: userObj.id,
          action: "reset_limits"
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Limitlarni nollash muvaffaqiyatsiz bo'ldi");
      }

      const updates = { requestsToday: 0, exportsToday: 0, aiCreditsUsedToday: 0 };
      setUsers(prev => prev.map(u => u.id === userObj.id ? { ...u, ...updates } : u));
      if (selectedUser && selectedUser.id === userObj.id) {
        setSelectedUser({ ...selectedUser, ...updates });
      }
      alert("Limitlar muvaffaqiyatli nollashtirildi.");
    } catch (e: any) {
      alert("Limitlarni nollashda xatolik: " + e.message);
    }
  };

  // Payment Actions
  const handleApprovePayment = async (payReq: any) => {
    if (!window.confirm(`Ushbu ${payReq.amount ? payReq.amount.toLocaleString() : ""}lik to'lovni tasdiqlab, faollashtirmoqchisiz?`)) return;
    try {
      const headers = await getApiAuthorizationHeader();
      const res = await fetch("/api/admin/payment-action", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentId: payReq.id,
          action: "approve"
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "To'lovni tasdiqlash muvaffaqiyatsiz bo'ldi");
      }

      alert("To'lov tasdiqlandi va obuna faollashtirildi!");
      loadAllData();
    } catch (e: any) {
      alert("Tasdiqlashda xatolik yuz berdi: " + e.message);
    }
  };

  const handleDeclinePayment = async (payReqId: string) => {
    if (!window.confirm("Haqiqatan ham ushbu to'lov so'rovini rad etmoqchisiz?")) return;
    try {
      const headers = await getApiAuthorizationHeader();
      const res = await fetch("/api/admin/payment-action", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentId: payReqId,
          action: "decline"
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "To'lovni rad etish muvaffaqiyatsiz bo'ldi");
      }

      alert("So'rov rad etildi.");
      loadAllData();
    } catch (e: any) {
      alert("Rad etishda xatolik: " + e.message);
    }
  };

  // Plan actions (SaaS Subscription settings)
  const handleSavePlansCollection = async (updatedPlans: Plan[]) => {
    try {
      setLoadingPlans(true);
      await setDoc(doc(db, "internal", "plans"), { plans: updatedPlans });
      setPlans(updatedPlans);
      
      // Also sync limits in subscription constraints if standard tiers were modified
      const matrixUpdates: Partial<PlanLimits> = {};
      const freeP = updatedPlans.find(p => p.id === "free");
      const proP = updatedPlans.find(p => p.id === "pro");
      const bizP = updatedPlans.find(p => p.id === "business");

      if (freeP) {
        matrixUpdates.freeRequestLimit = Number(freeP.requestLimit);
        matrixUpdates.freeExportLimit = Number(freeP.exportLimit);
      }
      if (proP) {
        matrixUpdates.proRequestLimit = Number(proP.requestLimit);
        matrixUpdates.proExportLimit = Number(proP.exportLimit);
      }
      if (bizP) {
        matrixUpdates.businessRequestLimit = Number(bizP.requestLimit);
        matrixUpdates.businessExportLimit = Number(bizP.exportLimit);
      }

      const mergedLimits = { ...planLimits, ...matrixUpdates };
      await savePlanLimits(mergedLimits);
      setPlanLimits(mergedLimits);

      alert("Tarif sozlamalari muvaffaqiyatli saqlandi!");
    } catch (e: any) {
      alert("Tarifni saqlashda xatolik: " + e.message);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleOpenPlanModal = (plan?: Plan) => {
    if (plan) {
      setSelectedPlan(plan);
      setPlanForm({ ...plan });
    } else {
      setSelectedPlan(null);
      setPlanForm({
        id: "",
        name: "",
        price: 0,
        priceUZS: 0,
        requestLimit: 50,
        exportLimit: 10,
        features: [],
        isEnabled: true
      });
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlanForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.id || !planForm.name) {
      alert("ID va tarif nomi kiritilishi shart!");
      return;
    }

    let updatedList: Plan[] = [];
    if (selectedPlan) {
      // Edit mode
      updatedList = plans.map(p => p.id === selectedPlan.id ? (planForm as Plan) : p);
    } else {
      // Add mode
      if (plans.some(p => p.id === planForm.id)) {
        alert("Bunday identifikatorli (ID) tarif allaqachon mavjud!");
        return;
      }
      updatedList = [...plans, planForm as Plan];
    }

    await handleSavePlansCollection(updatedList);
    setIsPlanModalOpen(false);
  };

  const handleDeletePlanObj = async (planId: string) => {
    if (["free", "pro", "business"].includes(planId)) {
      alert("Tizimning asosiy tariflarini (Free, Pro, Business) o'chirib bo'lmaydi.");
      return;
    }
    if (!window.confirm("Haqiqatan ham ushbu tarif rejasini yo'q qilmoqchisiz?")) return;
    
    const updatedList = plans.filter(p => p.id !== planId);
    await handleSavePlansCollection(updatedList);
  };

  // Feature Limits Matrix
  const toggleFeatureMatrix = (featureKey: keyof PlanLimits["features"], tier: SubscriptionTier) => {
    const list = [...(planLimits.features[featureKey] || [])];
    let newList;
    if (list.includes(tier)) {
      newList = list.filter(t => t !== tier);
    } else {
      newList = [...list, tier];
    }
    setPlanLimits({
      ...planLimits,
      features: {
        ...planLimits.features,
        [featureKey]: newList
      }
    });
  };

  const handleSaveFeatureMatrix = async () => {
    setIsSavingLimits(true);
    try {
      await savePlanLimits(planLimits);
      alert("Funktsional imkoniyatlar matoritsasi muvaffaqiyatli saqlandi!");
    } catch (e: any) {
      alert("Xatolik: " + e.message);
    } finally {
      setIsSavingLimits(false);
    }
  };

  // Announcement Actions
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      alert("Sarlavha va xabar mazmuni bo'sh bo'lishi mumkin emas!");
      return;
    }

    setIsSendingAnn(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        type: announcementForm.type,
        createdAt: serverTimestamp(),
        sentBy: auth.currentUser?.email || "Admin"
      });

      alert("E'lon barcha foydalanuvchilarga tarqatildi!");
      setAnnouncementForm({
        title: "",
        message: "",
        type: "info"
      });
      loadAllData();
    } catch (e: any) {
      alert("E'lon tarqatishda xatolik: " + e.message);
    } finally {
      setIsSendingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!window.confirm("Ushbu e'lonni butunlay o'chirib tashlamoqchisiz?")) return;
    try {
      await deleteDoc(doc(db, "announcements", annId));
      alert("E'lon o'chirildi.");
      loadAllData();
    } catch (e: any) {
      alert("O'chirishda xatolik: " + e.message);
    }
  };

  // InMemory user filter
  const filteredUsers = users.filter(u => {
    const q = userSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.displayName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.uid || "").toLowerCase().includes(q)
    );
  });

  // User pagination
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  // InMemory payment filter
  const filteredPayments = payments.filter(p => {
    if (paymentStatusFilter === "all") return true;
    return p.status === paymentStatusFilter;
  });

  // Payment pagination
  const totalPaymentPages = Math.max(1, Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE));
  const paginatedPayments = filteredPayments.slice((paymentPage - 1) * PAYMENTS_PER_PAGE, paymentPage * PAYMENTS_PER_PAGE);

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full max-w-full bg-slate-950 flex flex-col lg:flex-row text-white select-none relative font-sans overflow-hidden">
      
      {/* Mobile Header Nav bar */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="font-extrabold text-sm tracking-wide">Dastyorchi SaaS</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Modern Sidebar with Glass Overlap */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-md border-r border-white/10 py-6 px-4 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:h-full lg:shrink-0
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="space-y-6">
          
          {/* Visual Header */}
          <div className="hidden lg:flex items-center gap-3 px-2 pb-4 border-b border-white/5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-sm tracking-tight text-white leading-none">SaaS Admin Panel</p>
              <p className="text-[10px] text-slate-400 mt-1">Platforma Ma'muriyati</p>
            </div>
          </div>

          {/* Nav items */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "dashboard" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Bosh rasm (Dashboard)</span>
            </button>

            <button
              onClick={() => { setActiveTab("users"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "users" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Foydalanuvchilar ({users.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("subscriptions"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "subscriptions" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tarif Obunalari ({plans.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("features"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "features" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Imkoniyatlar Tizimi</span>
            </button>

            <button
              onClick={() => { setActiveTab("aiAnalytics"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "aiAnalytics" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/40" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>AI Gateway & Analitika</span>
            </button>

            <button
              onClick={() => { setActiveTab("payments"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "payments" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>To'lov Arizalari {pendingInvoicesCount > 0 && <span className="ml-auto bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">{pendingInvoicesCount}</span>}</span>
            </button>

            <button
              onClick={() => { setActiveTab("notifications"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "notifications" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>E'lonlar Tarqatish ({announcements.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("errorMonitor"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === "errorMonitor" ? "bg-red-600 text-white shadow-lg shadow-red-600/40" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Xatoliklar Monitori ({systemLogs.length})</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => loadAllData()}
            disabled={loadingStats}
            className="w-full flex items-center justify-center gap-1.5 py-2 hover:bg-white/5 border border-white/10 text-xs font-medium rounded-xl text-slate-300 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`} />
            Ma'lumotlarni yangilash
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all border border-slate-700 text-center block"
          >
            Chiqish (Asosiy Oyna)
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 bg-slate-950 overflow-y-auto h-full min-h-0 min-w-0">
        
        {/* Dynamic header summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeTab === "dashboard" && "SaaS Boshqaruv Markazi"}
              {activeTab === "users" && "SaaS Foydalanuvchilari"}
              {activeTab === "subscriptions" && "Tarif Obunalari Konstruktori"}
              {activeTab === "features" && "Funksiyalar va Quvvat Matritsa"}
              {activeTab === "aiAnalytics" && "Gemini AI Gateway & Kreditlar Analitikasi"}
              {activeTab === "payments" && "To'lovlar Ma'lumotnomasi"}
              {activeTab === "notifications" && "Broadcast E'lonlar Markazi"}
              {activeTab === "errorMonitor" && "System Audit & Xatoliklar Monitori"}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {activeTab === "dashboard" && "Platformaning moliyaviy, foydalanish va ruxsat dinamikasi."}
              {activeTab === "users" && "Mijozlarning ma'lumotlari, bugungi AI so'rovlari va bloklash sozlashlari."}
              {activeTab === "subscriptions" && "Dynamic narxlash, kvota sozlash va yangi obuna rejalari qo'shish."}
              {activeTab === "features" && "Tariflar kesimida premium AI tahlil modullarini ochish yoki yopish."}
              {activeTab === "aiAnalytics" && "Markazlashgan AI so'rovlari, tokenlar hisobi, kreditlar sarfi va modellar dinamikasi."}
              {activeTab === "payments" && "Kutilayotgan kassa o'tkazmalari va tasdiqlash jurnali."}
              {activeTab === "notifications" && "Tizim e'lonlari, bildirishnomalari va ogohlantirishlarini tarqatish."}
              {activeTab === "errorMonitor" && "Tizim barqarorligi va ishlab chiqarishdagi kutilmagan istisnolar jurnali."}
            </p>
          </div>
          <div className="text-xs text-slate-400 font-semibold bg-slate-900 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-2 self-start sm:self-auto shadow-md">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            Superadmin: <span className="text-blue-400">{auth.currentUser?.email}</span>
          </div>
        </div>

        {/* ============================== 1. SUB PANEL: DASHBOARD ============================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Visual statistics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total users */}
              <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl relative overflow-hidden group shadow-lg hover:shadow-blue-500/5 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full shrink-0 group-hover:scale-110 transition-all duration-300" />
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2.5 py-1 rounded-full">Foydalanuvchilar</span>
                </div>
                <p className="text-3xl font-black">{totalUsers}</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Barchasi: <span className="text-blue-400 font-black">{totalUsers} ta</span> • Faol: <span className="text-emerald-400 font-bold">{activeUsers} ta</span></p>
              </div>

              {/* Tiers distribution statistics */}
              <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl relative overflow-hidden group shadow-lg hover:shadow-indigo-500/5 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full shrink-0 group-hover:scale-110 transition-all duration-300" />
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                    <Crown className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2.5 py-1 rounded-full">Tariflar bo'yicha</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mt-1">
                  <div>
                    <p className="text-md font-bold text-slate-300">{freeUsers}</p>
                    <p className="text-[9px] text-slate-500">Free</p>
                  </div>
                  <div className="border-x border-white/5">
                    <p className="text-md font-bold text-amber-400">{proUsers}</p>
                    <p className="text-[9px] text-slate-500">Pro</p>
                  </div>
                  <div>
                    <p className="text-md font-bold text-indigo-400">{businessUsers}</p>
                    <p className="text-[9px] text-slate-500">Business</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed">SaaS premium segment ulushi: <span className="text-white font-bold">{totalUsers > 0 ? ((proUsers + businessUsers)/totalUsers * 100).toFixed(1) : 0}%</span></p>
              </div>

              {/* Requests dynamic load */}
              <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl relative overflow-hidden group shadow-lg hover:shadow-amber-500/5 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full shrink-0 group-hover:scale-110 transition-all duration-300" />
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2.5 py-1 rounded-full">Bugungi amallar</span>
                </div>
                <p className="text-3xl font-black">{totalRequestsToday + totalExportsToday}</p>
                <div className="flex gap-4 text-[10px] text-slate-400 mt-2 font-medium">
                  <p>AI: <span className="text-amber-400 font-bold">{totalRequestsToday} so'rov</span></p>
                  <p>Eksport: <span className="text-purple-400 font-bold">{totalExportsToday} fayl</span></p>
                </div>
              </div>

              {/* Financial metrics */}
              <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl relative overflow-hidden group shadow-lg hover:shadow-emerald-500/5 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full shrink-0 group-hover:scale-110 transition-all duration-300" />
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                    <Coins className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2.5 py-1 rounded-full">Kassa tushumi (MRR)</span>
                </div>
                <p className="text-lg font-black break-words mt-1">{estimatedMRR.toLocaleString()} UZS <span className="text-[9px] text-slate-500 font-normal">/ oyiga</span></p>
                <p className="text-xs text-slate-400 mt-3 font-medium">Tasdiqlangan to'lovlar summasi: <span className="text-emerald-400 font-bold">{totalRevenue.toLocaleString()} UZS</span></p>
              </div>

            </div>

            {/* Quick action section list & overview details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left detail card: Main platform counters */}
              <div className="col-span-1 lg:col-span-2 p-6 bg-slate-900 border border-white/10 rounded-3xl shadow-md space-y-4">
                <h3 className="font-extrabold text-base text-white border-b border-white/5 pb-3">Sizning biznes tahlilingiz</h3>
                
                <div className="space-y-4 font-semibold text-xs leading-none">
                  <div className="flex justify-between p-3.5 bg-slate-950 rounded-2xl border border-white/10">
                    <span className="text-slate-400">Total Approved Invoices:</span>
                    <span className="text-emerald-400">{approvedInvoices.length} ta yordam</span>
                  </div>
                  <div className="flex justify-between p-3.5 bg-slate-950 rounded-2xl border border-white/10 animate-pulse">
                    <span className="text-slate-400">Yangi kutilayotgan arizalar:</span>
                    <span className="text-amber-500">{pendingInvoicesCount} ta kassa so'rovi</span>
                  </div>
                  <div className="flex justify-between p-3.5 bg-slate-950 rounded-2xl border border-white/10">
                    <span className="text-slate-400">Premium oylik obuna bo'yicha daromad:</span>
                    <span className="text-blue-400">{estimatedMRR.toLocaleString()} so'm</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">Avtomatik limit nollanishlari</h5>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-semibold">
                      Har bir foydalanuvchining bugungi so'rovlar limitlari ularning mahalliy vaqti yoki birinchi AI so'rovi yo'llangan kundan boshlab yangi kunda avtomatik nollanadi!
                    </p>
                  </div>
                </div>
              </div>

              {/* Active announcement overview block */}
              <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-white border-b border-white/5 pb-3 mb-4">Konsol Tezkori</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveTab("users")}
                      className="w-full text-left p-3 hover:bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="text-slate-400 font-medium">Foydalanuvchilarni izlash</span>
                      <Search className="w-4 h-4 text-slate-500" />
                    </button>
                    <button 
                      onClick={() => setActiveTab("payments")}
                      className="w-full text-left p-3 hover:bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="text-slate-400 font-medium font-semibold">Kassan tekshirish</span>
                      <CreditCard className="w-4 h-4 text-slate-500 font-medium" />
                    </button>
                    <button 
                      onClick={() => setActiveTab("notifications")}
                      className="w-full text-left p-3 hover:bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="text-slate-400 font-medium">Broadcast yozish</span>
                      <Megaphone className="w-4 h-4 text-slate-500 font-medium" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex gap-2.5 items-center justify-center text-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Bari ishlamoqda. Xavfsizlik 100%</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ============================== 2. SUB PANEL: USERS ============================== */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Search filter block */}
            <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-grow max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Ism, Email yoki maxsus UID kiriting..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 text-white pl-11 pr-4 py-3 text-xs font-semibold rounded-2xl border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder-slate-500"
                />
              </div>
              <div className="text-xs text-slate-300 font-semibold bg-slate-950 px-4 py-2 border border-white/5 rounded-xl">
                Filtrlandi: <span className="text-blue-400 font-black">{filteredUsers.length}</span> ta ({totalUsers} tadan)
              </div>
            </div>

            {/* Users Directory Table list */}
            <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-white/10">
                    <tr>
                      <th className="py-4 px-6">Avatar & Mijoz</th>
                      <th className="py-4 px-6">Email Pochta</th>
                      <th className="py-4 px-6 text-center">Tarif</th>
                      <th className="py-4 px-6 text-center">Bugungi limits (AI / Eksport)</th>
                      <th className="py-4 px-6 text-center">Status / Rol</th>
                      <th className="py-4 px-6 text-right">Boshqaruv</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">
                          Hech qanday foydalanuvchi topilmadi.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => {
                        const isBlocked = u.blocked === true;
                        return (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-6 min-w-[160px]">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={u.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.id}`} 
                                  alt="avatar" 
                                  className="w-8 h-8 rounded-full border border-white/10"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <p className="font-extrabold text-white text-xs leading-snug">{u.displayName || "Ismsiz"}</p>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]" title={u.id}>UID: {u.id.slice(0, 10)}...</p>
                                </div>
                              </div>
                            </td>
                            
                            <td className="py-4 px-6 text-slate-300 select-text">{u.email || "anonim@test"}</td>
                            
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                u.subscriptionTier === 'business' 
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' 
                                  : u.subscriptionTier === 'pro' 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' 
                                    : 'bg-slate-800 text-slate-400'
                              }`}>
                                {u.subscriptionTier || "free"}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-center space-y-1">
                              <p className="text-[10px] text-slate-400 font-mono font-bold">
                                AI: <span className="text-yellow-400 font-bold">{u.requestsToday || 0} so'rov</span>
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono font-bold">
                                Eksport: <span className="text-purple-400 font-bold">{u.exportsToday || 0} yuklab olish</span>
                              </p>
                            </td>

                            <td className="py-4 px-6 text-center space-y-1">
                              <div>
                                {isBlocked ? (
                                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md">Bloklangan</span>
                                ) : (
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md">Ruxsatda</span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest">{u.role || "user"}</span>
                            </td>

                            <td className="py-4 px-6 text-right space-y-1.5">
                              {/* Directly editable inline quick selector for details */}
                              <div className="flex justify-end gap-1.5 flex-wrap">
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
                                  title="Obuna va Rollarni o'zgartirish"
                                >
                                  Tahrirlash
                                </button>
                                
                                <button
                                  onClick={() => handleBlockToggle(u)}
                                  className={`p-1.5 border rounded-xl hover:bg-white/5 transition-all cursor-pointer ${isBlocked ? 'text-emerald-400 border-emerald-500/25' : 'text-red-400 border-red-500/25'}`}
                                  title={isBlocked ? "Blokdan chiqarish" : "Bloklash"}
                                >
                                  {isBlocked ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => handleResetLimits(u)}
                                  className="p-1.5 border border-white/10 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                                  title="Bugungi counter limitlarni nollash"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Bar */}
              <div className="p-4 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold">
                  Jami <span className="text-white font-bold">{filteredUsers.length}</span> tadan {filteredUsers.length > 0 ? (userPage - 1) * USERS_PER_PAGE + 1 : 0} - {Math.min(userPage * USERS_PER_PAGE, filteredUsers.length)} ko'rsatilmoqda
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    disabled={userPage <= 1}
                    className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold"
                  >
                    Oldingi
                  </button>
                  <span className="px-3 py-1 bg-slate-900 border border-white/5 rounded-xl text-slate-300 font-mono text-xs font-bold">
                    {userPage} / {totalUserPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                    disabled={userPage >= totalUserPages}
                    className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold"
                  >
                    Keyingi
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Edit Popup modal */}
            {selectedUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
                <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
                  
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-base font-black mb-1 text-white">Hisobni Batafsil Tahrirlash</h3>
                  <p className="text-[10px] text-slate-400 mb-6">{selectedUser.email}</p>

                  <div className="space-y-4">
                    {/* Select subscription Tier */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Obuna Tarifi</label>
                      <select
                        value={selectedUser.subscriptionTier || "free"}
                        onChange={(e) => handleUpdateUserStatus(selectedUser, { subscriptionTier: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2 text-xs font-semibold text-white outline-none focus:border-blue-500 transition-all"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name} {p.price > 0 ? `($${p.price})` : "(Bepul)"}</option>
                        ))}
                      </select>
                    </div>

                    {/* Select role flag */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tizim roli</label>
                      <select
                        value={selectedUser.role || "user"}
                        onChange={(e) => handleUpdateUserStatus(selectedUser, { role: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2 text-xs font-semibold text-white outline-none focus:border-blue-500 transition-all"
                      >
                        <option value="user">User (Oddiy foydalanuvchi)</option>
                        <option value="admin">Admin (Ma'muriyat hisobi)</option>
                      </select>
                    </div>

                    {/* Today COUNTERS OVERLAY */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Bugun AI requests</label>
                        <input
                          type="number"
                          value={selectedUser.requestsToday || 0}
                          onChange={(e) => handleUpdateUserStatus(selectedUser, { requestsToday: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2 text-xs font-mono font-bold text-amber-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Bugun Exports</label>
                        <input
                          type="number"
                          value={selectedUser.exportsToday || 0}
                          onChange={(e) => handleUpdateUserStatus(selectedUser, { exportsToday: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2 text-xs font-mono font-bold text-purple-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/5 text-right">
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        loadAllData();
                      }}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer"
                    >
                      Barchasi tayyor, yopish
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================== 3. SUB PANEL: SUBSCRIPTION SETTINGS ============================== */}
        {activeTab === "subscriptions" && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="flex justify-between items-center bg-slate-900 border border-white/10 p-6 rounded-3xl">
              <div>
                <h3 className="font-extrabold text-white text-base">Tarif rejalarini ko'rib chiqish</h3>
                <p className="text-[10px] text-slate-400 mt-1">Ular orqali mijozlar qancha to'lashini va ularga qanday so'rov limitlar berilishini belgilaysiz.</p>
              </div>
              
              <button
                onClick={() => handleOpenPlanModal()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Yangi plan yaratish
              </button>
            </div>

            {loadingPlans ? (
              <div className="py-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
                <p className="text-slate-400 text-xs mt-2 font-mono">Tariflar xotirasi yangilanmoqda...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((p) => {
                  const isCore = ["free", "pro", "business"].includes(p.id);
                  return (
                    <div 
                      key={p.id} 
                      className={`p-6 bg-slate-900 border rounded-3xl relative flex flex-col justify-between shadow-lg ${
                        p.isEnabled ? 'border-white/10' : 'border-white/5 opacity-55'
                      }`}
                    >
                      {/* Popular ribbon */}
                      {p.id === "pro" && (
                        <span className="absolute top-3 right-3 bg-amber-500 text-white font-extrabold text-[8px] tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                          POPULAR
                        </span>
                      )}
                      
                      <div>
                        {/* Plan Header */}
                        <div>
                          <h4 className="text-base font-black text-white">{p.name}</h4>
                          <p className="text-[10px] font-mono font-bold text-slate-500 mt-0.5 uppercase tracking-widest">ID Key: {p.id}</p>
                        </div>

                        {/* Prices block */}
                        <div className="my-5 py-4 border-y border-white/5">
                          <p className="text-xl font-black text-white">
                            {p.price > 0 ? `$${p.price}` : "0 USD"} <span className="text-[10px] text-slate-500 font-normal">/ oyiga</span>
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 mt-1">
                            {p.priceUZS > 0 ? `${p.priceUZS.toLocaleString()} UZS` : "Bepul tarif"}
                          </p>
                        </div>

                        {/* Limit indicators */}
                        <div className="space-y-3 mb-6 text-xs text-slate-300">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">AI so'rovlar limiti:</span>
                            <span className="font-mono text-amber-400 font-extrabold">
                              {p.requestLimit >= 999999 ? "Cheksiz (Unlimited)" : `${p.requestLimit} marta`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Hujjat ko'chirib olish:</span>
                            <span className="font-mono text-purple-400 font-extrabold">
                              {p.exportLimit >= 999999 ? "Cheksiz (Unlimited)" : `${p.exportLimit} marta`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                        {!isCore && (
                          <button
                            onClick={() => handleDeletePlanObj(p.id)}
                            className="p-2 border border-red-500/25 text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenPlanModal(p)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer"
                        >
                          Tahrirlash / Limits
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Plan Editor popup Modal */}
            {isPlanModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
                <form 
                  onSubmit={handleSavePlanForm}
                  className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl p-6 relative shadow-2xl text-xs space-y-4 font-semibold"
                >
                  <button 
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-base font-black text-white">
                    {selectedPlan ? `${selectedPlan.name} reyasini tahrirlash` : "Yangi obuna tarifi yaratish"}
                  </h3>
                  <p className="text-[10px] text-slate-400">Barcha parametrlar hisob-kitoblar va global limit tekshiruvlarida ishtirok etadi.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Identifier code ID */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tarif Kaliti (ID - Unique)</label>
                      <input 
                        type="text"
                        required
                        disabled={selectedPlan !== null}
                        placeholder="Masalan, custom_tier"
                        value={planForm.id}
                        onChange={(e) => setPlanForm({ ...planForm, id: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white outline-none"
                      />
                    </div>

                    {/* Display Title */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tarif nomi</label>
                      <input 
                        type="text"
                        required
                        placeholder="Masalan, Pro Plus Ultimate"
                        value={planForm.name}
                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white outline-none"
                      />
                    </div>

                    {/* Pricing in USD */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Narxi (bir oylik, USD)</label>
                      <input 
                        type="number"
                        step="0.01"
                        required
                        value={planForm.price}
                        onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white underline-none"
                      />
                    </div>

                    {/* Pricing in UZS */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Narxi (milliy valyuta, UZS)</label>
                      <input 
                        type="number"
                        required
                        value={planForm.priceUZS}
                        onChange={(e) => setPlanForm({ ...planForm, priceUZS: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white"
                      />
                    </div>

                    {/* Request Limit counter */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kunlik AI so'rovlar soni</label>
                        <button
                          type="button"
                          onClick={() => setPlanForm({ ...planForm, requestLimit: 999999 })}
                          className="text-[9px] text-blue-400 font-extrabold hover:underline"
                        >
                          Cheksiz qilish
                        </button>
                      </div>
                      <input 
                        type="number"
                        required
                        value={planForm.requestLimit}
                        onChange={(e) => setPlanForm({ ...planForm, requestLimit: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white"
                      />
                    </div>

                    {/* Export Limit counter */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kunlik eksport yuklash soni</label>
                        <button
                          type="button"
                          onClick={() => setPlanForm({ ...planForm, exportLimit: 999999 })}
                          className="text-[9px] text-blue-400 font-extrabold hover:underline"
                        >
                          Cheksiz qilish
                        </button>
                      </div>
                      <input 
                        type="number"
                        required
                        value={planForm.exportLimit}
                        onChange={(e) => setPlanForm({ ...planForm, exportLimit: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white"
                      />
                    </div>

                    {/* Active Status */}
                    <div className="sm:col-span-2 pt-2 flex items-center gap-3">
                      <input 
                        type="checkbox"
                        id="plan_enabled"
                        checked={planForm.isEnabled}
                        onChange={(e) => setPlanForm({ ...planForm, isEnabled: e.target.checked })}
                        className="w-4.5 h-4.5 text-blue-600 bg-slate-950 rounded-lg"
                      />
                      <label htmlFor="plan_enabled" className="text-xs font-bold text-slate-300 select-none">Ushbu tarif faol va foydalanuvchilar obuna bo'lishi mumkin</label>
                    </div>

                  </div>

                  <div className="mt-8 pt-4 border-t border-white/5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md"
                    >
                      Saqlash
                    </button>
                  </div>

                </form>
              </div>
            )}

          </div>
        )}

        {/* ============================== 4. SUB PANEL: FEATURE MATRIX ============================== */}
        {activeTab === "features" && (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-extrabold text-white text-base">Premium AI xususiyatlar cheklov matritsasi</h3>
              <p className="text-[10px] text-slate-400 mt-1">Siz xususiyatlar kesimida qaysi darajadagi foydalanuvchilar ularga ruxsat ola bilishini boshqarasiz.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-950 text-slate-400 font-black text-[10px] tracking-wider uppercase border-b border-white/10">
                  <tr>
                    <th className="py-4 px-6">Huquqiy Xizmat / Modullar nomi</th>
                    <th className="py-4 px-6 text-center">Bepul (Free)</th>
                    <th className="py-4 px-6 text-center">Pro Premium</th>
                    <th className="py-4 px-6 text-center">Business / Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 leading-none">
                  
                  {/* Row 1: riskAnalysis */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-white font-extrabold">Shartnoma risklarini baholash (Risk Analysis)</p>
                      <p className="text-[10px] text-slate-500 mt-1">Hujjatlardagi potentsial huquqiy xavf-hatarlarni aniqlash tahlilchisi.</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.riskAnalysis || []).includes("free")}
                        onChange={() => toggleFeatureMatrix("riskAnalysis", "free")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.riskAnalysis || []).includes("pro")}
                        onChange={() => toggleFeatureMatrix("riskAnalysis", "pro")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.riskAnalysis || []).includes("business")}
                        onChange={() => toggleFeatureMatrix("riskAnalysis", "business")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                  </tr>

                  {/* Row 2: strategyPlan */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-white font-extrabold">Biznes va himoya strategiyasi (Strategy Plan)</p>
                      <p className="text-[10px] text-slate-500 mt-1">Muammoli vaziyatlar yoki bitimlarda taktik huquqiy yo'l-yo'riqlar tuzish moduli.</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.strategyPlan || []).includes("free")}
                        onChange={() => toggleFeatureMatrix("strategyPlan", "free")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.strategyPlan || []).includes("pro")}
                        onChange={() => toggleFeatureMatrix("strategyPlan", "pro")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.strategyPlan || []).includes("business")}
                        onChange={() => toggleFeatureMatrix("strategyPlan", "business")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                  </tr>

                  {/* Row 3: aiExpertise */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-white font-extrabold">AI Yuridik Konsultatsiya (Interactive AI Expert)</p>
                      <p className="text-[10px] text-slate-500 mt-1">Yurist yordamchi bilan real vaqtda chat yozishmasi va chuqur so'rovlar.</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.aiExpertise || []).includes("free")}
                        onChange={() => toggleFeatureMatrix("aiExpertise", "free")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.aiExpertise || []).includes("pro")}
                        onChange={() => toggleFeatureMatrix("aiExpertise", "pro")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.aiExpertise || []).includes("business")}
                        onChange={() => toggleFeatureMatrix("aiExpertise", "business")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                  </tr>

                  {/* Row 4: advancedLegalAnalysis */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-white font-extrabold">Kengaytirilgan huquqiy tahlil (Advanced Analysis)</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold text-blue-400">Yuridik shaxslar va tadbirkorlar uchun eng qiyin hujjatlar to'liq tahlili.</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.advancedLegalAnalysis || []).includes("free")}
                        onChange={() => toggleFeatureMatrix("advancedLegalAnalysis", "free")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.advancedLegalAnalysis || []).includes("pro")}
                        onChange={() => toggleFeatureMatrix("advancedLegalAnalysis", "pro")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.advancedLegalAnalysis || []).includes("business")}
                        onChange={() => toggleFeatureMatrix("advancedLegalAnalysis", "business")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                  </tr>

                  {/* Row 5: priorityProcessing */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-white font-extrabold">Tezkor Ustuvorlik xizmati (Priority Processing)</p>
                      <p className="text-[10px] text-slate-500 mt-1">Ushbu guruhdagi so'rovlar yuklash limitlarida birinchi bo'lib qayta ishlanadi.</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.priorityProcessing || []).includes("free")}
                        onChange={() => toggleFeatureMatrix("priorityProcessing", "free")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.priorityProcessing || []).includes("pro")}
                        onChange={() => toggleFeatureMatrix("priorityProcessing", "pro")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={(planLimits.features.priorityProcessing || []).includes("business")}
                        onChange={() => toggleFeatureMatrix("priorityProcessing", "business")}
                        className="w-4 h-4 text-blue-600 bg-slate-950 rounded"
                      />
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end">
              <button
                onClick={handleSaveFeatureMatrix}
                disabled={isSavingLimits}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSavingLimits ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Imkoniyatlar matoritsasini saqlash
              </button>
            </div>

          </div>
        )}

        {/* ============================== AI GATEWAY & ANALYTICS SUB PANEL ============================== */}
        {activeTab === "aiAnalytics" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header / Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-white/10 p-5 rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base flex items-center gap-2">
                    Dastyorchi Centralized AI Gateway
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      FAOL (PRODUCTION)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Server-authoritative kredit hisoblagichi, Gemini 2.5/3 modellar routingi va tokenlar statistikasi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchAiAnalytics()}
                  disabled={loadingAiAnalytics}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-white/5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAiAnalytics ? "animate-spin" : ""}`} />
                  Yangilash
                </button>
              </div>
            </div>

            {/* 4 Core KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Requests */}
              <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Bugungi AI So'rovlar</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-white font-mono">
                    {aiAnalytics?.requestsToday ?? 0}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5 font-medium">ta</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Sana:</span>
                  <span className="font-mono text-emerald-400 font-bold">{aiAnalytics?.date || "Bugun"}</span>
                </div>
              </div>

              {/* Card 2: Credits Consumed */}
              <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Sarflangan AI Kreditlar</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-amber-400 font-mono">
                    {aiAnalytics?.creditsConsumedToday ?? 0}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5 font-medium">kredit</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Operatsiyalar bo'yicha:</span>
                  <span className="text-slate-300 font-medium">1 - 5 kr / so'rov</span>
                </div>
              </div>

              {/* Card 3: Gemini Tokens */}
              <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Jami Gemini Tokenlar</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-white font-mono">
                    {(((aiAnalytics?.totalInputTokensToday || 0) + (aiAnalytics?.totalOutputTokensToday || 0))).toLocaleString()}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>In: <strong className="text-slate-300 font-mono">{(aiAnalytics?.totalInputTokensToday || 0).toLocaleString()}</strong></span>
                  <span>Out: <strong className="text-slate-300 font-mono">{(aiAnalytics?.totalOutputTokensToday || 0).toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Card 4: System Safety & Refunds */}
              <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Ishonchlilik & Qaytarish</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-3">
                  <div>
                    <span className="text-xs text-slate-400">Xato: </span>
                    <span className="text-lg font-bold text-rose-400 font-mono">{aiAnalytics?.failedRequests ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Qaytarilgan: </span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">{aiAnalytics?.refundedRequests ?? 0}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Avto-refund:</span>
                  <span className="text-emerald-400 font-bold">Yoqilgan</span>
                </div>
              </div>

            </div>

            {/* Middle Section: Operation Breakdown & Model Routing Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Operation Breakdown */}
              <div className="lg:col-span-2 bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-extrabold text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      Operatsiyalar Turi Kesimida So'rovlar Taqsimoti
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Foydalanuvchilar qaysi AI xizmatlaridan ko'proq foydalanishmoqda
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Jami: {aiAnalytics?.requestsToday ?? 0}
                  </span>
                </div>

                {/* Operations List */}
                <div className="space-y-4 pt-2">
                  {[
                    { id: "chat", name: "Yuridik Maslahat (Chat)", cost: 1, color: "bg-blue-500", desc: "Tezkor javoblar va birlamchi yo'naltirish" },
                    { id: "reasoning", name: "Mantiqiy Xulosa (Reasoning)", cost: 2, color: "bg-indigo-500", desc: "Qonun normalarini solishtirish va tahlil qilish" },
                    { id: "document", name: "Hujjat Yaratish (Document)", cost: 3, color: "bg-emerald-500", desc: "Sud arizalari, shartnomalar va da'volar generatsiyasi" },
                    { id: "file_analysis", name: "Fayl & Hujjat Tahlili (File Analysis)", cost: 4, color: "bg-amber-500", desc: "Yuklangan PDF/DOCX fayllar tahlili va ekspertizasi" },
                    { id: "deep_analysis", name: "Chuqur Yuridik Ekspertiza (Deep Analysis)", cost: 5, color: "bg-purple-500", desc: "To'liq modellashtirish va strategik yuridik xulosalar" },
                  ].map((op) => {
                    const count = aiAnalytics?.operationBreakdown?.[op.id] || 0;
                    const total = aiAnalytics?.requestsToday || 1;
                    const pct = Math.round((count / total) * 100);

                    return (
                      <div key={op.id} className="p-3 bg-slate-950/60 border border-white/5 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-bold text-white">
                            <span>{op.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/20">
                              {op.cost} kr / so'rov
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-300 font-bold">{count} ta</span>
                            <span className="text-slate-500">({pct}%)</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${op.color}`}
                            style={{ width: `${Math.max(count > 0 ? 3 : 0, pct)}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-slate-500">
                          {op.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 1 Col: Model Routing & System Config */}
              <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-white font-extrabold text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    Model Routing & Sozlamalar
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Operatsiyaga qarab Gemini modellariga avtomatik yo'naltirish
                  </p>

                  <div className="space-y-3 mt-4">
                    {/* Fast Model */}
                    <div className="p-3.5 bg-slate-950 border border-white/5 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">Tezkor Model (Fast)</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                          Default
                        </span>
                      </div>
                      <p className="text-xs font-mono font-bold text-white">gemini-3.8-flash</p>
                      <p className="text-[11px] text-slate-400">Chat va oddiy savol-javoblar uchun minimal kutish vaqti bilan ishlaydi.</p>
                    </div>

                    {/* Strong Model */}
                    <div className="p-3.5 bg-slate-950 border border-white/5 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-400">Kengaytirilgan Model (Strong)</span>
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-mono font-bold">
                          Pro / Legal
                        </span>
                      </div>
                      <p className="text-xs font-mono font-bold text-white">gemini-3.1-pro-preview</p>
                      <p className="text-[11px] text-slate-400">Hujjat generatsiyasi, reasoning va chuqur tahlillar uchun yuqori mantiqiy aniqlik.</p>
                    </div>

                    {/* Centralized Key Security */}
                    <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl space-y-1">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Xavfsizlik Siyosati
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        API kalit faqat server muhitida (<code className="text-emerald-300 font-mono">GEMINI_API_KEY</code>) saqlanadi. Foydalanuvchilardan API kalit so'rash qat'iyan taqiqlangan va olib tashlangan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-white/5 rounded-2xl text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Kunlik hisob yangilanishi:</span>
                  <span className="font-bold text-slate-200 font-mono">00:00 (Asia/Tashkent)</span>
                </div>
              </div>

            </div>

            {/* Bottom Section: Top Users Consuming Credits Today */}
            <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-extrabold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Bugungi Eng Faol AI Foydalanuvchilari (Top Consumers)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kun davomida eng ko'p kredit sarflagan Telegram mijozlari
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {aiAnalytics?.topUsers?.length || 0} ta faol foydalanuvchi
                </span>
              </div>

              {aiAnalytics?.topUsers && aiAnalytics.topUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 font-semibold">
                        <th className="pb-3 px-3">#</th>
                        <th className="pb-3 px-3">Foydalanuvchi ID</th>
                        <th className="pb-3 px-3">Sarflangan Kreditlar</th>
                        <th className="pb-3 px-3">Tizim Holati</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {aiAnalytics.topUsers.map((u: any, idx: number) => (
                        <tr key={u.userId || idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-2">
                            <span>{u.userId}</span>
                            {u.userId.startsWith("tg_") && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400">
                                Telegram
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-amber-400">
                            {u.credits} kredit
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Faol
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-white/5 rounded-2xl">
                  Bugun hozircha AI kreditlari sarflanmagan yoki so'rovlar qayd etilmagan.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================== 5. SUB PANEL: PAYMENTS ============================== */}
        {activeTab === "payments" && (
          <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
            
            {/* Payment filter tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter("all")}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                    paymentStatusFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Barchasi
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter("pending")}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                    paymentStatusFilter === "pending" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Kutilmoqda {pendingInvoicesCount > 0 && <span className="ml-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{pendingInvoicesCount}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter("approved")}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                    paymentStatusFilter === "approved" ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Tasdiqlangan
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter("declined")}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                    paymentStatusFilter === "declined" ? "bg-red-500/10 text-red-500" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Rad etilgan
                </button>
              </div>

              <div className="text-xs font-semibold text-slate-400">
                To'lov summalari: <span className="text-emerald-400 font-bold">{totalRevenue.toLocaleString()} UZS</span>
              </div>
            </div>

            {/* Invoices listings */}
            {loadingPayments ? (
              <div className="py-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
                <p className="text-slate-400 text-xs mt-2 font-mono">Ma'lumotlar tahlil qilinmoqda...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-2xl">
                <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-semibold">Ushbu ruknda arizalar mavjud emas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedPayments.map((p) => {
                  const isPending = p.status === "pending";
                  return (
                    <div 
                      key={p.id}
                      className={`p-5 rounded-2xl border bg-slate-950/45 transition-all text-xs font-semibold ${
                        p.status === "approved" 
                          ? "border-emerald-500/20 hover:border-emerald-500/30" 
                          : p.status === "declined" 
                            ? "border-red-500/20 hover:border-red-500/30" 
                            : "border-amber-500/20 hover:border-amber-500/30"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                              p.status === "approved" 
                                ? "bg-emerald-500/10 text-emerald-400" 
                                : p.status === "declined" 
                                  ? "bg-red-500/10 text-red-500" 
                                  : "bg-amber-500/10 text-amber-400"
                            }`}>
                              {p.status === "approved" ? "Tasdiqlangan" : p.status === "declined" ? "Rad etilgan" : "Kutilmoqda (Pending)"}
                            </span>

                            <span className={`text-[9px] font-black uppercase text-white px-2 py-0.5 rounded-full ${
                              p.provider === 'payme' ? 'bg-teal-500' : p.provider === 'click' ? 'bg-sky-500' : 'bg-indigo-600'
                            }`}>
                              {p.provider ? p.provider.toUpperCase() : "MAHALLIY KARTA"}
                            </span>

                            <span className="bg-slate-800 text-slate-300 text-[9px] font-black uppercase truncate tracking-wider px-2 py-0.5 rounded-lg">
                              Tarif: {p.tier ? p.tier.toUpperCase() : "PRO"}
                            </span>
                          </div>

                          <div>
                            <p className="text-white font-extrabold text-sm">{p.displayName || "Foydalanuvchi"}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{p.email || "anonim@test"} (UID: {p.uid})</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-1.5 text-slate-400">
                            {p.phoneNumber && <p><b>Telefon raqam:</b> {p.phoneNumber}</p>}
                            {p.cardHolder && <p><b>Karta egasi:</b> {p.cardHolder}</p>}
                            {p.receiptNote && (
                              <p className="sm:col-span-2 mt-1.5 p-2.5 bg-slate-900 border border-white/5 rounded-xl text-[10px] text-slate-300 leading-relaxed max-w-full overflow-x-auto">
                                <b>Izoh / Tranzaksiya ma'lumoti:</b> {p.receiptNote}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Amount display & approved trigger controls */}
                        <div className="flex flex-col items-start sm:items-end justify-between self-stretch shrink-0">
                          <div className="text-left sm:text-right">
                            <p className="text-base font-black text-emerald-400">
                              {p.formattedAmount || `${(p.amount || 0).toLocaleString()} UZS`}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                              Yuborilgan sana: {p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleString('uz-UZ') : "Hozirgina"}
                            </p>
                          </div>

                          {isPending && (
                            <div className="flex gap-2 mt-4 self-stretch sm:self-auto">
                              <button
                                onClick={() => handleDeclinePayment(p.id)}
                                className="flex-1 sm:flex-none px-3.5 py-2 hover:bg-red-500/10 text-red-400 text-[10px] font-black uppercase rounded-xl border border-red-500/20 transition-colors cursor-pointer"
                              >
                                Rad qilish
                              </button>
                              
                              <button
                                onClick={() => handleApprovePayment(p)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Tasdiqlash
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}

                {/* Payment Pagination Bar */}
                <div className="p-4 bg-slate-950 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400 text-[11px] font-semibold">
                    Jami <span className="text-white font-bold">{filteredPayments.length}</span> tadan {filteredPayments.length > 0 ? (paymentPage - 1) * PAYMENTS_PER_PAGE + 1 : 0} - {Math.min(paymentPage * PAYMENTS_PER_PAGE, filteredPayments.length)} ko'rsatilmoqda
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
                      disabled={paymentPage <= 1}
                      className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold"
                    >
                      Oldingi
                    </button>
                    <span className="px-3 py-1 bg-slate-900 border border-white/5 rounded-xl text-slate-300 font-mono text-xs font-bold">
                      {paymentPage} / {totalPaymentPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPaymentPage(p => Math.min(totalPaymentPages, p + 1))}
                      disabled={paymentPage >= totalPaymentPages}
                      className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold"
                    >
                      Keyingi
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================== 6. SUB PANEL: NOTIFICATIONS ============================== */}
        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            
            {/* Create Broadcast Announcement Form */}
            <form 
              onSubmit={handleSendAnnouncement}
              className="p-6 bg-slate-900 border border-white/10 rounded-3xl space-y-4 font-semibold text-xs"
            >
              <div>
                <h3 className="font-extrabold text-white text-base">Yangi e'lon / ogohlantirish tarqatish</h3>
                <p className="text-[10px] text-slate-400 mt-1">Bu sarlavha va xabar sarguzashtlari butun platformadagi foydalanuvchilar ekranida banner sifatida ko'rinadi.</p>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sarlavha (Kichik tushuntirish)</label>
                <input 
                  type="text"
                  required
                  placeholder="Masalan, Platforma yangilandi yoki Texnik ishlar"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-white outline-none focus:border-blue-500 transition-all placeholder-slate-600"
                />
              </div>

              {/* Body message input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">E'lon batafsil xabari (Message text)</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Ilovadagi e'lon matni..."
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-white outline-none focus:border-blue-500 transition-all placeholder-slate-600 resize-none"
                />
              </div>

              {/* Box style type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Banner uslubi (Type marker)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAnnouncementForm({ ...announcementForm, type: "info" })}
                    className={`py-2 px-3 border rounded-xl font-bold tracking-wide transition-all uppercase text-[9px] ${
                      announcementForm.type === 'info' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-white/5 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    Malumot (Info)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementForm({ ...announcementForm, type: "warning" })}
                    className={`py-2 px-3 border rounded-xl font-bold tracking-wide transition-all uppercase text-[9px] ${
                      announcementForm.type === 'warning' ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-white/5 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    Ogohlantirish
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementForm({ ...announcementForm, type: "success" })}
                    className={`py-2 px-3 border rounded-xl font-bold tracking-wide transition-all uppercase text-[9px] ${
                      announcementForm.type === 'success' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-white/5 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    Muvaffaqiyatli
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={isSendingAnn}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSendingAnn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                  E'lonni butunlay tarqatish (Broadcast)
                </button>
              </div>

            </form>

            {/* Previous announcements history */}
            <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl space-y-4">
              <div>
                <h3 className="font-extrabold text-white text-base">Avval yuborilgan e'lonlar arxivi</h3>
                <p className="text-[10px] text-slate-400 mt-1">E'lon o'chirilsa, foydalanuvchilar ekranidan darhol g'oyib bo'ladi.</p>
              </div>

              {loadingAnnouncements ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-white/5 rounded-2xl text-xs text-slate-500 font-bold">
                  Hozircha birorta ham faol e'lon tarqatilmagan.
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {announcements.map((ann) => (
                    <div 
                      key={ann.id}
                      className="p-4 bg-slate-950 border border-white/10 rounded-2xl flex justify-between items-start gap-4 text-xs font-semibold text-slate-300 hover:bg-slate-950/70"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0 font-medium">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            ann.type === 'warning' ? 'bg-amber-500' : ann.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`} />
                          <p className="text-white font-extrabold truncate text-xs">{ann.title}</p>
                        </div>
                        <p className="text-slate-420 leading-relaxed font-sans text-xs">{ann.message}</p>
                        <p className="text-[9px] text-slate-500 font-bold font-mono">
                          Yuboruvchi: {ann.sentBy || "Admin"} • {ann.createdAt ? new Date(ann.createdAt.seconds * 1000).toLocaleString('uz-UZ') : "Hozir"}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-slate-500 hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 cursor-pointer"
                        title="E'lonni o'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================== 6. SUB PANEL: ERROR MONITOR ============================== */}
        {activeTab === "errorMonitor" && (
          <div className="space-y-8 animate-fadeIn text-left">
            
            {/* Visual statistics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Logs */}
              <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Jami Xatoliklar</span>
                  <span className="text-2xl font-black text-white mt-1 block">{systemLogs.length} ta</span>
                </div>
              </div>

              {/* Today's Errors */}
              <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Bugungi Istisnolar</span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {systemLogs.filter(log => {
                      const seconds = log.timestamp?.seconds ? Number(log.timestamp.seconds) : 0;
                      const ts: number = seconds ? seconds * 1000 : Number(log.timestamp) || 0;
                      return Date.now() - ts < 24 * 60 * 60 * 1000;
                    }).length} ta
                  </span>
                </div>
              </div>

              {/* API and Export failures combined */}
              <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">API va Eksport Faollari</span>
                  <span className="text-2xl font-black text-white mt-1 block font-mono">
                    A: {systemLogs.filter(log => log.errorType === "GeminiAPIError").length} • E: {systemLogs.filter(log => log.errorType === "ExportError").length}
                  </span>
                </div>
              </div>

              {/* Affected Users */}
              <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Zararlangan Profillar</span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {new Set(systemLogs.map(log => log.userId).filter(Boolean)).size} ta profil
                  </span>
                </div>
              </div>

            </div>

            {/* Aggregates row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Aggregated Common Errors */}
              <div className="lg:col-span-1 p-6 bg-slate-900 border border-white/10 rounded-3xl space-y-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">Eng Ko'p Takrorlanganlar</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Platformadagi xatolar turlari kesimidagi hisobotlar.</p>
                </div>

                <div className="space-y-3">
                  {Object.entries(
                    systemLogs.reduce((acc: Record<string, number>, log) => {
                      const type = log.errorType || "KutilmaganXatolik";
                      acc[type] = (acc[type] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                    .slice(0, 8)
                    .map(([type, count], index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-950 border border-white/5 rounded-xl text-xs font-semibold">
                        <span className="text-slate-300 font-mono text-[11px] truncate max-w-[150px]" title={type}>{type}</span>
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-bold">{Number(count)} marta</span>
                      </div>
                    ))}
                  {systemLogs.length === 0 && (
                    <div className="py-8 text-center text-slate-500 text-xs">Hech qanday ma'lumot yo'q</div>
                  )}
                </div>
              </div>

              {/* Latest Audited Logs */}
              <div className="lg:col-span-2 p-6 bg-slate-900 border border-white/10 rounded-3xl space-y-4">
                <div>
                  <h3 className="font-extrabold text-white text-base font-sans">So'nggi Tizim Istisnolari Jurnali</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Haqiqiy vaqt rejimida qayd etilgan barcha kutilmagan platforma xatoliklari.</p>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {systemLogs.slice(0, 50).map((log, index) => {
                    const dateVal = log.timestamp?.seconds 
                      ? new Date(log.timestamp.seconds * 1000).toLocaleString('uz-UZ') 
                      : (log.timestamp ? new Date(Number(log.timestamp)).toLocaleString('uz-UZ') : "Noma'lum");
                    return (
                      <div key={log.id || index} className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2 text-xs font-semibold text-slate-300 hover:bg-slate-950/70">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-red-400">
                              {log.errorType || "Error"}
                            </span>
                            <span className="text-slate-400 text-[10px] font-mono">{log.page || "global"} • {log.action || "execution"}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono font-bold">{dateVal}</span>
                        </div>
                        
                        <p className="text-white text-xs font-mono bg-red-950/20 border border-red-500/10 p-2.5 rounded-xl break-all leading-snug">
                          {log.message || "Tafsilotlar yo'q"}
                        </p>

                        <div className="text-[9px] text-slate-500 font-bold flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-white/5">
                          <span>Mijoz ID: <span className="text-slate-400 font-mono">{log.userId || "noma'lum/guest"}</span></span>
                          <span>Brauzer: <span className="text-slate-400 font-mono">{log.userAgent ? log.userAgent.split(" ").slice(0,3).join(" ") : "noma'lum"}</span></span>
                        </div>
                      </div>
                    );
                  })}
                  {systemLogs.length === 0 && (
                    <div className="py-24 text-center text-slate-500 text-xs font-bold border border-dashed border-white/5 rounded-2xl">
                      Hozircha tizimda kutilmagan xatoliklar jurnali bo'sh. Barqarorlik darajasi: 100%!
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

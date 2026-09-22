import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Briefcase, CheckCircle, Clock, Archive, Sparkles, Plus, FileText, 
  ChevronRight, Calendar, ArrowUpRight, Scale, ShieldCheck, TrendingUp, AlertTriangle, Users
} from "lucide-react";
import { motion } from "motion/react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { useLanguage } from "../contexts/LanguageContext";

interface CaseItem {
  id: string;
  title: string;
  category?: string;
  status: "active" | "inprogress" | "closed" | "archived" | string;
  riskLevel?: string;
  createdAt: number;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: number;
  caseTitle?: string;
}

export function Dashboard() {
  const { t, language, formatDate } = useLanguage();
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Listen to cases
    const qCases = query(collection(db, "cases"), where("userId", "==", uid));
    console.log("[Firestore] listener attached: Dashboard Cases");
    const unsubscribeCases = onSnapshot(qCases, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CaseItem[];
      setCases(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "cases");
      setLoading(false);
    });

    // Listen to recent activities
    const qAct = query(
      collection(db, "activities"), 
      where("userId", "==", uid),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    console.log("[Firestore] listener attached: Dashboard Activities");
    const unsubscribeAct = onSnapshot(qAct, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityItem[];
      setActivities(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "activities");
    });

    // Listen to documents length
    const qDocs = query(collection(db, "documents"), where("userId", "==", uid));
    console.log("[Firestore] listener attached: Dashboard Documents");
    const unsubscribeDocs = onSnapshot(qDocs, (snapshot) => {
      setDocumentCount(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "documents");
    });

    return () => {
      unsubscribeCases();
      console.log("[Firestore] listener detached: Dashboard Cases");
      unsubscribeAct();
      console.log("[Firestore] listener detached: Dashboard Activities");
      unsubscribeDocs();
      console.log("[Firestore] listener detached: Dashboard Documents");
    };
  }, [auth.currentUser?.uid]);

  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.status === "active" || c.status === "inprogress").length;
  const closedCases = cases.filter(c => c.status === "closed").length;
  const archivedCases = cases.filter(c => c.status === "archived").length;

  // Group cases by category
  const categoriesList = ["Mehnat nizosi", "Fuqarolik da'vosi", "Jinoyat ishi", "Ma'muriy shikoyat"];
  const getCategoryCount = (catName: string) => {
    return cases.filter(c => c.category === catName).length;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { text: language === "uz_lat" ? "Faol" : language === "uz_cyr" ? "Фаол" : language === "ru" ? "Активный" : "Active", color: "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-200 border-gray-200 dark:border-zinc-700" };
      case "inprogress":
        return { text: language === "uz_lat" ? "Jarayonda" : language === "uz_cyr" ? "Жараёнда" : language === "ru" ? "В процессе" : "In Progress", color: "bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/65 dark:border-amber-900" };
      case "closed":
        return { text: language === "uz_lat" ? "Yopilgan" : language === "uz_cyr" ? "Ёпилган" : language === "ru" ? "Закрыто" : "Closed", color: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900" };
      case "archived":
        return { text: language === "uz_lat" ? "Arxivlangan" : language === "uz_cyr" ? "Архивланган" : language === "ru" ? "Архивировано" : "Archived", color: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 border-gray-200 dark:border-zinc-800" };
      default:
        return { text: language === "uz_lat" ? "Noma'lum" : language === "uz_cyr" ? "Номаълум" : language === "ru" ? "Неизвестно" : "Unknown", color: "bg-gray-50 text-gray-500 dark:bg-zinc-900 dark:text-zinc-400 border-gray-200 dark:border-zinc-800" };
    }
  };

  return (
    <div className="flex-1 bg-[var(--bg-secondary)] p-4 sm:p-6 lg:p-8 overflow-y-auto leading-normal font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Welcome Section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 sm:p-8 rounded-xl shadow-xs mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                <Scale className="w-3.5 h-3.5" /> {language === "uz_lat" ? "YURIDIK ANALITIKA MARKAZI" : language === "uz_cyr" ? "ЮРИДИК АНАЛИТИКА МАРКАЗИ" : language === "ru" ? "ЮРИДИЧЕСКИЙ АНАЛИТИЧЕСКИЙ ЦЕНТР" : "LEGAL ANALYTICAL CENTER"}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                {t.dashboard.greeting}, {auth.currentUser?.displayName || (language === "uz_lat" ? "Foydalanuvchi" : language === "uz_cyr" ? "Фойдаланувчи" : language === "ru" ? "Пользователь" : "User")}
              </h1>
              <p className="mt-1 text-xs text-[var(--text-muted)] max-w-2xl leading-relaxed">
                {t.dashboard.subGreeting}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/cases"
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold rounded-lg text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {t.cases.createNew}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          
          {/* Jami nizolar */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{t.dashboard.totalCases}</span>
              <div className="p-1.5 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-md">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-gray-900 dark:text-zinc-50 block font-mono">{totalCases}</span>
              <span className="text-[9px] text-gray-400 dark:text-zinc-500 mt-1 block">{language === "uz_lat" ? "Tizimdagi barcha papkalar" : language === "uz_cyr" ? "Тизимдаги барча папкалар" : language === "ru" ? "Все папки в системе" : "All folders in system"}</span>
            </div>
          </div>

          {/* Faollar */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{t.dashboard.activeCases}</span>
              <div className="p-1.5 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-md">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-gray-900 dark:text-zinc-50 block font-mono">{activeCases}</span>
              <span className="text-[9px] text-gray-400 mt-1 block">{language === "uz_lat" ? "Sud jarayonidagi nizolar" : language === "uz_cyr" ? "Суд жараёнидаги низолар" : language === "ru" ? "Дела в судебном процессе" : "Cases in court process"}</span>
            </div>
          </div>

          {/* Muvaffaqiyatlilar */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{language === "uz_lat" ? "Yopilgan ishlar" : language === "uz_cyr" ? "Ёпилган ишлар" : language === "ru" ? "Закрытые дела" : "Closed Cases"}</span>
              <div className="p-1.5 bg-gray-50 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 rounded-md">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-gray-900 dark:text-zinc-50 block font-mono">{closedCases}</span>
              <span className="text-[9px] text-gray-400 dark:text-zinc-500 mt-1 block">{language === "uz_lat" ? "Yechim topilgan da'volar" : language === "uz_cyr" ? "Йечим топилган даъволар" : language === "ru" ? "Решенные споры" : "Resolved disputes"}</span>
            </div>
          </div>

          {/* Arxivlanganlar */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{language === "uz_lat" ? "Arxivlangan" : language === "uz_cyr" ? "Архивланган" : language === "ru" ? "Архивировано" : "Archived"}</span>
              <div className="p-1.5 bg-gray-50 dark:bg-zinc-800 text-gray-500 rounded-md">
                <Archive className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-gray-900 dark:text-zinc-50 block font-mono">{archivedCases}</span>
              <span className="text-[9px] text-gray-400 mt-1 block">{language === "uz_lat" ? "Tarixiy yozuvlar arxivi" : language === "uz_cyr" ? "Тарихий ёзувлар архиви" : language === "ru" ? "Архив прошлых записей" : "Historical records archive"}</span>
            </div>
          </div>

          {/* Generatsiyalar */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{t.common.all} {language === "uz_lat" ? "Hujjatlar" : language === "uz_cyr" ? "Ҳужжатлар" : language === "ru" ? "Документы" : "Documents"}</span>
              <div className="p-1.5 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-md">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-gray-900 dark:text-zinc-50 block font-mono">{documentCount}</span>
              <span className="text-[9px] text-gray-400 dark:text-zinc-500 mt-1 block">{t.dashboard.generatedDocs}</span>
            </div>
          </div>

        </div>

        {/* Categories Analysis and Recent Activities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Categories Chart Widget */}
          <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-200 dark:border-zinc-800">
              <Scale className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">{language === "uz_lat" ? "Yo'nalishlar Ko'rsatkichi" : language === "uz_cyr" ? "Йўналишлар Кўрсаткичи" : language === "ru" ? "Показатели Направлений" : "Disciplinary Index"}</h2>
            </div>

            {totalCases > 0 ? (
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                {categoriesList.map((cat) => {
                  const val = getCategoryCount(cat);
                  const pct = totalCases > 0 ? (val / totalCases) * 100 : 0;
                  
                  const getCategoryLabel = (categoryName: string) => {
                    switch(categoryName) {
                      case "Mehnat nizosi": return language === "uz_lat" ? "Mehnat nizosi" : language === "uz_cyr" ? "Меҳнат низоси" : language === "ru" ? "Трудовой спор" : "Labor dispute";
                      case "Fuqarolik da'vosi": return language === "uz_lat" ? "Fuqarolik da'vosi" : language === "uz_cyr" ? "Фуқаролик даъвоси" : language === "ru" ? "Гражданский иск" : "Civil claim";
                      case "Jinoyat ishi": return language === "uz_lat" ? "Jinoyat ishi" : language === "uz_cyr" ? "Жиноят иши" : language === "ru" ? "Уголовное дело" : "Criminal case";
                      case "Ma'muriy shikoyat": return language === "uz_lat" ? "Ma'muriy shikoyat" : language === "uz_cyr" ? "Маъмурий шикоят" : language === "ru" ? "Административная жалоба" : "Administrative appeal";
                      default: return categoryName;
                    }
                  };

                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-700 dark:text-zinc-300">{getCategoryLabel(cat)}</span>
                        <span className="font-mono text-gray-400 dark:text-zinc-500 text-[10px]">{val} ({Math.round(pct)}%)</span>
                      </div>
                      
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(pct, 2)}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 flex-1 flex flex-col items-center justify-center">
                <Briefcase className="w-8 h-8 text-gray-300 dark:text-zinc-700 mb-2" />
                <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-[150px] mx-auto leading-relaxed">
                  {language === "uz_lat" ? "Yo'nalishlar statistikasini ko'rish uchun yuridik ish yarating." : language === "uz_cyr" ? "Йўналишлар статистикасини кўриш учун юридик иш яратинг." : language === "ru" ? "Создайте дело для просмотра статистики направлений." : "Initiate a case filing to populate metrics."}
                </p>
              </div>
            )}
          </div>

          {/* Activities list and recent cases widget */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recent Cases */}
            <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-zinc-800">
                <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  {language === "uz_lat" ? "Yaqinda ochilgan ishlar" : language === "uz_cyr" ? "Яқинда очилган ишлар" : language === "ru" ? "Последние открытые дела" : "Recently Opened Cases"}
                </h2>
                <Link to="/cases" className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 hover:underline hover:opacity-80">
                  {t.dashboard.viewAll} →
                </Link>
              </div>

              {cases.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                  {cases.slice(0, 3).map((c) => {
                    const badge = getStatusBadge(c.status);
                    
                    const getCategoryLabel = (categoryName: string) => {
                      switch(categoryName) {
                        case "Mehnat nizosi": return language === "uz_lat" ? "Mehnat nizosi" : language === "uz_cyr" ? "Меҳнат низоси" : language === "ru" ? "Трудовой спор" : "Labor dispute";
                        case "Fuqarolik da'vosi": return language === "uz_lat" ? "Fuqarolik da'vosi" : language === "uz_cyr" ? "Фуқаролик даъвоси" : language === "ru" ? "Гражданский иск" : "Civil claim";
                        case "Jinoyat ishi": return language === "uz_lat" ? "Jinoyat ishi" : language === "uz_cyr" ? "Жиноят иши" : language === "ru" ? "Уголовное дело" : "Criminal case";
                        case "Ma'muriy shikoyat": return language === "uz_lat" ? "Ma'muriy shikoyat" : language === "uz_cyr" ? "Маъмурий шикоят" : language === "ru" ? "Административная жалоба" : "Administrative appeal";
                        default: return categoryName;
                      }
                    };

                    return (
                      <div key={c.id} className="py-3 flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-lg group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition-colors shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-xs truncate group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                              {c.title}
                            </h3>
                            <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-medium block mt-0.5">
                              {c.category ? getCategoryLabel(c.category) : (language === "uz_lat" ? "Kategoriya kiritilmagan" : language === "uz_cyr" ? "Категория киритилмаган" : language === "ru" ? "Категория не указана" : "No category specified")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${badge.color}`}>
                            {badge.text}
                          </span>
                          <Link 
                            to="/cases" 
                            className="p-1 bg-gray-50 hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-100 text-gray-600 hover:text-white dark:hover:text-zinc-950 border border-gray-200 dark:border-zinc-700 rounded transition-all"
                            title="Ochish"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 dark:text-zinc-500">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">{language === "uz_lat" ? "Ushbu kabinetda hozircha hech qanday ish mavjud emas." : language === "uz_cyr" ? "Ушбу кабинетда ҳозирча ҳеч қандай иш мавжуд эмас." : language === "ru" ? "В этом кабинете пока нет судебных дел." : "No courtroom files loaded yet."}</p>
                </div>
              )}
            </div>

            {/* Upcoming Deadlines Widget */}
            <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-xl border border-gray-200 dark:border-zinc-800/80 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-zinc-800">
                <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-900 dark:text-zinc-200" />
                  {language === "uz_lat" ? "Muddati Yaqinlashayotgan Protsesslar" : language === "uz_cyr" ? "Муддати Яқинлашаётган Процесслар" : language === "ru" ? "Процессы с истекающим сроком" : "Upcoming Procedural Deadlines"}
                </h2>
                <Link to="/timeline" className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 hover:underline hover:opacity-80">
                  {language === "uz_lat" ? "Taqvim" : language === "uz_cyr" ? "Тақвим" : language === "ru" ? "Календарь" : "Calendar"} →
                </Link>
              </div>

              {(() => {
                const upcomingDeadlines = cases.flatMap(c => {
                  const dls = (c as any).deadlines || [];
                  return dls.map((dl: any) => ({
                    ...dl,
                    caseId: c.id,
                    caseTitle: c.title
                  }));
                }).filter((dl: any) => !dl.completed)
                  .sort((a: any, b: any) => a.dueDate - b.dueDate)
                  .slice(0, 3);

                const getDeadlineTypeName = (type?: string) => {
                  switch (type) {
                    case "hearing": return language === "uz_lat" ? "Sud majlisi" : language === "uz_cyr" ? "Суд мажлиси" : language === "ru" ? "Судебное заседание" : "Court hearing";
                    case "appeal": return language === "uz_lat" ? "Apellyatsiya" : language === "uz_cyr" ? "Апелляция" : language === "ru" ? "Апелляция" : "Appeal submission";
                    case "submission": return language === "uz_lat" ? "Hujjat topshirish" : language === "uz_cyr" ? "Ҳужжат топшириш" : language === "ru" ? "Подача документов" : "Document filing";
                    default: return language === "uz_lat" ? "Procedural Amal" : language === "uz_cyr" ? "Процедурал Амал" : language === "ru" ? "Процессуальное действие" : "Procedural Action";
                  }
                };

                const getDeadlineTypeStyle = (type?: string) => {
                  switch (type) {
                    case "hearing": return "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200/50";
                    case "appeal": return "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/50";
                    case "submission": return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200/50 dark:border-zinc-700";
                    default: return "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border-gray-200/40 dark:border-zinc-700";
                  }
                };

                const getDaysLeftLabel = (dueDate: number) => {
                  const now = Date.now();
                  const diff = dueDate - now;
                  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  if (days < 0) return { text: language === "uz_lat" ? "Muddati o'tgan" : language === "uz_cyr" ? "Муддати ўтган" : language === "ru" ? "Просрочено" : "Overdue", style: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900" };
                  if (days === 0) return { text: language === "uz_lat" ? "Bugun" : language === "uz_cyr" ? "Бугун" : language === "ru" ? "Сегодня" : "Today", style: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border border-red-200 animate-pulse font-bold" };
                  if (days === 1) return { text: language === "uz_lat" ? "Ertaga" : language === "uz_cyr" ? "Эртага" : language === "ru" ? "Завтра" : "Tomorrow", style: "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900" };
                  return { text: language === "uz_lat" ? `${days} kun qoldi` : language === "uz_cyr" ? `${days} кун қолди` : language === "ru" ? `Осталось дней: ${days}` : `${days} days left`, style: "bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700" };
                };

                if (upcomingDeadlines.length > 0) {
                  return (
                    <div className="space-y-3">
                      {upcomingDeadlines.map((dl: any) => {
                        const countdown = getDaysLeftLabel(dl.dueDate);
                        return (
                          <div key={dl.id} className="p-3.5 bg-gray-50/50 dark:bg-zinc-700/10 rounded-lg border border-gray-200 dark:border-zinc-800 flex items-center justify-between gap-4 group hover:border-gray-300 dark:hover:border-zinc-700 transition-all">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-500 rounded h-10 w-10 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-gray-800 dark:text-zinc-100 text-xs truncate">
                                  {dl.title}
                                </h3>
                                <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                                  {language === "uz_lat" ? "Nizo" : language === "uz_cyr" ? "Низо" : language === "ru" ? "Спор" : "Dispute"}: {dl.caseTitle}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getDeadlineTypeStyle(dl.type)}`}>
                                {getDeadlineTypeName(dl.type)}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${countdown.style}`}>
                                {countdown.text}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                } else {
                  return (
                    <div className="text-center py-8 text-gray-400 dark:text-zinc-500">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <p className="text-xs">{language === "uz_lat" ? "Faol ishlarda yaqin kutilayotgan muhlatingiz yo'q." : language === "uz_cyr" ? "Фаол ишларда яқин кутилаётган муҳлатингиз йўқ." : language === "ru" ? "У вас нет невыполненных сроков в активных делах." : "No upcoming court deadlines detected in active files."}</p>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Recent Global Activities */}
            <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-zinc-800">
                <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                  {language === "uz_lat" ? "Oxirgi harakatlar hisobi" : language === "uz_cyr" ? "Охирги ҳаракатлар ҳисоби" : language === "ru" ? "История последних действий" : "Operational Log Book"}
                </h2>
                <Link to="/activity" className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 hover:underline hover:opacity-80">
                  {language === "uz_lat" ? "Tarix" : language === "uz_cyr" ? "Тарих" : language === "ru" ? "История" : "History"} →
                </Link>
              </div>

              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((act) => {
                    const actDate = new Date(act.timestamp);
                    return (
                      <div key={act.id} className="flex gap-2.5 items-start">
                        <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-200 mt-1.5 shrink-0" />
                        <div className="space-y-0.5 leading-normal">
                          <p className="font-bold text-gray-800 dark:text-zinc-100 text-xs">
                            {act.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium whitespace-pre-wrap">
                            {act.description}
                          </p>
                          <span className="inline-block text-[9px] text-gray-400 dark:text-zinc-500 font-mono">
                            {formatDate ? formatDate(actDate) : actDate.toLocaleDateString()} {actDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 dark:text-zinc-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">{language === "uz_lat" ? "Hech qanday harakatlar tarixi topilmadi." : language === "uz_cyr" ? "Ҳеч қандай ҳаракатлар тарихи топилмади." : language === "ru" ? "История активности не обнаружена." : "No current operational tracking records exist."}</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;

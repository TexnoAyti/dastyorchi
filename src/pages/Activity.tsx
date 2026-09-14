import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, orderBy, limit, deleteDoc, doc, getDocs } from "firebase/firestore";
import { 
  Clock, Calendar, FileText, AlertTriangle, ShieldCheck, 
  Map, Lightbulb, Trash2, Search, Briefcase, ChevronRight, Filter, Info, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

interface ActivityItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  caseId: string | null;
  caseTitle: string | null;
  timestamp: number;
}

const LOCAL_TRANSLATIONS = {
  uz_lat: {
    title: "Global Harakatlar Tarixi",
    sub: "Case Management tizimidagi barcha muhim protsessual amallar va AI hisobotlari generatsiyasining to'liq vaqtli yozuvlari.",
    clearHistory: "Tarixni tozalash",
    clearConfirm: "Barcha loglarni butunlay o'chirib yubormoqchimisiz? Ushbu amaldan so'ng tarixni ortga qaytarib bo'lmaydi.",
    searchPlaceholder: "Loglarni, ish nomlarini yoki tafsilotlarni qidirish...",
    totalRecords: "Jami yozuvlar",
    filter: "Filtr",
    loading: "Harakatlar yuklanmoqda...",
    noFavs: "Harakatlar mavjud emas",
    noFavsSub: "Tanlangan parametrlar bo'yicha hech qanday logga mos keluvchi hodisalar qayd etilmadi.",
    caseAttached: "Ishga biriktirilgan:",
    systemLogsName: "Tizim loglari",
    all: "Barchasi",
    case_create: "Ish yaratildi",
    case_archive: "Ish arxivlandi",
    case_delete: "Ish o'chirildi",
    case_status: "Maqom o'zgardi",
    document_create: "Hujjat yaratildi",
    document_export: "Hujjat eksporti",
    document_archive: "Hujjat arxivlandi",
    risk_generate: "Risk tahlili",
    strategy_generate: "Sud strategiyasi",
    expertise_generate: "AI Ekspertizasi",
    note_update: "Eslatma tahriri",
    evidence_add: "Dalil yuklash",
    amal: "Amal"
  },
  uz_cyr: {
    title: "Глобал Ҳаракатлар Тарихи",
    sub: "Case Management тизимидаги барча муҳим процессуал амаллар ва AI ҳисоботлари генерациясининг тўлиқ вақтли ёзувлари.",
    clearHistory: "Тарихни тозалаш",
    clearConfirm: "Барча логларни бутунлай ўчириб юбормоқчимисиз? Ушбу амалдан сўнг тарихни ортга қайтариб бўлмайди.",
    searchPlaceholder: "Логларни, иш номларини ёки тафсилотларни қидириш...",
    totalRecords: "Жами ёзувлар",
    filter: "Фильтр",
    loading: "Ҳаракатлар юкланмоқда...",
    noFavs: "Ҳаракатлар мавжуд эмас",
    noFavsSub: "Танланган параметрлар бўйича ҳеч қандай логга мос келувчи ҳодисалар қайд этилмади.",
    caseAttached: "Ишга бириктирилган:",
    systemLogsName: "Тизим логлари",
    all: "Барчаси",
    case_create: "Иш яратилди",
    case_archive: "Иш архивланди",
    case_delete: "Иш ўчирилди",
    case_status: "Мақом ўзгарди",
    document_create: "Ҳужжат яратилди",
    document_export: "Ҳужжат экспорти",
    document_archive: "Ҳужжат архивланди",
    risk_generate: "Риск таҳлили",
    strategy_generate: "Суд стратегияси",
    expertise_generate: "AI Экспертизаси",
    note_update: "Эслатма таҳрири",
    evidence_add: "Далил юклаш",
    amal: "Амал"
  },
  ru: {
    title: "История Глобальной Активности",
    sub: "Электронный журнал учета всех процессуальных шагов и сгенерированных отчетов искусственного интеллекта в экосистеме.",
    clearHistory: "Очистить историю",
    clearConfirm: "Вы уверены, что хотите полностью очистить историю логов активности? Это действие необратимо.",
    searchPlaceholder: "Поиск по логам, наименованиям дел и описаниям...",
    totalRecords: "Всего записей",
    filter: "Фильтр",
    loading: "Загрузка логов активности...",
    noFavs: "Активности не найдено",
    noFavsSub: "По выбранным критериям или введенному запросу записей в электронном журнале не обнаружено.",
    caseAttached: "Привязано к делу:",
    systemLogsName: "Системные логи",
    all: "Все записи",
    case_create: "Дело создано",
    case_archive: "Дело архивировано",
    case_delete: "Дело удалено",
    case_status: "Изменение статуса",
    document_create: "Документ создан",
    document_export: "Экспорт документа",
    document_archive: "Документ архивирован",
    risk_generate: "Анализ рисков",
    strategy_generate: "Судебная стратегия",
    expertise_generate: "AI Экспертиза",
    note_update: "Изменение заметки",
    evidence_add: "Загрузка доказательства",
    amal: "Действие"
  },
  en: {
    title: "Global Activity History",
    sub: "Comprehensive secure chronological ledger of all platform interactions, generated AI legal assessments, and cases changes.",
    clearHistory: "Clear History Log",
    clearConfirm: "Are you sure you want to completely erase the audit logs? This process cannot be undone.",
    searchPlaceholder: "Search through events, descriptions, or case titles...",
    totalRecords: "Total Records",
    filter: "Filter Mode",
    loading: "Retrieving audit trails...",
    noFavs: "No activities logged to date",
    noFavsSub: "No logged events correspond to your search queries or selected filtering options.",
    caseAttached: "Linked Case Folder:",
    systemLogsName: "System Logs",
    all: "All Logs",
    case_create: "Case created",
    case_archive: "Case archived",
    case_delete: "Case deleted",
    case_status: "Status updated",
    document_create: "Document created",
    document_export: "Document exported",
    document_archive: "Document archived",
    risk_generate: "Risk analysis",
    strategy_generate: "Court strategy",
    expertise_generate: "AI Expertise",
    note_update: "Note updated",
    evidence_add: "Evidence uploaded",
    amal: "Action"
  }
};

export function ActivityPage() {
  const { language } = useLanguage();
  const lt = LOCAL_TRANSLATIONS[language] || LOCAL_TRANSLATIONS.uz_lat;

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("Barchasi");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "activities"),
      where("userId", "==", uid)
    );

    console.log("[Firestore] listener attached: Activity List");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityItem[];
      
      // Sort descending by timestamp
      items.sort((a,b) => b.timestamp - a.timestamp);
      setActivities(items);
      setLoading(false);
    }, (error) => {
      console.error("Error matching activities:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      console.log("[Firestore] listener detached: Activity List");
    };
  }, [auth.currentUser?.uid]);

  const handleClearActivities = async () => {
    if (!window.confirm(lt.clearConfirm)) return;
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const q = query(collection(db, "activities"), where("userId", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "activities", d.id)));
      await Promise.all(deletePromises);
    } catch (err) {
      console.error("Failed clearing history:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityTheme = (type: string) => {
    switch (type) {
      case "case_create":
        return { icon: Briefcase, bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30", label: lt.case_create };
      case "case_archive":
        return { icon: Briefcase, bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30", label: lt.case_archive };
      case "case_delete":
        return { icon: Trash2, bg: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30", label: lt.case_delete };
      case "case_status":
        return { icon: Clock, bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30", label: lt.case_status };
      case "document_create":
        return { icon: FileText, bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30", label: lt.document_create };
      case "document_export":
        return { icon: FileText, bg: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30", label: lt.document_export };
      case "document_archive":
        return { icon: FileText, bg: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700", label: lt.document_archive };
      case "risk_generate":
        return { icon: AlertTriangle, bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30", label: lt.risk_generate };
      case "strategy_generate":
        return { icon: Lightbulb, bg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30", label: lt.strategy_generate };
      case "expertise_generate":
        return { icon: ShieldCheck, bg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30", label: lt.expertise_generate };
      case "note_update":
        return { icon: FileText, bg: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/30", label: lt.note_update };
      case "evidence_add":
        return { icon: Map, bg: "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/30", label: lt.evidence_add };
      default:
        return { icon: Info, bg: "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-100 dark:border-zinc-700", label: lt.amal };
    }
  };

  const activityTypes = [
    "Barchasi",
    "case_create",
    "document_create",
    "risk_generate",
    "strategy_generate",
    "expertise_generate",
    "document_export"
  ];

  const filteredActivities = activities.filter(act => {
    const matchesSearch = act.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (act.caseTitle && act.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === "Barchasi" || act.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="relative min-h-screen bg-[#f8fafc] dark:bg-zinc-950 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-100/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-indigo-100/15 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 font-sans">
        
        {/* Header Board */}
        <div className="backdrop-blur-xl bg-white/50 dark:bg-zinc-900/60 border border-white/60 dark:border-zinc-800/80 p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <Clock className="w-3.5 h-3.5 animate-pulse" /> {lt.systemLogsName}
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight sm:text-3xl">
                {lt.title}
              </h1>
              <p className="mt-1 text-slate-500 dark:text-zinc-400 text-sm">
                {lt.sub}
              </p>
            </div>

            {activities.length > 0 && (
              <button
                onClick={handleClearActivities}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-800 dark:hover:text-rose-300 rounded-xl text-xs font-semibold border border-rose-100/50 dark:border-rose-900/40 transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                {lt.clearHistory}
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-5 rounded-3xl border border-white/70 dark:border-zinc-800/80 shadow-xs mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lt.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-xs"
              />
            </div>

            {/* Selector count */}
            <div className="text-xs text-slate-400 dark:text-zinc-400 font-bold shrink-0 self-end md:self-center">
              {lt.totalRecords}: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{filteredActivities.length} {language === "ru" || language === "en" ? "" : "ta"}</span>
            </div>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 select-none mr-2">
              <Filter className="w-3.5 h-3.5" /> {lt.filter}:
            </span>
            {activityTypes.map(type => {
              const info = getActivityTheme(type);
              const label = type === "Barchasi" ? lt.all : info.label;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer border ${
                    selectedType === type
                      ? "bg-slate-900 dark:bg-zinc-100 border-slate-900 dark:border-zinc-100 text-white dark:text-zinc-950 shadow-xs"
                      : "bg-white/70 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline View */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
          <AnimatePresence initial={false}>
            {loading ? (
              <div className="text-center py-20 text-slate-400 dark:text-zinc-500 font-sans text-sm">
                {lt.loading}
              </div>
            ) : filteredActivities.length > 0 ? (
              filteredActivities.map((act, index) => {
                const theme = getActivityTheme(act.type);
                const ActIcon = theme.icon;
                const actDate = new Date(act.timestamp);
                
                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.45) }}
                    className="relative group bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-white/85 dark:border-zinc-800/80 p-5 shadow-xs hover:shadow-sm hover:border-slate-300/60 dark:hover:border-zinc-700 transition-all"
                  >
                    {/* Point relative line dot */}
                    <div className={`absolute -left-[30px] sm:-left-[34px] top-5 w-4.5 h-4.5 rounded-full border-4 border-slate-50 dark:border-zinc-950 flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 z-10 ${theme.bg}`}>
                      {/* Inner point */}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border shrink-0 ${theme.bg}`}>
                          <ActIcon className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-sm tracking-tight">
                          {act.title}
                        </span>
                        
                        <span className="hidden sm:inline bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {theme.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-400 font-mono self-start sm:self-center">
                        <Calendar className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-500" />
                        {actDate.toLocaleDateString(language === "en" ? "en-US" : language === "ru" ? "ru-RU" : "uz-UZ")}
                        <span className="text-slate-300 dark:text-zinc-600">•</span>
                        {actDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans max-w-3xl pr-4">
                      {act.description}
                    </p>

                    {/* Associated Case Reference Badge */}
                    {act.caseId && act.caseTitle && (
                      <div className="inline-flex items-center gap-1.5 mt-3.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 rounded-xl px-3 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-100/50 transition-colors">
                        <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                        <span>{lt.caseAttached}</span>
                        <Link to="/cases" className="font-bold underline text-blue-800 dark:text-blue-400">
                          {act.caseTitle}
                        </Link>
                        <ChevronRight className="w-3 h-3 text-blue-400 dark:text-zinc-500" />
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-dashed border-slate-200/80 dark:border-zinc-800 p-6 shadow-xs relative -left-6 sm:-left-8">
                <Clock className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 dark:text-zinc-300 text-sm">{lt.noFavs}</h3>
                <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1 max-w-xs mx-auto font-sans">
                  {lt.noFavsSub}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

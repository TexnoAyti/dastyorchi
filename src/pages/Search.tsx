import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { 
  Search, Briefcase, FileText, MessageSquare, AlertTriangle, Lightbulb, 
  ShieldCheck, FileEdit, ArrowRight, Loader2, Info, Compass, HelpCircle, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getDocumentCategory, getCategoryTheme } from "./Documents";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

interface SearchResult {
  id: string;
  sourceType: "case" | "document" | "chat" | "risk" | "strategy" | "expertise" | "note";
  title: string;
  subtitle?: string;
  contextSnippet: string;
  linkTo: string;
  metadata?: string;
}

const LOCAL_TRANSLATIONS = {
  uz_lat: {
    title: "Global Qidiruv",
    sub: "Case Workspace kross-tizimi. Barcha ochiq ish papkalari, yuridik hujjatlar, AI suhbatlari, risk tahlillari, sud rejalari va maxfiy eslatmalarni kalit so'z bo'yicha markaziy skanerlash.",
    placeholder: "Qonuniy kalit so'zlar, ish yoki sarlavhani kiriting (kamida 2 ta harf)...",
    lengthWarning: "Ism yoki kalit so'zni topish uchun yana kamida bitta belgi kiriting.",
    all: "Barchasi",
    cases: "Ishlar",
    documents: "Hujjatlar",
    chats: "Suhbatlar",
    intelligence: "AI Risk / Reja / Note",
    loading: "Sinxron qidiruv faollashtirilmoqda...",
    queryDescription: "So'rov bo'yicha:",
    matchesCount: "Mos kelganlar:",
    open: "Ochish",
    noResults: "Natijalar yo'q",
    noResultsSub: "Kiritilgan ibora bo'yicha hech qanday ish, hujjat, suhbat, yoki risk tahlillari topilmadi. Qisqaroq yoki boshqacharoq kalit so'zlar sinab ko'ring.",
    startSearch: "Qidirish uchun so‘z kiriting.",
    startSearchSub: "Qutiga ism, yuridik modda nomlanishi, shartnoma kodi yoki tahliliy argumentlarni yozib izlashni boshlashingiz mumkin.",
    case_folder: "Ish papqasi",
    unspecified_dispute: "Umumiy nizolar",
    no_desc: "Tavsif berilmagan. Ish materiallari papqasi.",
    active: "Faol",
    closed: "Yopilgan",
    risk_analysis: "Risk Tahlili",
    risk_section: "Xavf-xatarlar bo'limi",
    medium: "O'rtacha",
    legal_strategy: "Sud Strategiyasi",
    action_plan: "Harakatlar rejasi va taktikalar",
    legal_expertise: "Tahliliy Ekspertiza",
    legal_foundations: "Qonunchilik normalari asosi",
    notes: "Eslatmalar",
    special_notes: "Himoyachi maxsus eslatmalari",
    legal_document: "Yuridik Hujjat",
    docs_section: "Hujjatlar bo'limi",
    formatted_text: "Formatlangan matn",
    updated: "Yangilangan",
    ai_consult: "AI Yuridik Konsultatsiya",
    chats_section: "Konsultatsiya suhbatlari",
    chat_with_ai: "AI maslahatchi bilan suhbat sarlavhasi mos keldi.",
    messages_count: "Xabarlar soni:",
    types_mapping: {
      case: "Ish",
      document: "Hujjat",
      chat: "Suhbat",
      risk: "Xavf",
      strategy: "Reja",
      expertise: "Ekspertiza",
      note: "Eslatma",
      system: "Tizim"
    }
  },
  uz_cyr: {
    title: "Глобал Қидирув",
    sub: "Case Workspace кросс-тизими. Барча очиқ иш папкалари, юридик ҳужжатлар, AI суҳбатлари, риск таҳлиллари, суд режалари ва махфий эслатмаларни калит сўз бўйича марказий сканерлаш.",
    placeholder: "Қонуний калит сўзлар, иш ёки сарлавҳани киритинг (камида 2 та ҳарф)...",
    lengthWarning: "Исм ёки калит сўзни топиш учун яна камида битта белги киритинг.",
    all: "Барчаси",
    cases: "Ишлар",
    documents: "Ҳужжатлар",
    chats: "Суҳбатлар",
    intelligence: "AI Риск / Режа / Noте",
    loading: "Синхрон қидирув фаоллаштирилмоқда...",
    queryDescription: "Сўров бўйича:",
    matchesCount: "Мос келганлар:",
    open: "Очиш",
    noResults: "Натижалар йўқ",
    noResultsSub: "Киритилган ибора бўйича ҳеч қандай иш, ҳужжат, суҳбат, ёки риск таҳлиллари топилмади. Қисқароқ ёки бошқачароқ калит сўзлар синаб кўринг.",
    startSearch: "Қидирувни бошланг",
    startSearchSub: "Қутига исм, юридик модда номланиши, шартнома коди ёки таҳлилий аргументларни ёзиб излашни бошлашингиз мумкин.",
    case_folder: "Иш папкаси",
    unspecified_dispute: "Умумий низолар",
    no_desc: "Тавсиф берилмаган. Иш материаллари папкаси.",
    active: "Фаол",
    closed: "Ёпилган",
    risk_analysis: "Риск Таҳлили",
    risk_section: "Хавф-хатарлар бўлими",
    medium: "Ўртача",
    legal_strategy: "Суд Стратегияси",
    action_plan: "Ҳаракатлар режаси ва тактикалар",
    legal_expertise: "Таҳлилий Экспертиза",
    legal_foundations: "Қонунчилик нормалари асоси",
    notes: "Эслатмалар",
    special_notes: "Ҳимоячи махсус эслатмалари",
    legal_document: "Юридик Ҳужжат",
    docs_section: "Ҳужжатлар бўлими",
    formatted_text: "Форматланган матн",
    updated: "Янгиланган",
    ai_consult: "AI Юридик Консультация",
    chats_section: "Консультация суҳбатлари",
    chat_with_ai: "AI маслаҳатчи билан суҳбат сарлавҳаси мос келди.",
    messages_count: "Хабарлар сони:",
    types_mapping: {
      case: "Иш",
      document: "Ҳужжат",
      chat: "Суҳбат",
      risk: "Хавф",
      strategy: "Режа",
      expertise: "Экспертиза",
      note: "Эслатма",
      system: "Тизим"
    }
  },
  ru: {
    title: "Глобальный Поиск",
    sub: "Служба сквозного интеллектуального поиска. Централизованное сканирование всех активных дел, юридических документов, диалогов с ИИ, детальных анализов и конфиденциальных заметок.",
    placeholder: "Введите ключевые слова, статьи кодекса или номер договора...",
    lengthWarning: "Для выполнения запроса введите не менее двух символов.",
    all: "Все результаты",
    cases: "Дела",
    documents: "Документы",
    chats: "Диалоги",
    intelligence: "AI Аналитика",
    loading: "Активация поискового индекса системы...",
    queryDescription: "По запросу:",
    matchesCount: "Найдено записей:",
    open: "Открыть",
    noResults: "Ничего не найдено",
    noResultsSub: "По ключевым словам совпадений в базах дел, архивных материалов, AI-отчетов или истории консультаций не обнаружено.",
    startSearch: "Начните поиск",
    startSearchSub: "Вы можете ввести наименования сторон, юридические термины, разделы и статьи законов, коды документов для быстрого поиска.",
    case_folder: "Папка судебного дела",
    unspecified_dispute: "Общие правовые споры",
    no_desc: "Описание отсутствует. Папка материалов дела.",
    active: "Активно",
    closed: "Закрыто",
    risk_analysis: "Анализ рисков",
    risk_section: "Раздел управления рисками",
    medium: "Средний",
    legal_strategy: "Стратегия защиты",
    action_plan: "Планы процессуальных шагов",
    legal_expertise: "Правовая экспертиза",
    legal_foundations: "Законодательные обоснования",
    notes: "Заметки",
    special_notes: "Личные защитные пометки",
    legal_document: "Юридический документ",
    docs_section: "Раздел документов",
    formatted_text: "Форматированный текст",
    updated: "Дата изменения",
    ai_consult: "Юридическая консультация AI",
    chats_section: "Архив консультаций",
    chat_with_ai: "Совпадение заголовка сессии консультации ИИ.",
    messages_count: "Количество реплик:",
    types_mapping: {
      case: "Дело",
      document: "Документ",
      chat: "Чат",
      risk: "Риски",
      strategy: "Планы",
      expertise: "Экспертизы",
      note: "Заметки",
      system: "Система"
    }
  },
  en: {
    title: "Omni-Search Hub",
    sub: "Secure cross-system indexing. Instant deep search across case files, document drafts, active lawyer briefings, AI models, and custom advisory notes.",
    placeholder: "Type legal keywords, articles of law, client names, or contracts identifiers...",
    lengthWarning: "Please enter at least two characters to proceed with indexing.",
    all: "All matches",
    cases: "Legal Cases",
    documents: "Drafts Hub",
    chats: "AI Consultations",
    intelligence: "AI Risk / Plans / Notes",
    loading: "Initializing background indexing sequence...",
    queryDescription: "Search Query:",
    matchesCount: "Indexed Matches:",
    open: "Open File",
    noResults: "No matches found",
    noResultsSub: "We searched through every legal file, custom intelligence matrix, and history log. Try adjusting your query keywords.",
    startSearch: "Begin Indexing Search",
    startSearchSub: "Quickly browse system contents by names, specific governing regulations, article counts, or custom file comments.",
    case_folder: "Active Case Binder",
    unspecified_dispute: "General Disputes",
    no_desc: "No descriptions saved for this case binder.",
    active: "Active",
    closed: "Closed",
    risk_analysis: "Risk Analysis",
    risk_section: "Assessments section",
    medium: "Medium",
    legal_strategy: "Litigation Strategy",
    action_plan: "Actionable milestones",
    legal_expertise: "Legal Analysis",
    legal_foundations: "Statute compliance grounds",
    notes: "Advisory Notes",
    special_notes: "Protected attorney notes",
    legal_document: "Legal Draft Document",
    docs_section: "Compiled assets section",
    formatted_text: "Standard layout draft",
    updated: "Updated on",
    ai_consult: "Lawyer Consultation session",
    chats_section: "Historical logs section",
    chat_with_ai: "Encountered keyword match in consultation session title",
    messages_count: "Message length:",
    types_mapping: {
      case: "Case",
      document: "Document",
      chat: "Chat",
      risk: "Risk",
      strategy: "Strategy",
      expertise: "Expertise",
      note: "Notes",
      system: "System"
    }
  }
};

export function SearchPage({ user }: { user?: any }) {
  const { language } = useLanguage();
  const lt = LOCAL_TRANSLATIONS[language] || LOCAL_TRANSLATIONS.uz_lat;
  const authContext = useAuth();
  const activeUid = user?.uid || authContext.uid || auth.currentUser?.uid || null;
  const authReady = authContext.authReady || Boolean(activeUid);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "cases" | "documents" | "chats" | "intelligence">("all");
  
  const [cases, setCases] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(Boolean(activeUid));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!authReady) {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }

    if (!activeUid) {
      setDocuments([]);
      setCases([]);
      setChats([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const timeoutTimer = setTimeout(() => {
      setLoading(false);
    }, 4500);

    let docsDone = false;
    let casesDone = false;
    let chatsDone = false;

    const checkComplete = () => {
      if (docsDone && casesDone && chatsDone) {
        clearTimeout(timeoutTimer);
        setLoading(false);
      }
    };

    // Fetch documents
    const qDocs = query(collection(db, "documents"), where("userId", "==", activeUid));
    console.log("[Firestore] listener attached: Search Documents");
    const unsubscribeDocs = onSnapshot(qDocs, (snap) => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      docsDone = true;
      checkComplete();
    }, (error) => {
      console.error("[Firestore] search documents error:", error);
      docsDone = true;
      checkComplete();
    });

    // Fetch cases
    const qCases = query(collection(db, "cases"), where("userId", "==", activeUid));
    console.log("[Firestore] listener attached: Search Cases");
    const unsubscribeCases = onSnapshot(qCases, (snap) => {
      setCases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      casesDone = true;
      checkComplete();
    }, (error) => {
      console.error("[Firestore] search cases error:", error);
      casesDone = true;
      checkComplete();
    });

    // Fetch chats
    const qChats = query(collection(db, "chats"), where("userId", "==", activeUid));
    console.log("[Firestore] listener attached: Search Chats");
    const unsubscribeChats = onSnapshot(qChats, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      chatsDone = true;
      checkComplete();
    }, (error) => {
      console.error("[Firestore] search chats error:", error);
      chatsDone = true;
      checkComplete();
    });

    return () => {
      clearTimeout(timeoutTimer);
      unsubscribeDocs();
      console.log("[Firestore] listener detached: Search Documents");
      unsubscribeCases();
      console.log("[Firestore] listener detached: Search Cases");
      unsubscribeChats();
      console.log("[Firestore] listener detached: Search Chats");
    };
  }, [activeUid, authReady, retryKey]);

  const getDocDate = (item: any) => {
    if (item.createdAt?.seconds) return item.createdAt.seconds * 1000;
    if (typeof item.createdAt === "number") return item.createdAt;
    return 0;
  };

  const getSnippets = (text: string, keyword: string, maxLen: number = 140) => {
    if (!text) return "";
    const cleanText = text.replace(/<[^>]*>/g, ""); // Strip html
    const index = cleanText.toLowerCase().indexOf(keyword.toLowerCase());
    
    if (index === -1) {
      return cleanText.slice(0, maxLen) + (cleanText.length > maxLen ? "..." : "");
    }

    const start = Math.max(0, index - 40);
    const end = Math.min(cleanText.length, index + keyword.length + 80);
    let snippet = cleanText.slice(start, end);
    
    if (start > 0) snippet = "..." + snippet;
    if (end < cleanText.length) snippet = snippet + "...";
    
    return snippet;
  };

  const performSearch = (): SearchResult[] => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    const keyword = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    // 1. Search Cases (General Titles, Categories)
    cases.forEach(c => {
      const matchTitle = (c.title || "").toLowerCase().includes(keyword);
      const matchCat = (c.category || "").toLowerCase().includes(keyword);
      const matchDesc = (c.description || "").toLowerCase().includes(keyword);

      if (matchTitle || matchCat || matchDesc) {
        results.push({
          id: c.id,
          sourceType: "case",
          title: c.title,
          subtitle: `${lt.case_folder} • ${c.category || lt.unspecified_dispute}`,
          contextSnippet: c.description ? getSnippets(c.description, keyword) : lt.no_desc,
          linkTo: "/cases",
          metadata: `${lt.queryDescription} ${c.status === "active" ? lt.active : lt.closed}`
        });
      }

      // 2. Search dossier intelligence in Case document
      // Risk Analysis
      if (c.risk && c.risk.toLowerCase().includes(keyword)) {
        results.push({
          id: `${c.id}-risk`,
          sourceType: "risk",
          title: `${lt.risk_analysis}: ${c.title}`,
          subtitle: lt.risk_section,
          contextSnippet: getSnippets(c.risk, keyword),
          linkTo: "/cases",
          metadata: `Risk: ${c.riskLevel || lt.medium}`
        });
      }

      // Legal Strategy
      if (c.strategy && c.strategy.toLowerCase().includes(keyword)) {
        results.push({
          id: `${c.id}-strategy`,
          sourceType: "strategy",
          title: `${lt.legal_strategy}: ${c.title}`,
          subtitle: lt.action_plan,
          contextSnippet: getSnippets(c.strategy, keyword),
          linkTo: "/cases"
        });
      }

      // AI Legal Expertise
      if (c.expertise && c.expertise.toLowerCase().includes(keyword)) {
        results.push({
          id: `${c.id}-expertise`,
          sourceType: "expertise",
          title: `${lt.legal_expertise}: ${c.title}`,
          subtitle: lt.legal_foundations,
          contextSnippet: getSnippets(c.expertise, keyword),
          linkTo: "/cases"
        });
      }

      // Case Notes (New custom textbox field)
      if (c.notes && c.notes.toLowerCase().includes(keyword)) {
        results.push({
          id: `${c.id}-notes`,
          sourceType: "note",
          title: `${lt.notes}: ${c.title}`,
          subtitle: lt.special_notes,
          contextSnippet: getSnippets(c.notes, keyword),
          linkTo: "/cases"
        });
      }
    });

    // 3. Search Documents (Title, category, content text)
    documents.forEach(d => {
      const matchTitle = (d.title || "").toLowerCase().includes(keyword);
      const docContent = d.generatedText || d.content || "";
      const matchContent = docContent.toLowerCase().includes(keyword);

      if (matchTitle || matchContent) {
        results.push({
          id: d.id,
          sourceType: "document",
          title: d.title || lt.formatted_text,
          subtitle: `${lt.docs_section} • ${getDocumentCategory(d)}`,
          contextSnippet: getSnippets(docContent, keyword),
          linkTo: `/result/${d.id}`,
          metadata: `${lt.formatted_text} • ${lt.updated}: ${new Date(getDocDate(d)).toLocaleDateString()}`
        });
      }
    });

    // 4. Search Chat Sessions & Messages
    chats.forEach(ch => {
      const matchTitle = (ch.title || "").toLowerCase().includes(keyword);
      // Scan messages if any
      let matchedMsgSnippet = "";
      let foundInMessages = false;
      if (ch.messages && Array.isArray(ch.messages)) {
        for (const msg of ch.messages) {
          if (msg.content && msg.content.toLowerCase().includes(keyword)) {
            matchedMsgSnippet = getSnippets(msg.content, keyword);
            foundInMessages = true;
            break;
          }
        }
      }

      if (matchTitle || foundInMessages) {
        results.push({
          id: ch.id,
          sourceType: "chat",
          title: ch.title || lt.ai_consult,
          subtitle: lt.chats_section,
          contextSnippet: matchedMsgSnippet || lt.chat_with_ai,
          linkTo: "/consultation",
          metadata: `${lt.messages_count} ${ch.messages?.length || 0}`
        });
      }
    });

    return results;
  };

  const results = performSearch();

  const filteredResults = results.filter(res => {
    if (activeTab === "all") return true;
    if (activeTab === "cases" && res.sourceType === "case") return true;
    if (activeTab === "documents" && res.sourceType === "document") return true;
    if (activeTab === "chats" && res.sourceType === "chat") return true;
    if (activeTab === "intelligence" && ["risk", "strategy", "expertise", "note"].includes(res.sourceType)) return true;
    return false;
  });

  const getSourceTypeTheme = (type: string) => {
    const defaultSelector = { icon: HelpCircle, bg: "bg-slate-50 text-slate-600 border-slate-100", label: lt.types_mapping.system };
    switch (type) {
      case "case":
        return { icon: Briefcase, bg: "bg-blue-50 text-blue-600 border-blue-100", label: lt.types_mapping.case };
      case "document":
        return { icon: FileText, bg: "bg-emerald-50 text-emerald-600 border-emerald-100", label: lt.types_mapping.document };
      case "chat":
        return { icon: MessageSquare, bg: "bg-purple-50 text-purple-600 border-purple-100", label: lt.types_mapping.chat };
      case "risk":
        return { icon: AlertTriangle, bg: "bg-rose-50 text-rose-600 border-rose-100", label: lt.types_mapping.risk };
      case "strategy":
        return { icon: Lightbulb, bg: "bg-teal-50 text-teal-600 border-teal-100", label: lt.types_mapping.strategy };
      case "expertise":
        return { icon: ShieldCheck, bg: "bg-indigo-50 text-indigo-600 border-indigo-100", label: lt.types_mapping.expertise };
      case "note":
        return { icon: FileEdit, bg: "bg-amber-50 text-amber-600 border-amber-100", label: lt.types_mapping.note };
      default:
        return defaultSelector;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f8fafc] overflow-hidden">
      {/* Background visual blobs */}
      <div className="absolute top-[-5%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-blue-100/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-slate-200/15 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 font-sans">
        
        {/* Header Board */}
        <div className="backdrop-blur-xl bg-white/50 border border-white/60 p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl flex items-center gap-2">
            <Search className="w-7 h-7 text-indigo-600" />
            {lt.title}
          </h1>
          <p className="mt-2 text-slate-500 text-sm leading-relaxed">
            {lt.sub}
          </p>
        </div>

        {/* Global Search Input Panel */}
        <div className="bg-white/75 backdrop-blur-md p-6 rounded-3xl border border-white/80 shadow-sm mb-6">
          <div className="relative">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-5.5 h-5.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lt.placeholder}
              className="w-full pl-13 pr-4 py-3.5 bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 rounded-2xl text-sm font-sans tracking-wide transition-all shadow-xs"
            />
          </div>

          {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
            <p className="text-[11px] text-amber-600 font-semibold mt-2.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> {lt.lengthWarning}
            </p>
          )}

          {/* Quick tab filters */}
          {searchQuery.trim().length >= 2 && (
            <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4.5 border-t border-slate-100 overflow-x-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {lt.all} ({results.length})
              </button>
              <button
                onClick={() => setActiveTab("cases")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === "cases" ? "bg-blue-600 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {lt.cases} ({results.filter(r => r.sourceType === "case").length})
               </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === "documents" ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {lt.documents} ({results.filter(r => r.sourceType === "document").length})
              </button>
              <button
                onClick={() => setActiveTab("chats")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === "chats" ? "bg-purple-600 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {lt.chats} ({results.filter(r => r.sourceType === "chat").length})
              </button>
              <button
                onClick={() => setActiveTab("intelligence")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === "intelligence" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {lt.intelligence} ({results.filter(r => ["risk", "strategy", "expertise", "note"].includes(r.sourceType)).length})
              </button>
            </div>
          )}
        </div>

        {/* Results Container */}
        <div>
          {loadError ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/70 backdrop-blur-md rounded-3xl border border-red-200 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">Qidiruv indekslarini yuklashda xatolik yuz berdi</h3>
              <p className="text-slate-500 text-xs mt-1 mb-4">{loadError}</p>
              <button
                onClick={() => setRetryKey(k => k + 1)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Qayta urinish
              </button>
            </div>
          ) : loading && searchQuery.trim().length >= 2 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-slate-400 font-semibold text-xs mt-3">{lt.loading}</p>
            </div>
          ) : searchQuery.trim().length >= 2 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1 select-none">
                <span>{lt.queryDescription} "{searchQuery}"</span>
                <span>{lt.matchesCount} <b className="text-indigo-600">{filteredResults.length} {language === "ru" || language === "en" ? "" : "ta"}</b></span>
              </div>

              <AnimatePresence mode="popLayout">
                {filteredResults.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3.5">
                    {filteredResults.map((res, index) => {
                      const theme = getSourceTypeTheme(res.sourceType);
                      const TypeIcon = theme.icon;

                      return (
                        <motion.div
                          key={res.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.45) }}
                          className="group bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 p-5 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className={`p-3 rounded-xl border shrink-0 ${theme.bg}`}>
                              <TypeIcon className="w-4.5 h-4.5" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                                  {res.title}
                                </h3>
                                <span className="bg-slate-100 text-slate-500 font-bold text-[8.5px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {theme.label}
                                </span>
                              </div>

                              {res.subtitle && (
                                <p className="text-[10px] text-slate-400 font-bold">
                                  {res.subtitle}
                                </p>
                              )}

                              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-normal pt-1">
                                {res.contextSnippet}
                              </p>
                              
                              {res.metadata && (
                                <span className="inline-block text-[10px] text-indigo-600 bg-indigo-50 rounded px-1.5 py-0.5 font-bold border border-indigo-100/50">
                                  {res.metadata}
                                </span>
                              )}
                            </div>
                          </div>

                          <Link
                            to={res.linkTo}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 border border-slate-950 text-[10px] font-extrabold text-white rounded-xl hover:bg-slate-800 transition-all self-start md:self-center shrink-0 shadow-xs cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                          >
                            {lt.open}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-3xl border border-dashed border-slate-200 p-8">
                    <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-700 text-sm">{lt.noResults}</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                      {lt.noResultsSub}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-100/30 backdrop-blur-md rounded-3xl border border-dashed border-slate-200 p-8 select-none">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">{lt.startSearch}</h3>
              <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
                {lt.startSearchSub}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

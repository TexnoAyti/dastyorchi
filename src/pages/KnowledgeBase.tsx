import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, BookOpen, Scale, Copy, MessageSquare, Check, 
  ExternalLink, Bookmark, HelpCircle, UploadCloud, FileJson, 
  RotateCcw, AlertCircle, Database, Sparkles, Info, CheckCircle, Flame, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LEGAL_CODES, LegalArticle } from "../data/legalLibrary";
import { LegalService } from "../services/legalService";
import { callAIServer } from "../services/aiService";

export function KnowledgeBase() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Database search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCodeId, setSelectedCodeId] = useState<string>("all");
  const [articles, setArticles] = useState<LegalArticle[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Interactions and Bookmarks
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("legal_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  
  // AI Legal Linker Search
  const [aiScenario, setAiScenario] = useState("");
  const [aiLinkerResult, setAiLinkerResult] = useState<{
    matchedArticles: LegalArticle[];
    analysis: string;
    confidence?: "High" | "Medium" | "Low";
    matchedKeywords?: string[];
  } | null>(null);
  const [aiLinkerLoading, setAiLinkerLoading] = useState(false);

  // Import tools states
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [jsonPasteData, setJsonPasteData] = useState("");
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Initialize service and load current database articles and counts
  useEffect(() => {
    const initDb = async () => {
      setIsLoading(true);
      await LegalService.init();
      await fetchFromService();
      setIsLoading(false);
    };

    initDb();

    // Subscribe to auto-updates (from background sync or user import)
    const unsubscribe = LegalService.subscribe(() => {
      fetchFromService();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch updated list and counts based on criteria
  const fetchFromService = async () => {
    const results = await LegalService.search(searchQuery, selectedCodeId);
    setArticles(results);
    setCounts(LegalService.getArticleCounts());
  };

  // Trigger search on inputs change
  useEffect(() => {
    fetchFromService();
  }, [searchQuery, selectedCodeId]);

  const handleCopyCitation = (article: LegalArticle) => {
    const citation = `"${article.content}" (${article.codeName}, ${article.articleNumber}, "${article.articleTitle}")`;
    navigator.clipboard.writeText(citation);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleBookmark = (id: string) => {
    const newBookmarks = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter(bId => bId !== id)
      : [...bookmarkedIds, id];
    
    setBookmarkedIds(newBookmarks);
    localStorage.setItem("legal_bookmarks", JSON.stringify(newBookmarks));
  };

  const handleSendToConsultation = (article: LegalArticle) => {
    const promptText = `Ushbu modda bo'yicha maslahat bermoqchiman:\n${article.codeName}ning ${article.articleNumber} - "${article.articleTitle}".\nModda matni:\n"${article.content}"\n\nMenga ushbu moddaning mohiyatini hayotiy misol yoki yuridik nizo nuqtai nazaridan tushuntirib bera olasizmi?`;
    
    localStorage.setItem("prefill_consultation_prompt", promptText);
    navigate("/consultation");
  };

  // Automated Semantic AI Match Checker
  const handleAiLinker = async () => {
    if (!aiScenario.trim()) return;
    setAiLinkerLoading(true);
    setAiLinkerResult(null);

    // Dynamic semantic search from our high-performance local database
    const allArticles = LegalService.getCachedArticles();
    const scenarioNorm = aiScenario.toLowerCase();
    
    const matches = allArticles.filter(article => {
      const isNumMatched = article.articleNumber.toLowerCase().includes(scenarioNorm);
      const isTitleMatched = article.articleTitle.toLowerCase().includes(scenarioNorm);
      const isKeywordMatched = article.keywords && article.keywords.some(keyword => scenarioNorm.includes(keyword.toLowerCase().slice(0, 5)));
      const isContentMatched = article.content.toLowerCase().includes(scenarioNorm);
      const isCodeMatched = article.codeName.toLowerCase().includes(scenarioNorm);
      
      return isNumMatched || isTitleMatched || isKeywordMatched || isContentMatched || isCodeMatched;
    });

    // Take top 3 hits
    const matchedArticles = matches.slice(0, 3);
    
    try {
      let analysisText = "";
      let confidence: "High" | "Medium" | "Low" = matchedArticles.length > 0 ? "Medium" : "Low";
      let matchedKeywords: string[] = [];

      if (matchedArticles.length > 0) {
        // Build prompt for live Gemini analysis
        const prompt = `Siz O'zbekiston Respublikasining professional huquqshunos va yuridik tahlilchisiz.
Quyidagi vaziyat/muammoni milliy qonunchilik asosida tahlil qiling:
Muammo: "${aiScenario}"

Ma'lumotlar bazasidan ushbu vaziyatga mos tushishi mumkin bo'lgan quyidagi moddalar topildi:
${matchedArticles.map((art, idx) => `Modda [${idx+1}]: ${art.codeName}, ${art.articleNumber}. "${art.articleTitle}"\nMatn: ${art.content}`).join("\n\n")}

Irtibotlarni o'rnatgan holda, vaziyat bo'yicha batafsil huquqiy tahlil tayyorlang, ishonchlilik (Confidence Score: High, Medium, Low) darajasini belgilang va bog'liq kalit so'zlarni ajrating.
Quyidagi JSON formatda javob qaytaring. JSONdan boshqa hech qanday izoh va markdown bloklari (\`\`\`json ...) bo'lmasligi kerak:
{
  "analysis": "Vaziyatga moddalarni chuqur bog'lovchi, o'zbek tili latin alifbosida yozilgan professional maslahat matni. Tavsiyalarni a, b, c ko'rinishida bering.",
  "confidence": "High" | "Medium" | "Low",
  "matchedKeywords": ["soliq", "shartnoma", "kod"]
}`;

        const textOutput = await callAIServer({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { temperature: 0.3 }
        });

        try {
          const cleanedText = textOutput.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          const parsed = JSON.parse(cleanedText);
          analysisText = parsed.analysis || parsed.content || "";
          confidence = parsed.confidence || "Medium";
          matchedKeywords = parsed.matchedKeywords || [];
        } catch (err) {
          console.warn("Real AI tahlili JSON formati tahlil etilmadi, matn sifatida qabul qilamiz:", textOutput);
          analysisText = textOutput;
          confidence = matchedArticles.length >= 2 ? "High" : "Medium";
          matchedKeywords = Array.from(new Set(matchedArticles.flatMap(a => a.keywords || []))).slice(0, 4);
        }
      } else {
        // No matches found, let the AI suggest general direction & codes
        const promptNoMatches = `Siz professional yuridik AI maslahatchisiz. Foydalanuvchi quyidagi yuridik holat bo'yicha so'radi:
"${aiScenario}"

Afsuski, ma'lumotlar bazasida bevosita mos keluvchi modda topilmadi.
Ushbu vaziyatni o'rganib chiqib va O'zbekiston milliy qonunchiligiga tayanib:
1. Qaysi kodeks yoki qonunlar (masalan: Fuqarolik kodeksi, Mehnat kodeksi) ushbu holatga daxldor ekanligini ayting.
2. Kelgusi qadam bo'yicha maslahat bering.
Quyidagi JSON formatda javob qaytaring:
{
  "analysis": "Tushunarli va professional yuridik tushuntirish va tavsiyalar.",
  "confidence": "Low",
  "matchedKeywords": ["maslahat", "kodeks", "huquq"]
}`;
        const textOutput = await callAIServer({
          contents: [{ role: 'user', parts: [{ text: promptNoMatches }] }],
          config: { temperature: 0.4 }
        });

        try {
          const cleanedText = textOutput.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          const parsed = JSON.parse(cleanedText);
          analysisText = parsed.analysis || "";
          confidence = "Low";
          matchedKeywords = parsed.matchedKeywords || [];
        } catch {
          analysisText = textOutput;
          confidence = "Low";
          matchedKeywords = ["umumiy", "tavsiya"];
        }
      }

      setAiLinkerResult({
        matchedArticles,
        analysis: analysisText,
        confidence,
        matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : Array.from(new Set(matchedArticles.flatMap(a => a.keywords || []))).slice(0, 4)
      });

    } catch (apiErr: any) {
      console.error("AI Linker live evaluation failed:", apiErr);
      setAiLinkerResult({
        matchedArticles,
        analysis: `Kechirasiz, sun'iy intellekt tahlili serverida vaqtinchalik xatolik yuz berdi (${apiErr.message || "Ulanish xatosi"}), ammo tizim qidiruvi natijasida ${matchedArticles.length} ta daxldor modda aniqlandi. Iltimos quyidagi ro'yxatdan foydalangan holda yuridik kutubxonada ishlarni davom ettiring.`,
        confidence: matchedArticles.length > 0 ? "Medium" : "Low",
        matchedKeywords: Array.from(new Set(matchedArticles.flatMap(a => a.keywords || []))).slice(0, 3)
      });
    } finally {
      setAiLinkerLoading(false);
    }
  };

  // Dataset validation helper
  const validateJsonDataset = (data: any): boolean => {
    if (!Array.isArray(data)) return false;
    for (const item of data) {
      if (
        !item.codeId ||
        !item.codeName ||
        !item.articleNumber ||
        !item.articleTitle ||
        !item.content
      ) {
        return false;
      }
    }
    return true;
  };

  // Import JSON logic (pasted text)
  const handleImportPastedJson = async () => {
    if (!jsonPasteData.trim()) {
      setImportStatus({ type: "error", message: "JSON matn maydoni bo'sh bo'lishi mumkin emas." });
      return;
    }

    setIsImporting(true);
    setImportStatus({ type: null, message: "" });
    try {
      const parsed = JSON.parse(jsonPasteData);
      if (!validateJsonDataset(parsed)) {
        throw new Error("JSON formati noto'g'ri. Har bir ob'ektda codeId, codeName, articleNumber, articleTitle va content bo'lishi shart.");
      }

      const result = await LegalService.importDataset(parsed);
      setImportStatus({
        type: "success",
        message: `Muvaffaqiyatli import qilindi! Jamg'arildi: ${result.count} ta qonun hujjati. Ma'lumotlar bazasi va indekslar yangilandi.`
      });
      setJsonPasteData("");
      fetchFromService();
    } catch (err: any) {
      setImportStatus({
        type: "error",
        message: err.message || "Taqdim etilgan matnni tahlil qilishda xatolik yuz berdi. Iltimos, formati to'g'ri ekanligini tekshiring."
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle uploaded file parse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setImportStatus({ type: "error", message: "Faqat JSON formatidagi fayllar qo'llab-quvvatlanadi." });
      return;
    }

    setImportedFile(file);
    setImportStatus({ type: null, message: "" });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!validateJsonDataset(parsed)) {
          throw new Error("Fayldagi ob'ektlar tarkibi noto'g'ri. Kerakli maydonlar yetishmayapti.");
        }
        setJsonPasteData(JSON.stringify(parsed, null, 2));
        setImportStatus({ type: "success", message: `Fayl muvaffaqiyatli yuklandi: ${parsed.length} ta modda aniqlandi. Quyidagi Import qilish tugmasini bosing.` });
      } catch (err: any) {
        setImportStatus({ type: "error", message: err.message || "Faylni o'qishda xatolik yuz berdi." });
      }
    };
    reader.readAsText(file);
  };

  // Reset database to standard template
  const handleResetToDefault = async () => {
    if (!window.confirm("Barcha moslashtirilgan qonunlarni o'chirib, o'zbekiston standart milliy kodekslari bazasini qaytadan o'rnatmoqchisiz?")) return;
    setIsResetting(true);
    setImportStatus({ type: null, message: "" });
    try {
      await LegalService.resetToDefault();
      setImportStatus({
        type: "success",
        message: "Ma'lumotlar bazasi standart o'zbekiston kodekslari va qoidalariga muvaffaqiyatli qaytarildi!"
      });
      setJsonPasteData("");
      setImportedFile(null);
      fetchFromService();
    } catch (err: any) {
      setImportStatus({ type: "error", message: err.message || "Qayta tiklashda xatolik yuz berdi" });
    } finally {
      setIsResetting(false);
    }
  };

  // Dynamically filters legal codes.
  // DO NOT show codes that do not exist (have 0 articles).
  const visibleCodes = LEGAL_CODES.filter(code => (counts[code.id] || 0) > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header section with refined, modern layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm tracking-wide uppercase mb-1">
            <Scale className="w-4 h-4" />
            Yuridik Kutubxona va Ma'lumotlar Bazasi
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Qonun Hujjatlari Va Moddalar Bazasi</h1>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            Tizimdagi barcha AI xizmatlari (Chat, Hujjat yaratish, Risk tahlili) ushbu rasmiy ma'lumotlar bazasiga tayanadi. Siz ham kerakli moddalarni qidirishingiz, import qilishingiz va xizmat dasturlaringizda qo'llashingiz mumkin.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowImportPanel(!showImportPanel)}
            className={`cursor-pointer inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-xs ${
              showImportPanel 
                ? "bg-slate-900 border-slate-900 text-white" 
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Database className="w-4 h-4 text-blue-500" />
            <span>Baza Boshqaruvi & Import</span>
          </button>
        </div>
      </div>

      {/* Database control dashboard section - Animated panel */}
      <AnimatePresence>
        {showImportPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-slate-50 border border-gray-200/80 rounded-3xl p-6 mb-2 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Yuridik Ma'lumotlarni Import Qilish Tizimi</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Kelajakdagi yuridik ma'lumotlar bazalarini dasturimizga integratsiya qiling.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={isResetting}
                    onClick={handleResetToDefault}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold transition-colors disabled:opacity-55"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                    Asl holatga qaytarish
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Schema Instructions (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-500" />
                      Qanday ishlaydi?
                    </h3>
                    <p className="text-xs/relaxed text-gray-600 font-medium">
                      O'zbekistondagi har qanday kelajakdagi qonun yoki qoidalar kitobini quyidagi JSON sxemasiga moslashtirib bu yerga import qilishingiz mumkin. Tizim avtomatik ravishda Index yaratadi hamda qidiruv xizmatlariga ulaydi.
                    </p>

                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Talab qilinadigan JSON Formati (Array):</span>
                      <pre className="p-3 bg-gray-50 rounded-xl text-[11px] font-mono text-gray-700 border border-gray-200 overflow-x-auto max-h-[160px] leading-relaxed">
{`[
  {
    "codeId": "constitution",
    "codeName": "O'zbekiston Respublikasi Konstitutsiyasi",
    "articleNumber": "1-modda",
    "articleTitle": "Davlat tuzilishi",
    "content": "O'zbekiston — Respublika...",
    "keywords": ["suveren", "demokratik"]
  }
]`}
                      </pre>
                    </div>

                    <div className="p-3.5 bg-blue-50 border border-blue-100/50 rounded-xl text-[11px]/relaxed text-blue-800 font-semibold flex gap-2">
                      <Flame className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      Yangi import siz yuklagan moddalar hisobiga butun ma'lumotlar bazasini yangidan to'ldiradi va eski qo'shimchalarni almashtiradi.
                    </div>
                  </div>
                </div>

                {/* Column 2: File Upload / Paste Area (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">JSON Ma'lumotlarni Yuklash</span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <UploadCloud className="w-4 h-4" />
                        Faylni tanlash (.json)
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".json"
                        className="hidden"
                      />
                    </div>

                    {importedFile && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-800 font-semibold">
                        <span className="truncate">{importedFile.name} ({Math.round(importedFile.size / 1024)} KB)</span>
                        <button 
                          onClick={() => {
                            setImportedFile(null);
                            setJsonPasteData("");
                          }}
                          className="text-red-500 hover:underline font-bold text-[11px]"
                        >
                          Bekor qilish
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">JSON kodini joylashtiring:</span>
                      <textarea
                        value={jsonPasteData}
                        onChange={(e) => setJsonPasteData(e.target.value)}
                        placeholder='Bu yerga JSON hujjatini yozing yoki fayl yuklang...'
                        className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-gray-800 resize-none"
                      />
                    </div>

                    {importStatus.type && (
                      <div className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                        importStatus.type === "success" 
                          ? "bg-emerald-50 border border-emerald-100/55 text-emerald-800" 
                          : "bg-red-50 border border-red-100/55 text-red-800"
                      }`}>
                        {importStatus.type === "success" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <span>{importStatus.message}</span>
                      </div>
                    )}

                    <button
                      onClick={handleImportPastedJson}
                      disabled={isImporting || !jsonPasteData.trim()}
                      className="cursor-pointer w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                          <span>Ma'lumotlar indexlanmoqda va sinxronlanmoqda...</span>
                        </>
                      ) : (
                        <>
                          <FileJson className="w-4 h-4" />
                          <span>Ma'lumotlar Bazasiga Import Qilish</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List with Filters (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Filters and Search Bar Container */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Modda raqami, sarlavha, qonun nomi yoki kalit so'zni yozing..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50/60 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
              />
            </div>

            {/* Horizontally Scrollable Categories Chips */}
            {/* Show article count for each code. Do NOT show articles that do not exist (count > 0 only) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCodeId("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCodeId === "all"
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Barcha qonunlar ({articles.length})
              </button>
              
              {visibleCodes.map((code) => {
                const count = counts[code.id] || 0;
                return (
                  <button
                    key={code.id}
                    onClick={() => setSelectedCodeId(code.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCodeId === code.id
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {code.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matches stats */}
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 px-1">
            <span>Natijalar: {articles.length} ta modda topildi</span>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="text-blue-600 hover:underline"
              >
                Filtrlarni tozalash
              </button>
            )}
          </div>

          {/* List of articles */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-gray-500 font-semibold text-sm">Ma'lumotlar yuklanmoqda...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold text-sm">Hech qanday modda yoki qonun topilmadi</p>
                <p className="text-gray-400 text-xs mt-1">Qidiruv so'zini o'zgartiring yoki bazaga yangi moddalarni import qiling.</p>
              </div>
            ) : (
              articles.map((article) => {
                const isBookmarked = bookmarkedIds.includes(article.id);
                return (
                  <motion.div
                    key={article.id}
                    layoutId={article.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative hover:shadow-md transition-all group"
                  >
                    {/* Tag/Indicator Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-50 uppercase tracking-wide">
                          {article.codeName}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mt-2 flex items-center gap-1.5">
                          <span className="text-blue-600">{article.articleNumber}:</span>
                          {article.articleTitle}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleBookmark(article.id)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            isBookmarked 
                              ? "bg-amber-50 border-amber-200 text-amber-500" 
                              : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                          }`}
                          title={isBookmarked ? "Xatcho'plardan o'chirish" : "Xatcho'plarga qo'shish"}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-500" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Content text */}
                    <p className="text-sm/relaxed text-gray-700 bg-gray-50/50 p-4 rounded-xl border border-gray-100 font-medium">
                      {article.content}
                    </p>

                    {/* Keywords container representing structured tags */}
                    {article.keywords && article.keywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-4">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mr-1">Kalit so'zlar:</span>
                        {article.keywords.map((kw) => (
                          <span 
                            key={kw} 
                            onClick={() => setSearchQuery(kw)}
                            className="px-2 py-0.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-md text-[11px] font-medium text-gray-500 cursor-pointer transition-colors"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Interaction menu */}
                    <div className="flex items-center justify-end gap-3.5 mt-5 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => handleCopyCitation(article)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 px-3 py-2 rounded-lg transition-all cursor-pointer"
                      >
                        {copiedId === article.id ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600">Nusxalandi!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Tsitatadan nusxa olish</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSendToConsultation(article)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-3 py-2 rounded-lg transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Konsultatsiyada qo'llash</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: AI CITATION LINKER & BOOKMARKS (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section 1: AI Legal Linker Helper */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                <HelpCircle className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-indigo-100">AI Huquqiy bog'lovchi</h3>
                <span className="text-[10px] text-indigo-300/80 uppercase font-black tracking-wide">AI expert linker</span>
              </div>
            </div>

            <p className="text-xs/relaxed text-indigo-200 font-medium mb-4">
              Muammo yoki topshiriqni bayon eting (masalan: "firibgarlik", "ma'naviy zarar unidirish", "soliq to'lovi unidirish"), AI avtomatik tarzda to'g'ri keluvchi moddalarni aniqlab, citation hamda maslahat tayyorlaydi.
            </p>

            <div className="space-y-3">
              <textarea
                value={aiScenario}
                onChange={(e) => setAiScenario(e.target.value)}
                placeholder="Vaziyatni tasvirlang..."
                className="w-full h-24 bg-white/10 border border-white/15 focus:border-indigo-400 rounded-xl p-3 text-xs outline-none transition-all text-white placeholder:text-indigo-200/50 resize-none font-medium"
              />
              <button
                onClick={handleAiLinker}
                disabled={aiScenario.trim() === "" || aiLinkerLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-indigo-800/50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {aiLinkerLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                    Tahlil qilinmoqda...
                  </>
                ) : (
                  <>
                    <span>Taqdim etish va Normalash</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Results container with standard animation */}
            <AnimatePresence>
              {aiLinkerResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4 text-xs"
                >
                  {/* Confidence Score Display */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider block">Ishonchlilik darajasi (Confidence):</span>
                    {aiLinkerResult.confidence === "High" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        Yuqori (High)
                      </span>
                    ) : aiLinkerResult.confidence === "Medium" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                        <Info className="w-3 h-3 text-amber-400" />
                        O'rtacha (Medium)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wide">
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        Past (Low)
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-indigo-100 whitespace-pre-wrap leading-relaxed">
                    {aiLinkerResult.analysis}
                  </p>

                  {/* Source Tracking Keywords */}
                  {aiLinkerResult.matchedKeywords && aiLinkerResult.matchedKeywords.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Aniqlangan Kalit So'zlar (Keywords):</span>
                      <div className="flex flex-wrap gap-1">
                        {aiLinkerResult.matchedKeywords.map((kw, i) => (
                          <span 
                            key={i}
                            className="px-1.5 py-0.5 bg-white/10 text-indigo-200 rounded text-[10px] font-mono select-none"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sources List */}
                  {aiLinkerResult.matchedArticles.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Bog'langan Manbalar (Citations):</span>
                      {aiLinkerResult.matchedArticles.map(art => (
                        <div 
                          key={art.id}
                          onClick={() => {
                            setSelectedCodeId(art.codeId);
                            setSearchQuery(art.articleNumber);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left cursor-pointer"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-[10px] font-bold text-indigo-300 block leading-tight">{art.codeName}</span>
                            <span className="text-xs font-bold text-white truncate block">{art.articleNumber}: {art.articleTitle}</span>
                          </div>
                          <ExternalLink className="w-3.2 h-3.2 text-indigo-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 2: Bookmarked Clauses */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm tracking-tight mb-3 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-blue-600 fill-blue-600/25" />
              Siz tanlagan moddalar ({bookmarkedIds.length})
            </h3>
            
            {bookmarkedIds.length === 0 ? (
              <p className="text-xs text-gray-500 font-medium">
                Tezkor foydalanish va hujjat tayyorlashda asqotadigan moddalarni belgilab, o'z kutubxonangizni yarating.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {bookmarkedIds.map((bId) => {
                  const article = articles.find(a => a.id === bId) || LegalService.getCachedArticles().find(a => a.id === bId);
                  if (!article) return null;
                  return (
                    <div 
                      key={article.id}
                      className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 hover:bg-blue-50/20 hover:border-blue-200 transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">{article.codeName}</span>
                        <span className="text-xs font-bold text-gray-800 leading-tight mt-0.5 block">{article.articleNumber}: {article.articleTitle}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => handleCopyCitation(article)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Tsitata"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleBookmark(article.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Xatcho'pdan o'chirish"
                        >
                          <span className="font-bold text-xs">×</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

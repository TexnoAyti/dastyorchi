import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Heart, Sparkles, Star, Clock, FileText, ArrowLeft, Download,
  Eye, CheckCircle2, AlertTriangle, Printer, Loader2, Link, BookOpen,
  Compass, Shield, Scale, ChevronRight, Check, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc } from "firebase/firestore";
import { callAIServer } from "../services/aiService";
import { logActivity } from "../services/activityService";
import { LEGAL_TEMPLATES, LegalTemplate, TemplateField } from "../data/legalTemplates";

export function TemplatesLibrary() {
  const navigate = useNavigate();

  // Navigation / Workspace States
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Barchasi");
  const [sortBy, setSortBy] = useState<"popularity" | "title" | "category">("popularity");

  // Favorites & Recent Templates (Stored in LocalStorage)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<{ id: string; timestamp: number }[]>([]);

  // Workspace Field Inputs State
  const [inputs, setInputs] = useState<Record<string, string>>({});

  // Case Integration States
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [loadingCases, setLoadingCases] = useState(false);

  // AI Operation States
  const [isFilling, setIsFilling] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load favorites & recents on mount
  useEffect(() => {
    const storedFavs = localStorage.getItem("fav_templates");
    if (storedFavs) {
      try {
        setFavorites(JSON.parse(storedFavs));
      } catch (e) {
        console.error(e);
      }
    }

    const storedRecents = localStorage.getItem("recent_templates");
    if (storedRecents) {
      try {
        setRecents(JSON.parse(storedRecents));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch cases for drop-down integration
  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchCasesList = async () => {
      setLoadingCases(true);
      try {
        const q = query(collection(db, "cases"), where("userId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCases(list);
      } catch (err) {
        console.error("Cases loading error in templates library:", err);
      } finally {
        setLoadingCases(false);
      }
    };
    fetchCasesList();
  }, []);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
      triggerToast("Sevimlilardan olindi.", "info");
    } else {
      updated = [...favorites, id];
      triggerToast("Sevimlilarga qo'shildi.", "success");
    }
    setFavorites(updated);
    localStorage.setItem("fav_templates", JSON.stringify(updated));
  };

  const addToRecents = (id: string) => {
    const now = Date.now();
    // filter out existing and prepend
    const filtered = recents.filter(item => item.id !== id);
    const updated = [{ id, timestamp: now }, ...filtered].slice(0, 5); // limit to 5
    setRecents(updated);
    localStorage.setItem("recent_templates", JSON.stringify(updated));
  };

  const handleOpenWorkspace = (template: LegalTemplate) => {
    setSelectedTemplate(template);
    addToRecents(template.id);
    
    // Set initial inputs
    const initialInputs: Record<string, string> = {};
    template.fields.forEach(field => {
      initialInputs[field.id] = "";
    });
    setInputs(initialInputs);
    setReviewResult(null);
    setAiError(null);
    setSelectedCaseId("");
    setIsWorkspaceOpen(true);
  };

  // Filter and sort templates
  const filteredTemplates = LEGAL_TEMPLATES.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      selectedCategory === "Barchasi" ||
      selectedCategory === "Sevimlilar" ||
      item.category === selectedCategory;

    if (selectedCategory === "Sevimlilar") {
      return favorites.includes(item.id) && matchesSearch;
    }

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "popularity") {
      return b.popularity - a.popularity;
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "category") {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });

  const recentTemplatesFull = recents
    .map(r => LEGAL_TEMPLATES.find(l => l.id === r.id))
    .filter((l): l is LegalTemplate => !!l);

  // Generate compiled document text by replacing placeholders
  const getCompiledDocumentText = () => {
    if (!selectedTemplate) return "";
    let compiled = selectedTemplate.textTemplate;
    selectedTemplate.fields.forEach(field => {
      const val = inputs[field.id] || `[${field.id}]`;
      compiled = compiled.replace(new RegExp(`\\[${field.id}\\]`, "g"), val);
    });
    return compiled;
  };

  // AI-Assisted Auto-Fill Action
  const handleAIAutoFill = async () => {
    if (!selectedCaseId) {
      triggerToast("Iltimos, avval integratsiya uchun ishni tanlang.", "info");
      return;
    }
    const targetCase = cases.find(c => c.id === selectedCaseId);
    if (!targetCase) return;

    setIsFilling(true);
    setAiError(null);
    try {
      // 1. Fetch case documents
      let docsText = "";
      try {
        const docsQuery = query(collection(db, "documents"), where("caseId", "==", selectedCaseId));
        const docsSnap = await getDocs(docsQuery);
        const docsList = docsSnap.docs.map(d => d.data());
        if (docsList.length > 0) {
          docsText = docsList.map(d => `Hujjat nomi: ${d.title}\nMutasaddilik matni: ${d.generatedText || d.content || ""}`).join("\n\n");
        }
      } catch (err) {
        console.warn("Could not load attached documents for AI Auto-Fill", err);
      }

      // 2. Fetch case chat activity messages
      let chatText = "";
      try {
        const chatsQuery = query(collection(db, "cases", selectedCaseId, "messages"));
        const chatsSnap = await getDocs(chatsQuery);
        const chatsList = chatsSnap.docs.map(d => d.data());
        if (chatsList.length > 0) {
          chatText = chatsList.map(m => `${m.role === "user" ? "Mijoz" : "Advokat"}: ${m.content}`).join("\n");
        }
      } catch (err) {
        console.warn("Could not load case chat metadata for AI Auto-Fill", err);
      }

      const fieldKeys = selectedTemplate?.fields.map(f => f.id) || [];
      
      const prompt = `Siz O'zbekistondagi malakali yuridik sun'iy intellektsiz. Berilgan ish tafsilotlari, suhbat tarixi va tahliliy materiallar asosida ko'rsatilgan shablon maydonlarini aniqlang va ularni to'ldiring.
Natijani FAQAT toza JSON formatida quyidagi maydon kalitlari bo'yicha qaytaring. Hech qanday qo'shimcha tushuntirish yoki markdown belgilarini qo'shmang (\`\`\`json kabi belgilar bo'lmasligi lozim).

Kerakli maydonlar ro'yxati: ${JSON.stringify(fieldKeys)}

Tanlangan Ish Tafsilotlari:
Nomi: ${targetCase.title}
Kategoriya: ${targetCase.category || "Ma'lum emas"}
Maqomi: ${targetCase.status || "Faol"}
Kuchli tomonlar: ${JSON.stringify(targetCase.strengths || [])}
Kuchsiz tomonlar: ${JSON.stringify(targetCase.weaknesses || [])}
Risk tahlili: ${targetCase.risk || "Mavjud emas"}
Yuridik Strategiya: ${targetCase.strategy || "Mavjud emas"}

Ishga bog'langan suhbatlar:
${chatText || "Suhbatlar tarixi mavjud emas."}

Ishga daxldor hujjatlar mazmuni:
${docsText || "Hujjatlar biriktirilmagan."}

Natijani quyidagi JSON ko'rinishida qaytaring:
{
  "MAYDON_ID1": "To'ldirilgan qiymat matni",
  "MAYDON_ID2": "To'ldirilgan qiymat matni"
}`;

      const aiResponse = await callAIServer({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.2 }
      });

      // Parse JSON from AI
      let cleanText = aiResponse.trim();
      // Remove any json wrapping
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.substring(7);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();

      const extractedData = JSON.parse(cleanText);
      const newInputs = { ...inputs };
      
      selectedTemplate?.fields.forEach(f => {
        if (extractedData[f.id]) {
          newInputs[f.id] = extractedData[f.id];
        } else if (extractedData[f.id.toUpperCase()]) {
          newInputs[f.id] = extractedData[f.id.toUpperCase()];
        } else if (f.id === "DATE") {
          newInputs[f.id] = new Date().toISOString().split("T")[0];
        }
      });

      setInputs(newInputs);
      triggerToast("AI maydonlarni tahlil qildi va avtomatik to'ldirdi!", "success");
      await logActivity(
        "document_create",
        "AI Auto-Fill ishlatildi",
        `"${selectedTemplate?.title}" hujjati uchun AI avto-to'ldirish bajarildi.`
      );
    } catch (err: any) {
      console.error(err);
      setAiError("Maydonlarni avto-to'ldirishda xatolik yuz berdi. Iltimos maydonlarni o'zingiz to'ldirib chiqing.");
      triggerToast("AI to'ldirib berishda xatolik yuz berdi.", "error");
    } finally {
      setIsFilling(false);
    }
  };

  // AI review action
  const handleAIReview = async () => {
    setIsReviewing(true);
    setReviewResult(null);
    setAiError(null);
    try {
      const documentText = getCompiledDocumentText();
      const prompt = `Siz O'zbekiston yuridik protsessual qonunchiligi bo'yicha ekspert-huquqshunossiz. Quyidagi tayyorlangan hujjat loyihasini chuqur tahlil qilib chiqing. Mutaxassis sifatida tekshiring:
1. Maydonlardagi kamchiliklar (Etishmayotgan ma'lumotlar bor yoki yo'qligi)
2. Strukturaviy va mazmuniy qarama-qarshiliklar (Inconsistencies)
3. Grammatik va rasmiy formatlash xatolari

Hujjat matni:
"""
${documentText}
"""

Javobingizni FAQAT va FAQAT quyidagi JSON sxemasida qaytaring. Markdown bloklari yoki tushuntirish matni yozmang.
{
  "hasIssues": boolean,
  "missingInfo": ["kamchilik 1", "kamchilik 2", ...],
  "inconsistencies": ["qarama-qarshilik 1", ...],
  "formatting": ["formatlash muammosi 1", ...],
  "overallScore": number (1-100 gacha audit bahosi),
  "recommendations": "Ushbu hujjatni sudga qabul qilinish imkoniyatini oshirish uchun qisqacha tavsiya va tuzatish bo'yicha maslahatlar matni (Uzbek tilida)."
}`;

      const aiResponse = await callAIServer({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.3 }
      });

      let cleanText = aiResponse.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.substring(7);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();

      const analysisResult = JSON.parse(cleanText);
      setReviewResult(analysisResult);
      triggerToast("Hujjat mudofaa darajasi muvaffaqiyatli baholandi!", "success");
    } catch (err) {
      console.error(err);
      setAiError("Hujjatni auditi paytida xatolik yuz berdi.");
      triggerToast("AI tahlilida xatolik yuz berdi.", "error");
    } finally {
      setIsReviewing(false);
    }
  };

  // DOCX Export Simulator (Pristine layout text format file download)
  const handleExportDOCX = () => {
    try {
      const docText = getCompiledDocumentText();
      const blob = new Blob([docText], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedTemplate?.title.replace(/[\s\(\)]/g, "_")}_Hujjat.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerToast("DOCX formatida yuklab olindi.", "success");
    } catch (err) {
      console.error(err);
      triggerToast("Yuklab olishda xatolik.", "error");
    }
  };

  // PDF / Print Export Handler
  const handleExportPDF = () => {
    window.print();
  };

  // Case Integration: Save and attach compiled document to selected Case in Firestore
  const handleSaveAndAttach = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      if (!auth.currentUser) {
        triggerToast("Hujjatni saqlash uchun avtorizatsiyadan o'ting", "error");
        setIsSaving(false);
        return;
      }

      const documentText = getCompiledDocumentText();
      const docTitle = `${selectedTemplate?.title.split(" (")[0]} - ${inputs["PLAINTIFF_NAME"] || inputs["PARTY_A"] || "Hujjat"}`;

      const newDoc = {
        userId: auth.currentUser.uid,
        caseId: selectedCaseId || null,
        title: docTitle,
        content: documentText,
        language: "uz_lat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        templateId: selectedTemplate?.id || "custom_library_doc"
      };

      await addDoc(collection(db, "documents"), newDoc);
      setSaveSuccess(true);
      triggerToast(selectedCaseId ? "Hujjat saqlandi va ish jildiga avtomat biriktirildi!" : "Hujjat muvaffaqiyatli saqlandi!", "success");
      
      const detailsLog = selectedCaseId 
        ? `"${docTitle}" hujjati tuzildi va tegishli ishga unikal biriktirildi.`
        : `"${docTitle}" mustaqil hujjati Shaxsiy Hujjatlar ro'yxatiga saqlandi.`;
      
      await logActivity("document_create", "Hujjat yaratildi", detailsLog);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Save documents error:", err);
      triggerToast("Saqlashda xatolik yuz berdi", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f8fafc] dark:bg-zinc-950 overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-blue-100/30 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-100/20 blur-[130px] pointer-events-none" />

      {/* Floating System-Wide Alerts (Toast) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[9999] p-4 rounded-2xl shadow-xl flex items-center gap-3 border backdrop-blur-md text-xs font-bold leading-relaxed max-w-sm ${
              toast.type === "success" ? "bg-white dark:bg-zinc-900 border-emerald-100 dark:border-emerald-950/60 text-emerald-800 dark:text-emerald-400 shadow-emerald-500/5 shadow-2xl" :
              toast.type === "error" ? "bg-white dark:bg-zinc-900 border-red-100 dark:border-red-950/60 text-red-800 dark:text-red-400 shadow-red-500/5 shadow-2xl" :
              "bg-white dark:bg-zinc-900 border-blue-100 dark:border-blue-950/60 text-blue-800 dark:text-blue-400 shadow-blue-500/5 shadow-2xl"
            }`}
          >
            <div className={`p-2 rounded-xl ${
              toast.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" :
              toast.type === "error" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400" :
              "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
            }`}>
              {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> :
               toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> :
               <Clock className="w-4 h-4" />}
            </div>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 font-sans print:p-0">
        
        {/* VIEW A: TEMPLATES DIRECTORY GRID */}
        {!isWorkspaceOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-10"
          >
            
            {/* Header Plate */}
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white dark:border-zinc-800/80 p-8 rounded-3xl shadow-[0_10px_45px_-12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100/40 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 select-none">
                  <BookOpen className="w-3.5 h-3.5" /> Professional Kutubxona
                </span>
                <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight sm:text-3xl">
                  Yuridik Andoza & Shablonlar
                </h1>
                <p className="mt-2 text-slate-500 dark:text-zinc-400 max-w-2xl font-normal leading-relaxed text-xs sm:text-sm">
                  Fuqarolik, jinoyat, ma'muriy, mehnat hamda shartnomaviy munosabatlarga oid oliy toifadagi yuridik hujjatlar shablonlari. Maydonlarni sun'iy intellekt orqali dinamik to'ldiring.
                </p>
              </div>

              {/* Statistics badges */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Scale className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 block uppercase">Shablonlar soni</span>
                    <span className="text-sm font-black text-slate-800 dark:text-zinc-200">{LEGAL_TEMPLATES.length} ta andoza</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 block uppercase">AI Auto-Fill</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">Integratsiyalashgan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Templates Row */}
            {recentTemplatesFull.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Clock className="w-4.5 h-4.5 text-slate-400 dark:text-zinc-500" />
                  <h2 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest text-[10px]">Yaqinda ishlatilgan andozalar</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {recentTemplatesFull.map(template => (
                    <div
                      key={`recent-${template.id}`}
                      onClick={() => handleOpenWorkspace(template)}
                      className="bg-white/85 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 p-5 rounded-2xl border border-slate-100/60 dark:border-zinc-800/80 shadow-xs hover:shadow-lg transition-all cursor-pointer group flex items-start gap-4 relative overflow-hidden"
                    >
                      <div className="p-3 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block uppercase tracking-wider mb-1">{template.category}</span>
                        <h3 className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
                          {template.title}
                        </h3>
                        <p className="text-slate-500 dark:text-zinc-400 text-xs line-clamp-1 mt-1 font-normal leading-relaxed">
                          {template.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 self-center shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters and Toolkit Section */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
              
              {/* Category Slider Button Bars */}
              <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
                {["Barchasi", "Civil Law", "Criminal Law", "Administrative Law", "Labour Law", "Contract Law", "Sevimlilar"].map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isActive
                          ? "bg-slate-900 dark:bg-zinc-100 border-slate-900 dark:border-zinc-100 text-white dark:text-zinc-950 shadow-md"
                          : "bg-slate-50 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800"
                      }`}
                    >
                      {cat === "Sevimlilar" && <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? "fill-red-500 text-red-500" : "text-slate-400 dark:text-zinc-500"}`} />}
                      {cat === "Barchasi" && <Compass className="w-3.5 h-3.5" />}
                      {cat === "Civil Law" && <Scale className="w-3.5 h-3.5" />}
                      {cat === "Criminal Law" && <Shield className="w-3.5 h-3.5" />}
                      {cat === "Administrative Law" && <Scale className="w-3.5 h-3.5" />}
                      {cat === "Labour Law" && <BookOpen className="w-3.5 h-3.5" />}
                      {cat === "Contract Law" && <FileText className="w-3.5 h-3.5" />}
                      <span>{cat === "Barchasi" ? "Barchasi" : cat === "Sevimlilar" ? `Sevimlilar (${favorites.length})` : cat}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar Input & Sorting Menu */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Kalit so'z bilan qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-950/60 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium transition-all"
                  />
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-slate-50 dark:bg-zinc-950/60 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-600 dark:text-zinc-300 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="popularity" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Ommaviylik (Popularity)</option>
                  <option value="title" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">A-Z Alifbo bo'yicha</option>
                  <option value="category" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Kategoriya bo'yicha</option>
                </select>
              </div>

            </div>

            {/* Template Cards Layout Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="bg-white/50 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800 p-12 rounded-3xl text-center flex flex-col items-center justify-center max-w-lg mx-auto">
                <div className="p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl mb-4">
                  <Search className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-zinc-200">Ushbu turkumda shablon topilmadi</h3>
                <p className="text-slate-400 dark:text-zinc-400 text-xs mt-2 max-w-sm font-normal leading-relaxed">
                  So'rovga mos keluvchi yuridik andozalar yo'q. Qidiruv so'zini tahrirlab ko'ring yoki boshqa toifani tanlang.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => {
                  const isFav = favorites.includes(template.id);
                  return (
                    <div
                      key={template.id}
                      onClick={() => handleOpenWorkspace(template)}
                      className="group bg-white/75 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-xs hover:shadow-2xl hover:border-blue-200 dark:hover:border-zinc-700 transition-all cursor-pointer p-6 relative flex flex-col justify-between overflow-hidden"
                    >
                      <div className="space-y-4">
                        {/* Card top banner details */}
                        <div className="flex justify-between items-start gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            template.category === "Civil Law" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400" :
                            template.category === "Criminal Law" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400" :
                            template.category === "Administrative Law" ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400" :
                            template.category === "Labour Law" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" :
                            "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                          }`}>
                            {template.category}
                          </span>
                          <button
                            onClick={(e) => toggleFavorite(template.id, e)}
                            className="p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full transition-colors relative z-10 text-slate-400 dark:text-zinc-500 hover:text-red-500"
                            title="Sevimlilarga qo'shish"
                          >
                            <Heart className={`w-4 h-4 transition-transform active:scale-90 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                          </button>
                        </div>

                        {/* Title & info details */}
                        <div>
                          <h3 className="font-extrabold text-slate-800 dark:text-zinc-200 text-sm sm:text-base group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-tight">
                            {template.title}
                          </h3>
                          <p className="mt-2 text-slate-500 dark:text-zinc-400 text-xs font-normal leading-relaxed line-clamp-3">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      {/* Card bottom footer */}
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                          <span>Reyting: {template.popularity}% (Mashhur)</span>
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:translate-x-1.5 transition-transform font-bold text-[10px] uppercase tracking-wider">
                          Andozani tuzish <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </motion.div>
        )}

        {/* VIEW B: ACTIVE WORKSPACE AREA WITH SIDE-BY-SIDE BUILDER */}
        {isWorkspaceOpen && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6 print:space-y-0"
          >
            
            {/* Top Workspace Header Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/80 dark:border-zinc-800/80 shadow-xs print:hidden">
              <button
                onClick={() => setIsWorkspaceOpen(false)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all self-start cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                Andozalar ro'yxatiga qaytish
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={toggleFavorite.bind(null, selectedTemplate.id, undefined)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    favorites.includes(selectedTemplate.id)
                      ? "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400"
                      : "bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400"
                  }`}
                  title="Sevimlilarga qo'shish"
                >
                  <Heart className="w-4.5 h-4.5 fill-current" />
                </button>
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> chop etish / PDF
                </button>
                <button
                  onClick={handleExportDOCX}
                  className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md dark:shadow-none cursor-pointer"
                >
                  <Download className="w-4 h-4" /> DOCX Yuklab olish
                </button>
              </div>
            </div>

            {/* Template brief layout */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden print:hidden">
              <div className="absolute right-[-5%] bottom-[-20%] w-[20vw] h-[20vw] rounded-full bg-white/5 blur-[50px] pointer-events-none" />
              <div className="relative space-y-2 max-w-4xl">
                <div className="flex items-center gap-2">
                  <span className="bg-white/10 px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase">
                    {selectedTemplate.category}
                  </span>
                  <span className="text-white/60 text-[10px] font-medium flex items-center gap-1 font-mono">
                    ID: {selectedTemplate.id}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{selectedTemplate.title}</h2>
                <p className="text-white/80 font-normal leading-relaxed text-xs sm:text-sm">
                  {selectedTemplate.description}
                </p>
              </div>
            </div>

            {/* Two Column Layout workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Column 1: Editable inputs and Case Auto-Fill plate (Col: 5) */}
              <div className="lg:col-span-5 space-y-6 print:hidden">
                
                {/* 1.1 ACTIVE CASE AUTO FILL PANEL */}
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-wider block">Yuridik ish integratsiyasi</span>
                    <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[8px] font-black tracking-wide uppercase">DURABLE</span>
                  </div>
                  <p className="text-slate-500 dark:text-zinc-400 text-[11px] font-normal leading-relaxed">
                    Mavjud yuridik ishni tanlab, uning suhbat xotiralari, yozma dalillar va materiallaridan foydalanib andozani sun'iy intelekt yordamida to'ldiring.
                  </p>
                  
                  {loadingCases ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-zinc-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                      <span>Sizning ishlaringiz yuklanmoqda...</span>
                    </div>
                  ) : cases.length === 0 ? (
                    <div className="text-center bg-slate-50 dark:bg-zinc-800 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                      <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-semibold">Tizimda sizga tegishli faol ishlar topilmadi.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase mb-1">Mavjud ishni tanlang</label>
                        <select
                          value={selectedCaseId}
                          onChange={(e) => setSelectedCaseId(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-950/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 outline-none transition-all cursor-pointer"
                        >
                          <option value="" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Ishni tanlang (Majburiy emas)...</option>
                          {cases.map(c => (
                            <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                              {c.title} ({c.status || "active"})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleAIAutoFill}
                        disabled={isFilling || !selectedCaseId}
                        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-xs font-black rounded-xl text-white transition-all shadow-md ${
                          !selectedCaseId 
                            ? "bg-slate-300 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed shadow-none" 
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-100 dark:shadow-none transform active:scale-98"
                        }`}
                      >
                        {isFilling ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            <span>AI tahlil qilmoqda & to'ldirmoqda...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <span>AI orqali maydonlarni avto-to'ldirish</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* 1.2 EDITABLE FORM FIELDS INPUT */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <h3 className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm uppercase tracking-wider">Hujjat maydonlarini tahrirlash</h3>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{selectedTemplate.fields.length} ta maydon</span>
                  </div>

                  {aiError && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400 font-medium">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>{aiError}</div>
                    </div>
                  )}

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1.5">
                    {selectedTemplate.fields.map(field => (
                      <div key={field.id} className="space-y-1">
                        <label className="block text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-tight">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            placeholder={field.placeholder}
                            value={inputs[field.id] || ""}
                            onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950/60 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs font-semibold transition-all min-h-[80px]"
                          />
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={inputs[field.id] || ""}
                            onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950/60 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs font-semibold transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Attachment action button */}
                  <div className="border-t border-slate-100 dark:border-zinc-800 pt-5 space-y-3">
                    <button
                      onClick={handleSaveAndAttach}
                      disabled={isSaving || saveSuccess}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-black rounded-xl text-white transition-all shadow-md ${
                        saveSuccess 
                          ? "bg-emerald-600 shadow-none"
                          : "bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 shadow-slate-200/50 dark:shadow-none transform active:scale-98"
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          <span>Saqlanmoqda...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Muvaffaqiyatli saqlandi!</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{selectedCaseId ? "Ishga biriktirish & Saqlash" : "Tizimga saqlab qo'yish"}</span>
                        </>
                      )}
                    </button>
                    {selectedCaseId && (
                      <p className="text-[10px] text-center font-bold text-emerald-600 mt-1 uppercase tracking-wider block animate-pulse">
                        Ishga biriktirildi: {cases.find(c => c.id === selectedCaseId)?.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* 1.3 AI CRITICAL REVIEW IN COMPLIANCE WITH USER */}
                <div className="bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-wider block">Hujjat mudofaa darajasi (AI Review)</span>
                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[8px] font-black tracking-wide uppercase">AUDIT</span>
                  </div>
                  <p className="text-slate-500 dark:text-zinc-400 text-[11px] font-normal leading-relaxed">
                    Tizim sun'iy intellekti tuzayotgan hujjat matnini mantiqiy, yuridik xavf-xatarlar va xatolar nuqtai nazaridan tekshiradi.
                  </p>

                  <button
                    onClick={handleAIReview}
                    disabled={isReviewing}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-extrabold rounded-xl bg-white dark:bg-zinc-900 transition-all shadow-sm active:scale-98"
                  >
                    {isReviewing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>AI Ekspertizadan o'tkazmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 shrink-0" />
                        <span>AI Ekspertiza qilish (Review)</span>
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {reviewResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-900 dark:bg-zinc-950 text-white rounded-xl p-4 space-y-3 mt-3 text-xs overflow-hidden shadow-2xl border dark:border-zinc-800"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 dark:border-zinc-800 pb-2">
                          <span className="font-bold text-slate-400 dark:text-zinc-500">Ekspertiza Bahosi:</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                            reviewResult.overallScore >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                            reviewResult.overallScore >= 50 ? "bg-amber-500/20 text-amber-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>{reviewResult.overallScore} / 100 bp</span>
                        </div>

                        {reviewResult.hasIssues ? (
                          <div className="space-y-3.5 mt-2">
                            {reviewResult.missingInfo && reviewResult.missingInfo.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-black text-amber-400 block text-[10px] uppercase tracking-wide">Etishmayotgan ma'lumotlar:</span>
                                <ul className="list-disc pl-4 space-y-1">
                                  {reviewResult.missingInfo.map((item: any, i: number) => (
                                    <li key={i} className="text-slate-300 leading-normal">{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {reviewResult.inconsistencies && reviewResult.inconsistencies.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-black text-rose-400 block text-[10px] uppercase tracking-wide">Mazmuniy xatolar (Inconsistencies):</span>
                                <ul className="list-disc pl-4 space-y-1">
                                  {reviewResult.inconsistencies.map((item: any, i: number) => (
                                    <li key={i} className="text-slate-300 leading-normal">{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {reviewResult.formatting && reviewResult.formatting.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-black text-sky-400 block text-[10px] uppercase tracking-wide">Formatlash muammolari:</span>
                                <ul className="list-disc pl-4 space-y-1">
                                  {reviewResult.formatting.map((item: any, i: number) => (
                                    <li key={i} className="text-slate-300 leading-normal">{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-400 font-bold block pt-1">
                            <Check className="w-4 h-4" />
                            <span>Hujjatda kamchilik yoki ziddiyatlar topilmadi! Mudofaa darajasi a'lo.</span>
                          </div>
                        )}

                        <div className="border-t border-slate-800 dark:border-zinc-800 pt-3 mt-1 text-[11px] font-normal leading-relaxed text-slate-300">
                          <span className="font-bold text-white block mb-1">AI Tavsiyalari:</span>
                          {reviewResult.recommendations}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Column 2: Live HTML / Text preview of Document template (Col: 7) */}
              <div className="lg:col-span-7 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800/80 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 print:hidden">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-black text-slate-800 dark:text-zinc-200 text-sm sm:text-base tracking-tight">Hujjat loyihasining dinamik ko'rinishi</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-lg select-none">KOMPLYANS PREVIEW</span>
                </div>

                {/* Printable and Renderable Page Area */}
                <div className="bg-[#fcfdfd] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-inner font-mono text-[11px] sm:text-xs leading-relaxed text-slate-800 dark:text-zinc-300 whitespace-pre-wrap min-h-[70vh] print:border-none print:p-0 print:m-0 print:bg-white print:text-xs relative overflow-x-auto select-text">
                  
                  {/* Decorative Document Border overlay in edit mode */}
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-100/50 print:hidden" />
                  
                  {/* Actual text compiler preview */}
                  <div className="space-y-4">
                    {/* Render helper that highlight placeholders in yellow or shows filled value */}
                    {(() => {
                      const docText = getCompiledDocumentText();
                      if (!selectedTemplate) return null;
                      
                      // Highlight placeholders dynamically
                      let elements: React.ReactNode[] = [];
                      let currentText = docText;
                      
                      // We search matching field values
                      const pattern = new RegExp(`\\[(.*?)\\]`, "g");
                      let parts = [];
                      let match;
                      let lastIndex = 0;
                      
                      while ((match = pattern.exec(docText)) !== null) {
                        const startIndex = match.index;
                        const matchText = match[0];
                        const placeholderId = match[1];
                        
                        // Push text before match
                        if (startIndex > lastIndex) {
                          parts.push(docText.substring(lastIndex, startIndex));
                        }
                        
                        // Push styled placeholder or values
                        const fieldExists = selectedTemplate.fields.find(f => f.id === placeholderId);
                        if (fieldExists) {
                          const val = inputs[placeholderId];
                          if (val) {
                            parts.push(
                              <span key={`filled-${startIndex}`} className="text-blue-700 dark:text-blue-400 font-bold border-b border-blue-400/40 dark:border-blue-400/20 bg-blue-50/20 dark:bg-blue-950/30 px-1 rounded">
                                {val}
                              </span>
                            );
                          } else {
                            parts.push(
                              <span key={`empty-${startIndex}`} className="bg-yellow-100 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 text-yellow-800 dark:text-yellow-400 font-black px-1.5 py-0.5 rounded text-[10px] mx-1 shrink-0 uppercase tracking-widest inline-block animate-pulse align-middle">
                                [ {fieldExists.label} ]
                              </span>
                            );
                          }
                        } else {
                          parts.push(matchText);
                        }
                        
                        lastIndex = pattern.lastIndex;
                      }
                      
                      if (lastIndex < docText.length) {
                        parts.push(docText.substring(lastIndex));
                      }
                      
                      return parts.length > 0 ? parts : docText;
                    })()}
                  </div>

                </div>

                {/* Print and Export metadata advice in preview */}
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed text-center font-medium print:hidden">
                  * Hujjat maydonlari o'zgartirilganda ushbu ko'rinish real-time rejimida yangilanadi. Hujjatni DOCX ko'rinishida yuklash yoki to'g'ridan-to'g'ri PDF ko'rinishida chop etish mumkin.
                </p>

              </div>

            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}

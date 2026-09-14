import { useState, useEffect } from "react";
import { 
  Plus, Search, FileText, Loader2, Link as LinkIcon, 
  Sparkles, AlertTriangle, Trash2, CheckCircle2, ChevronRight, 
  HelpCircle, Briefcase, Download, ShieldAlert, ArrowLeft, Info, Bookmark, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { ResearchReport, Case } from "../types";
import { 
  generateResearchReport, getUserResearchReports, saveResearchReport, deleteResearchReport, attachReportToCase 
} from "../services/researchService";
import { logActivity } from "../services/activityService";
import { saveAs } from "file-saver";

export function Research() {
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  
  // Active states
  const [activeReport, setActiveReport] = useState<ResearchReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationInput, setGenerationInput] = useState("");
  const [generationFeedback, setGenerationFeedback] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Link case modal / dropdown
  const [linkingCaseId, setLinkingCaseId] = useState<string>("");

  // Predefined prompt helpers for the user to select
  const PREDEFINED_PROMPTS = [
    {
      label: "Xodimni ogohlantirishsiz ishdan bo'shatish",
      text: "Xodim tashkilotda 3 yildan buyon ishlaydi. Ish beruvchi uni ogohlantirishsiz va tovon pulisiz intizomiy jazo bahonasi bilan bo'shatgan. Mehnat kodeksi qanday tartib belgilaydi?"
    },
    {
      label: "Ijarachini uydan muddatidan oldin chiqarish",
      text: "Ijara shartnomasi 1 yilga tuzilgan edi. Uy egasi 4-oyda ijarachiga uyni 3 kunda bo'shatishni talab qilmoqda. Shartnomada bu band ko'rsatilmagan. Ijarachi huquqlari qanday?"
    },
    {
      label: "Soliq idoralari tomonidan solingan jarima",
      text: "Tadbirkorlik subyekti hisobotni texnik nosozlik sababli 1 kunga kechiktirib topshirdi. Soliq idorasi katta miqdorda jarima qo'lladi. Ushbu jarimani kamaytirish yoki bekor qilish yo'li bormi?"
    },
    {
      label: "Shartnoma majburiyatlarini bajarmaslik",
      text: "Yetkazib beruvchi shartnoma bo'yicha tovarlarni 20 kunga kechiktirib olib keldi, natijada xaridor katta zarar ko'rdi. Shartnomada penya va zararni qoplash bo'yicha qanday choralar ko'rish mumkin?"
    }
  ];

  // Show toast notification helper
  const showToastMsg = (msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Sync User's Research Reports from Firestore
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "research_reports"),
      where("userId", "==", uid)
    );

    console.log("[Firestore] listener attached: Research Reports");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ResearchReport[];
      // Sort in-memory desc by createdAt
      items.sort((a, b) => b.createdAt - a.createdAt);
      setReports(items);
      setLoadingReports(false);

      // If active report is open, keep syncing its elements
      if (activeReport) {
        const updatedActive = items.find(r => r.id === activeReport.id);
        if (updatedActive) {
          setActiveReport(updatedActive);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "research_reports");
      setLoadingReports(false);
    });

    return () => {
      unsubscribe();
      console.log("[Firestore] listener detached: Research Reports");
    };
  }, [activeReport?.id, auth.currentUser?.uid]);

  // 2. Fetch User's Cases to establish Linking integration
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "cases"),
      where("userId", "==", uid)
    );

    console.log("[Firestore] listener attached: Research Cases");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Case[];
      setCases(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "cases");
    });

    return () => {
      unsubscribe();
      console.log("[Firestore] listener detached: Research Cases");
    };
  }, [auth.currentUser?.uid]);

  // Filter compiled list
  const filteredReports = reports.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.question.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      (r.category && r.category.toLowerCase().includes(q))
    );
  });

  // Handle generating new report
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generationInput.trim() || isGenerating) return;

    const queryText = generationInput.trim();
    setIsGenerating(true);
    setGenerationFeedback("Muhokama tahlil qilinmoqda...");

    try {
      setGenerationFeedback("Sun'iy intellekt qonunlarni o'rganmoqda...");
      const resultData = await generateResearchReport(queryText, (msg) => {
        setGenerationFeedback(msg);
      });

      setGenerationFeedback("Hisobot ma'lumotlar bazasiga saqlanmoqda...");
      
      const newReportId = await saveResearchReport({
        question: queryText,
        ...resultData
      });

      // Log action activity
      await logActivity(
        "research_generate",
        "Yuridik tadqiqot o'tkazildi",
        `"${queryText.slice(0, 40)}..." mavzusida yangi yuridik tadqiqot raporti shakllantirildi.`,
        null,
        "Yuridik tadqiqot"
      );

      setGenerationInput("");
      const savedDoc = reports.find(r => r.id === newReportId);
      if (savedDoc) {
        setActiveReport(savedDoc);
      } else {
        // Fallback
        const fullDocList = await getUserResearchReports();
        const created = fullDocList.find(d => d.id === newReportId);
        if (created) setActiveReport(created);
      }

      showToastMsg("Yangi yuridik tadqiqot hisoboti muvaffaqiyatli tayyorlandi!");
    } catch (error: any) {
      console.error(error);
      showToastMsg(error.message || "Tadqiqot o'tkazishda xatolik yuz berdi.", "error");
    } finally {
      setIsGenerating(false);
      setGenerationFeedback("");
    }
  };

  // Delete research report
  const handleDeleteReport = async (id: string, name: string) => {
    if (!window.confirm("Rostdan ham ushbu tadqiqot hisobotini arxivdan butunlay o'chirib tashlamoqchimisiz?")) return;
    try {
      await deleteResearchReport(id);
      if (activeReport?.id === id) {
        setActiveReport(null);
      }
      showToastMsg("Tadqiqot unutilib, muvaffaqiyatli o'chirildi.");
      await logActivity(
        "research_delete",
        "Tadqiqot o'chirildi",
        `"${name.slice(0, 40)}..." yuridik tadqiqot hisoboti tizimdan o'chirildi.`,
        null,
        "Yuridik tadqiqot"
      );
    } catch (err) {
      showToastMsg("O'chirishda xatolik ro'y berdi.", "error");
    }
  };

  // Link cases updater
  const handleLinkToCase = async (caseId: string) => {
    if (!activeReport) return;
    try {
      const selectedCase = cases.find(c => c.id === caseId);
      await attachReportToCase(activeReport.id, caseId || null);
      setLinkingCaseId("");
      showToastMsg(caseId ? `Hisobot "${selectedCase?.title || 'Ish'}" portfeliga bog'landi!` : "Hisobot ish jildidan ajratildi.");
      
      await logActivity(
        "research_link",
        caseId ? "Tadqiqot ishga biriktirildi" : "Tadqiqot ishdan ajratildi",
        caseId 
          ? `"${activeReport.question.slice(0, 30)}..." mavzusidagi tadqiqot "${selectedCase?.title}" ishiga muvaffaqiyatli bog'landi.`
          : `Tadqiqot ish portfeli bog'lamidan chiqarildi.`,
        caseId || null,
        selectedCase?.title || "Yuridik tadqiqot"
      );
    } catch (err) {
      showToastMsg("Bog'lashda muammo yuz berdi", "error");
    }
  };

  const CATEGORY_LABELS: Record<string, { label: string; color: string; border: string }> = {
    civil: { label: "Fuqarolik huquqi", color: "bg-blue-50 text-blue-700", border: "border-blue-200" },
    criminal: { label: "Jinoyat huquqi", color: "bg-red-50 text-red-700", border: "border-red-200" },
    administrative: { label: "Ma'muriy huquq", color: "bg-amber-50 text-amber-700", border: "border-amber-200" },
    labour: { label: "Mehnat huquqi", color: "bg-emerald-50 text-emerald-700", border: "border-emerald-200" },
    contract: { label: "Shartnomalar huquqi", color: "bg-indigo-50 text-indigo-700", border: "border-indigo-200" },
    family: { label: "Oila huquqi", color: "bg-pink-50 text-pink-700", border: "border-pink-200" },
    tax: { label: "Soliq huquqi", color: "bg-cyan-50 text-cyan-700", border: "border-cyan-200" }
  };

  const getCategoryTheme = (cat: string) => {
    return CATEGORY_LABELS[cat?.toLowerCase()] || { label: cat || "Umumiy", color: "bg-slate-100 text-slate-700", border: "border-slate-300" };
  };

  // HTML Formatter for exports
  const generateReportHtml = (rep: ResearchReport) => {
    const catLabel = getCategoryTheme(rep.category).label;
    
    const buildListItems = (arr: string[]) => {
      if (!arr || arr.length === 0) return "<li>Ma'lumotlar mavjud emas</li>";
      return arr.map(item => `<li>${item}</li>`).join("");
    };

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1e3a8a; margin: 0 0 10px 0; font-size: 24px;">YURIDIK TADQIQOT VA STRATEGIK HISOBOT</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Yozilgan vaqt: ${new Date(rep.createdAt).toLocaleString()} | Kategoriya: ${catLabel}</p>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; border-left: 4px solid #3b82f6; background-color: #f8fafc;">
          <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">TADQIQOT SAVOLI / HUQUQIY MUAMMO</h3>
          <p style="margin: 0; font-style: italic; font-size: 14px;">"${rep.question}"</p>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; font-size: 16px;">I. HUQUQIY TAHLIL VA MAZMUN (SUMMARY)</h3>
          <p style="font-size: 14px; text-align: justify;">${rep.summary}</p>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; font-size: 16px;">II. ASOSIY HUQUQIY SAVOLLAR ADLIYASI</h3>
          <ul style="font-size: 14px; padding-left: 20px;">
            ${buildListItems(rep.legalQuestions)}
          </ul>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; font-size: 16px;">III. QO'LLANILUVCHI QONUNCHILIK PRINSIPLARI VA MODDALAR</h3>
          <ul style="font-size: 14px; padding-left: 20px;">
            ${buildListItems(rep.principles)}
          </ul>
        </div>

        <div style="margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px;">
            <h4 style="color: #166534; margin-top: 0; font-size: 14px;">TARAFTOR ARGUMENTLAR TIMSOLIDA</h4>
            <ul style="font-size: 12px; padding-left: 15px; margin: 0;">
              ${buildListItems(rep.supportingArguments)}
            </ul>
          </div>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px;">
            <h4 style="color: #991b1b; margin-top: 0; font-size: 14px;">RAQIB TARAFI RADDIYALARI</h4>
            <ul style="font-size: 12px; padding-left: 15px; margin: 0;">
              ${buildListItems(rep.opposingArguments)}
            </ul>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; font-size: 16px;">IV. XAVF-XATARLAR MUTAHASSISLIGI DESKRIPSIYASI</h3>
          <p style="font-weight: bold; font-size: 14px; color: ${rep.riskLevel === 'High' ? '#ef4444' : rep.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'}">Xavf darajasi: ${rep.riskLevel || 'Medium'}</p>
          <p style="font-size: 14px; margin-top: 5px;">${rep.riskAnalysis}</p>
          <ul style="font-size: 12px; padding-left: 20px;">
            ${buildListItems(rep.risks)}
          </ul>
        </div>

        <div style="margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
          <h3 style="color: #1e40af; margin-top: 0; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">V. TAVSIYA ETILADIGAN DALILLAR PAKETI</h3>
          <p style="font-weight: bold; font-size: 13px; margin: 10px 0 5px 0;">Soddalashtirilgan majburiy hujjatlar:</p>
          <ul style="font-size: 12px; padding-left: 20px; margin-bottom: 10px;">
            ${buildListItems(rep.requiredDocuments)}
          </ul>
          <p style="font-weight: bold; font-size: 13px; margin: 10px 0 5px 0;">Yetishmayotgan (muzokarada yoki sudda talab qilinishi lozim bo'lgan) dalillar:</p>
          <ul style="font-size: 12px; padding-left: 20px; margin-bottom: 10px;">
            ${buildListItems(rep.missingEvidence)}
          </ul>
          <p style="font-weight: bold; font-size: 13px; margin: 10px 0 5px 0;">Yordamchi daliliy asoslar materiallari:</p>
          <ul style="font-size: 12px; padding-left: 20px; margin: 0;">
            ${buildListItems(rep.supportingMaterials)}
          </ul>
        </div>

        <div style="margin-bottom: 25px; background-color: #eff6ff; border-radius: 8px; padding: 15px; border: 1px solid #bfdbfe;">
          <h3 style="color: #1e40af; margin-top: 0; font-size: 15px; border-bottom: 1px solid #bfdbfe; padding-bottom: 5px;">VI. TAVSIYA ETILGAN ISH HAQQIDA SUD STRATEGIYASI REJASI</h3>
          <ol style="font-size: 13px; padding-left: 20px; margin-bottom: 10px;">
            ${buildListItems(rep.strategyActions)}
          </ol>
          <p style="font-style: italic; font-size: 13px; color: #1e40af; margin: 10px 0 0 0;"><strong>Ekspert maslahati:</strong> ${rep.expertiseTip}</p>
        </div>

        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; color: #94a3b8;">
          <p>Ushbu hisobot Dastyorchi.uz sun'iy intellekti tomonidan qonun qoidalari doirasida taqdim etildi va rasmiy yakuniy yuridik maslahat bo'lib xizmat qilmaydi.</p>
        </div>
      </div>
    `;
  };

  // DOCX Export Proxy Handler
  const handleExportDocx = async (rep: ResearchReport) => {
    try {
      const htmlText = generateReportHtml(rep);
      const response = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlText })
      });

      if (!response.ok) {
        throw new Error("DOCX server eksportida xato.");
      }

      const blob = await response.blob();
      saveAs(blob, `Tadqiqot_Hisoboti_${rep.id.slice(0,6)}.docx`);
      showToastMsg("Hujjat DOCX variantida muvaffaqiyatli yuklab olindi.");

      await logActivity(
        "document_export",
        "Tadqiqot eksport qilindi (DOCX)",
        `"${rep.question.slice(0, 30)}..." mavzusidagi yuridik tadqiqot hisoboti DOCX formatida yuklab olindi.`,
        rep.caseId || null,
        "Yuridik tadqiqot"
      );
    } catch (err: any) {
      showToastMsg("Eksport qilishda xatolik: " + err.message, "error");
    }
  };

  // Clean print format
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="flex-grow flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-zinc-950 overflow-hidden leading-normal">
      
      {/* Dynamic Toast feedback */}
      {toast && (
        <div className="fixed top-20 right-6 z-[120] bg-slate-900 border border-slate-800 text-white font-medium text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade-in print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. LEFT COLUMN: SAVED REPORTS WORKSPACE */}
      <div className={`w-full lg:w-80 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-col shrink-0 lg:flex ${activeReport ? "hidden" : "flex"} print:hidden`}>
        
        {/* Workspace Toolbar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-4.5 h-4.5 text-blue-600" />
              Tadqiqotlar Portfeli ({reports.length})
            </h2>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Savol yoki kategoriya bo'yicha qidiruv..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
            />
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* List of saved reports */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin">
          {loadingReports ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : filteredReports.length > 0 ? (
            filteredReports.map((reportItem) => {
              const isSelected = activeReport?.id === reportItem.id;
              const catTheme = getCategoryTheme(reportItem.category);
              const relatedCase = cases.find(c => c.id === reportItem.caseId);

              return (
                <div
                  key={reportItem.id}
                  onClick={() => setActiveReport(reportItem)}
                  className={`w-full p-4 rounded-2xl text-left border transition-all cursor-pointer select-none relative ${
                    isSelected
                      ? "bg-slate-950 text-white border-slate-950 shadow-md dark:bg-zinc-800 dark:border-zinc-700"
                      : "bg-white hover:bg-slate-50 border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isSelected ? "bg-white/15 text-white" : catTheme.color
                    }`}>
                      {catTheme.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReport(reportItem.id, reportItem.question);
                      }}
                      className={`p-1 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors ${
                        isSelected ? "text-slate-400 hover:bg-white/10" : "text-slate-300 dark:text-zinc-500"
                      }`}
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-extrabold text-[12.5px] tracking-tight leading-snug line-clamp-2 text-slate-800 dark:text-zinc-100">
                    {reportItem.question}
                  </h3>

                  <p className={`text-[10px] mt-2 font-medium truncate ${isSelected ? "text-slate-400" : "text-slate-400 dark:text-zinc-500"}`}>
                    📅 {new Date(reportItem.createdAt).toLocaleDateString()}
                  </p>

                  {relatedCase && (
                    <div className={`mt-2 p-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold ${
                      isSelected ? "bg-white/5 text-slate-300" : "bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-zinc-700"
                    }`}>
                      <Briefcase className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">Bog'langan ish: {relatedCase.title}</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-slate-400 select-none">
              <FileText className="w-8 h-8 mx-auto text-slate-200 dark:text-zinc-700 mb-2" />
              <p className="text-xs">Sizda hali saqlangan tadqiqot raportlari mavjud emas.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE / CHAT GENERATOR OR RESULTS VIEW */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#fafafa] dark:bg-zinc-950">
        
        {/* Toggle between Active report views or empty input generator */}
        <AnimatePresence mode="wait">
          {!activeReport ? (
            
            // NO ACTIVE REPORT DEFAULT: NEW RESEARCH GENERATOR
            <motion.div
              key="generator-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-grow flex flex-col overflow-y-auto p-6 md:p-12 max-w-4xl select-text mx-auto w-full scrollbar-thin print:hidden"
            >
              
              {/* BRAND HEADER BANNER */}
              <div className="text-center max-w-2xl mx-auto space-y-4 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-full text-blue-700 dark:text-blue-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  SISTEMALI YURIDIK TADQIQOTLAR
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight leading-tight">
                  Aqlli Yuridik Tadqiqot Tizimi
                </h1>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Sud ishlari, yuridik savollar, ziddiyatlar yoki kodekslar bo'yicha har qanday murakkab huquqiy muammoni yozing. Sun'iy intellekt qonunlarni o'rganib chiqib, yuridik tahlil va harakatlar rejasini taqdim etadi.
                </p>
              </div>

              {/* GENERATION BOX */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs max-w-3xl mx-auto w-full mb-8">
                <form onSubmit={handleGenerateReport} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Huquqiy muammo yoki savolni batafsil kiriting:
                    </label>
                    <textarea
                      value={generationInput}
                      onChange={(e) => setGenerationInput(e.target.value)}
                      placeholder="Masalan: Ish beruvchi xodimni hech qanday tushuntirish xati olmasdan va mehnat shartnomasida ko'rsatilgan tartiblarni buzib, intizomiy jazo bahonasida tushdan keyin bo'shatib yubordi..."
                      className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700/80 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500/30 focus:outline-none resize-none leading-relaxed"
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                      Uzbekistan yuridik adliyasi doirasida eng to'g'ri tahlil algoritmi
                    </span>

                    <button
                      type="submit"
                      disabled={!generationInput.trim() || isGenerating}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 select-none shadow-xs"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Tadqiq qilinmoqda...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Tadqiqotni boshlash</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Loading state diagnostic info feedback */}
                {isGenerating && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100/50 dark:border-blue-900/40 flex items-center gap-2.5 text-xs text-blue-600 dark:text-blue-400 font-medium"
                  >
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-500" />
                    <span>{generationFeedback}</span>
                  </motion.div>
                )}
              </div>

              {/* PREDEFINED HIGHLIGHT HELPERS */}
              <div className="max-w-3xl mx-auto w-full">
                <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3.5 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  Mavzular bular kabi bo'lishi mumkin:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PREDEFINED_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setGenerationInput(prompt.text)}
                      className="p-4 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-2xl text-left transition-all hover:border-blue-200 group text-xs flex flex-col justify-between"
                    >
                      <span className="font-extrabold text-slate-900 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                        {prompt.label}
                      </span>
                      <p className="text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed text-[11px]">
                        {prompt.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>

          ) : (
            
            // ACTIVE REPORT DETAIL VIEW CARD
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-grow flex flex-col overflow-hidden bg-white dark:bg-zinc-900"
            >
              
              {/* 2A. DOSSIER ACTIONS BAR */}
              <div className="px-6 py-4.5 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 shadow-xs print:hidden">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveReport(null)}
                    className="p-1 px-2.5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-600 dark:text-zinc-300 transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Asosiy sahifa
                  </button>

                  <div>
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                      Yuridik Tadqiqot kabineti
                    </span>
                    <h2 className="text-sm font-black text-slate-900 dark:text-zinc-50 leading-none truncate max-w-sm">
                      {CATEGORY_LABELS[activeReport.category]?.label || activeReport.category} tadqiqoti
                    </h2>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2.5 select-none">
                  
                  {/* Case Link dropdown integration */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-1.5 rounded-xl">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pr-1">Ish biriktiruvi:</span>
                    <select
                      value={activeReport.caseId || ""}
                      onChange={(e) => handleLinkToCase(e.target.value)}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="">-- Ish tanlash (Biriktirilmagan) --</option>
                      {cases.map((c) => (
                        <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900">
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Export and action triggers */}
                  <button
                    onClick={() => handleExportDocx(activeReport)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 flex items-center gap-1.5 transition-all shadow-xs"
                    title="MS Word formatda hisobotni yuklab olish"
                  >
                    <Download className="w-3.5 h-3.5" />
                    DOCX yuklash
                  </button>

                  <button
                    onClick={handlePrintPdf}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                    title="PDF yuklab olish yoki Chop etish"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    PDF / Chop etish
                  </button>

                  <button
                    onClick={() => handleDeleteReport(activeReport.id, activeReport.question)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                    title="Hisobotni o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>

              {/* 2B. REPORT RENDER SPACE */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/30 scrollbar-thin print:bg-white print:p-0 print:overflow-visible">
                
                {/* Print Banner (Only visible during print) */}
                <div className="hidden print:block text-center border-b-2 border-blue-600 pb-4 mb-6">
                  <h1 className="text-2xl font-black text-slate-950 uppercase">YURIDIK TADQIQOT VA STRATEGIK HISOBOT</h1>
                  <p className="text-xs text-slate-500 mt-1">Dastyorchi.uz Huquqiy Tahlillar Kabineti</p>
                </div>

                {/* THE CORE QUESTION SECTION */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs relative">
                  <div className="absolute top-4 right-4 text-[9px] font-bold text-slate-400 dark:text-zinc-500 tracking-wider hidden md:block select-none">
                    TADQIQ ETILAYOTGAN YO'LLANMA
                  </div>
                  <h4 className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-1 select-none">Tahlil ostidagi muammo:</h4>
                  <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100 italic leading-relaxed">
                    "{activeReport.question}"
                  </p>
                </div>

                {/* BENTO-GRID FOR THE REPORT CONSTITUENTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LEFT WING: EXECUTIVE SUMMARY & LEGAL QUESTIONS */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* SUMMARY SECTION */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-3">
                      <h3 className="text-xs font-black text-slate-900 dark:text-zinc-50 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2.5 select-none">
                        <FileText className="w-4 h-4 text-blue-500" />
                        I. Huquqiy hisob tahlili (Executive Summary)
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed text-justify">
                        {activeReport.summary}
                      </p>
                    </div>

                    {/* KEY LEGAL QUESTIONS */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-3">
                      <h3 className="text-xs font-black text-slate-900 dark:text-zinc-50 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2.5 select-none">
                        <HelpCircle className="w-4 h-4 text-indigo-500 blue-500" />
                        II. Protsessual va moddiy yuridik savollar
                      </h3>
                      <div className="space-y-2.5">
                        {activeReport.legalQuestions?.map((q, i) => (
                          <div key={i} className="flex gap-2.5 items-start">
                            <span className="p-1 px-1.5 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg scale-90 select-none">
                              {i+1}
                            </span>
                            <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold leading-relaxed">
                              {q}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* APPLICABLE LAWS / CONSTITUTION ARTICLES */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-3">
                      <h3 className="text-xs font-black text-slate-900 dark:text-zinc-50 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2.5 select-none">
                        <Bookmark className="w-4 h-4 text-slate-900 dark:text-zinc-400" />
                        III. Qo'llaniluvchi Qonunchilik normalari va moddalari (Citations)
                      </h3>
                      <div className="space-y-3">
                        {activeReport.principles?.map((p, i) => (
                          <div key={i} className="flex gap-2 items-start border-l-3 border-blue-500 dark:border-blue-500 pl-3.5 py-1 bg-slate-50 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-800 rounded-r-xl">
                            <div>
                              <p className="text-xs text-slate-700 dark:text-zinc-200 font-bold leading-relaxed">
                                {p}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* STRATEGIC SPLIT ARGUMENTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                      
                      {/* SUPPORTING ADVOCATES ARGUMENTS */}
                      <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-950/50 rounded-2xl p-5 shadow-xs bg-linear-to-b from-emerald-50/20 dark:from-emerald-950/10 to-white dark:to-zinc-900">
                        <h4 className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-widest flex items-center gap-1 mb-3.5 select-none">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Mijoz pozitsiyasi (Kuchli asoslar)
                        </h4>
                        <ul className="space-y-2.5">
                          {activeReport.supportingArguments?.map((arg, i) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2">
                              <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                              <span>{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* OPPOSING PARTIES COUNTERARGUMENTS */}
                      <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-950/50 rounded-2xl p-5 shadow-xs bg-linear-to-b from-rose-50/20 dark:from-rose-950/10 to-white dark:to-zinc-900">
                        <h4 className="text-[10px] font-bold uppercase text-red-700 dark:text-red-400 tracking-widest flex items-center gap-1 mb-3.5 select-none">
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                          Qarshi taraf vajlari (Ehtimoliy qarshiliklar)
                        </h4>
                        <ul className="space-y-2.5">
                          {activeReport.opposingArguments?.map((arg, i) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2">
                              <ChevronRight className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                              <span>{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                  </div>

                  {/* RIGHT WING: RISK ASSESSMENT, EVIDENCE ADVICE, EXPERTISE */}
                  <div className="space-y-6">
                    
                    {/* RISK ANALYSIS BLOCK */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 select-none">
                        <h3 className="text-xs font-black text-slate-900 dark:text-zinc-50 uppercase tracking-widest flex items-center gap-1.5">
                          <AlertTriangle className="w-4.5 h-4.5 text-yellow-500" />
                          Xavf darajasi tahlili
                        </h3>
                        <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-lg ${
                          activeReport.riskLevel === 'High' ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' :
                          activeReport.riskLevel === 'Medium' ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
                          'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {activeReport.riskLevel || 'Medium'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                        {activeReport.riskAnalysis}
                      </p>

                      <ul className="space-y-2 border-t border-slate-100/70 dark:border-zinc-800 pt-3.5">
                        {activeReport.risks?.map((risk, i) => (
                          <li key={i} className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* EVIDENCE RECC BLOCK */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                      
                      <div className="border-b border-slate-100 dark:border-zinc-800 pb-3 select-none">
                        <h3 className="text-xs font-black text-slate-900 dark:text-zinc-50 uppercase tracking-widest flex items-center gap-1.5">
                          <Plus className="w-4.5 h-4.5 text-indigo-500" />
                          Tavsiya etilgan dalillar
                        </h3>
                      </div>

                      {/* Required documents */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Shart hujjatlar ro'yxati:</h4>
                        <ul className="space-y-2 bg-slate-50 dark:bg-zinc-950/30 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl">
                          {activeReport.requiredDocuments?.map((doc, i) => (
                            <li key={i} className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-600">●</span>
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Missing evidence */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Yetishmayotgan materiallar:</h4>
                        <ul className="space-y-2 bg-red-10/40 dark:bg-red-950/20 border border-red-50 dark:border-rose-900/30 p-3 rounded-xl">
                          {activeReport.missingEvidence?.map((doc, i) => (
                            <li key={i} className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-[9px] font-bold text-red-400">●</span>
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Supporting accessories */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] tracking-wider font-extrabold text-[10px] text-blue-600 dark:text-blue-400">Yordamchi ilovalar:</h4>
                        <ul className="space-y-2 bg-indigo-10/10 dark:bg-indigo-950/20 border border-indigo-40/30 dark:border-indigo-900/30 p-3 rounded-xl">
                          {activeReport.supportingMaterials?.map((doc, i) => (
                            <li key={i} className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-[9px] font-bold text-indigo-400">●</span>
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    {/* CASE STRATEGY CHECKLIST & CLINICAL EXPERTISE */}
                    <div className="bg-linear-to-b from-blue-900 to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
                      <div className="border-b border-white/10 pb-3">
                        <h3 className="text-xs font-black uppercase text-blue-200 tracking-widest flex items-center gap-1.5">
                          <Sparkles className="w-4.5 h-4.5 text-blue-400" />
                          Yuridik harakatlar strategiyasi
                        </h3>
                      </div>

                      {/* Strategy actions */}
                      <div className="space-y-2">
                        {activeReport.strategyActions?.map((act, i) => (
                          <div key={i} className="flex gap-2 items-start py-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-200 font-semibold leading-relaxed">
                              {act}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-start gap-2.5">
                        <Info className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Mutaxassis tavsiyasi:</h5>
                          <p className="text-[11px] text-slate-300 italic leading-relaxed mt-0.5">
                            {activeReport.expertiseTip}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* DISCLAIMER INFO BOX */}
                <div className="p-4 bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-start gap-3 print:hidden select-none">
                  <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black text-slate-800 dark:text-zinc-200">Rad etish kafolati (Disclaimer):</h5>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mt-0.5">
                      Ushbu ko'rsatkich va tadqiqot yuridik kodeks qoidalari, moddalariga tayanib sun'iy intellekt tomonidan tahliliy hisoblangan bo'lib, rasmiy yakuniy yuridik maslahat yoki sud organi da'vono'masi o'rnini bosa olmaydi. Advokat konsultatsiyasi bilan tasdiqlash tavsiya etiladi.
                    </p>
                  </div>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}

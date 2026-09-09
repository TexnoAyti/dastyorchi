import { useState, useEffect } from "react";
import { 
  Plus, Briefcase, Clock, Search, FileText, Loader2, Link as LinkIcon, 
  Paperclip, Send, Sparkles, TrendingUp, AlertTriangle, Trash2, 
  CheckCircle2, ArrowLeft, FileMinus, ClipboardList, Layers, 
  ShieldAlert, FileCheck, FileUp, Calendar, Info, FileEdit, Download, CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../firebase";
import { 
  collection, query, where, onSnapshot, addDoc, doc, 
  updateDoc, deleteDoc, orderBy
} from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { Case, Evidence, Deadline, ResearchReport } from "../types";
import { uploadEvidence } from "../services/storageService";
import { chatWithLawyer, callAIServer } from "../services/aiService";
import { TemplateSelector } from "../components/TemplateSelector";
import { Link } from "react-router-dom";
import { logActivity } from "../services/activityService";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { EvidenceAnalyzer } from "../components/EvidenceAnalyzer";
import { generateResearchReport, saveResearchReport, deleteResearchReport } from "../services/researchService";
import { errorLogger } from "../services/errorLoggingService";
import { getFriendlyErrorMessage } from "../utils/errorFriendly";

export function Cases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "chat" | "documents" | "deadlines" | "notes" | "history" | "evidence_analyzer" | "research">("analysis");

  // Case Research state
  const [caseReports, setCaseReports] = useState<ResearchReport[]>([]);
  const [loadingCaseReports, setLoadingCaseReports] = useState(false);
  const [caseResearchInput, setCaseResearchInput] = useState("");
  const [generatingCaseResearch, setGeneratingCaseResearch] = useState(false);
  const [caseResearchFeedback, setCaseResearchFeedback] = useState("");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Notes state
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Case activities state
  const [caseActivities, setCaseActivities] = useState<any[]>([]);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New case form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    region: "",
    courtType: ""
  });

  // Task & Deadline Form States
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineType, setDeadlineType] = useState<"hearing" | "appeal" | "submission" | "custom">("custom");

  // Evidence upload form States
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceCategory, setEvidenceCategory] = useState<"contract" | "receipt" | "photo" | "other">("other");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Selector for drafting new documents in Case Workspace
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);

  // Global documents matching state
  const [allUserDocs, setAllUserDocs] = useState<any[]>([]);
  
  // Real-time chat messages matching active case
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [aiResponding, setAiResponding] = useState(false);
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);

  // Active Case Reference object
  const activeCase = cases.find(c => c.id === activeCaseId) || null;

  // Show Toast helper
  const showToastMsg = (msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch Legal Cases for Active User
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "cases"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Case[];
      
      // Sort in-memory by updatedAt descending
      docs.sort((a, b) => b.updatedAt - a.updatedAt);
      setCases(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "cases");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1b. Sync Research Reports linked to Active Case
  useEffect(() => {
    if (!activeCaseId || !auth.currentUser) {
      setCaseReports([]);
      return;
    }

    setLoadingCaseReports(true);
    const qReport = query(
      collection(db, "research_reports"),
      where("userId", "==", auth.currentUser.uid),
      where("caseId", "==", activeCaseId)
    );

    const unsubscribe = onSnapshot(qReport, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ResearchReport[];
      list.sort((a, b) => b.createdAt - a.createdAt);
      setCaseReports(list);
      setLoadingCaseReports(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "research_reports");
      setLoadingCaseReports(false);
    });

    return () => unsubscribe();
  }, [activeCaseId]);

  // 2. Fetch User Documents (to link/unlink)
  useEffect(() => {
    if (!auth.currentUser) return;

    const qDocs = query(
      collection(db, "documents"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(qDocs, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUserDocs(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "documents");
    });

    return () => unsubscribe();
  }, []);

  // 3. Sync Active Case Chat History Subcollection
  useEffect(() => {
    if (!activeCaseId) {
      setMessages([]);
      return;
    }

    const chatRef = collection(db, "cases", activeCaseId, "messages");
    const qMessage = query(chatRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(qMessage, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    }, (error) => {
      console.error("Error matching chat messages:", error);
    });

    return () => unsubscribe();
  }, [activeCaseId]);

  // 4. Sync Active Case specific activity log
  useEffect(() => {
    if (!activeCaseId || !auth.currentUser) {
      setCaseActivities([]);
      return;
    }

    const qCaseAct = query(
      collection(db, "activities"),
      where("userId", "==", auth.currentUser.uid),
      where("caseId", "==", activeCaseId)
    );

    const unsubscribe = onSnapshot(qCaseAct, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      items.sort((a: any, b: any) => b.timestamp - a.timestamp);
      setCaseActivities(items);
    }, (error) => {
      console.log("Non-critical: Error listening to case activities", error);
    });

    return () => unsubscribe();
  }, [activeCaseId]);

  // 5. Initialize NotesText when activeCase transitions
  useEffect(() => {
    if (activeCase) {
      setNotesText((activeCase as any).notes || "");
    } else {
      setNotesText("");
    }
  }, [activeCaseId, cases]);

  // Derived collections
  const linkedDocs = allUserDocs.filter(d => d.caseId === activeCaseId);
  const unlinkedDocs = allUserDocs.filter(d => !d.caseId);

  // Handle Case Registration
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !formData.title.trim()) return;

    try {
      const newDocRef = await addDoc(collection(db, "cases"), {
        userId: auth.currentUser.uid,
        title: formData.title.trim(),
        category: formData.category || "Ma'lum qilinmagan",
        region: formData.region || "",
        courtType: formData.courtType || "",
        status: "active",
        deadlines: [],
        evidence: [],
        notes: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        winningProbability: 50,
        riskLevel: "Medium",
        strengths: ["Ish yangi ochildi", "Foydalanuvchi ma'lumotlarini kutmoqda"],
        weaknesses: ["Xavflarni tahlil qilish uchun AI diagnostikasini yangilang"],
        risk: "Qonunchilik doirasida taxminiy tahlil olish uchun tahlil panelidagi 'AI diagnostikani yangilash' tugmasini bosing.",
        strategy: "Vazifalar, hujjatlar va dalillarni jamlab sud paketini tayyorlang.",
        expertise: "Hali ekspertiza sharhi o'tkazilmagan."
      });

      await logActivity(
        "case_create",
        "Yangi ish ochildi",
        `"${formData.title.trim()}" mavzusidagi yangi ish muvaffaqiyatli ro'yxatdan o'tkazildi.`,
        newDocRef.id,
        formData.title.trim()
      );

      setIsModalOpen(false);
      setFormData({ title: "", category: "", region: "", courtType: "" });
      setActiveCaseId(newDocRef.id);
      setActiveTab("analysis");
      showToastMsg("Yorliq ish portfeli muvaffaqiyatli saqlandi!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "cases");
    }
  };

  // Toggle Active/Closed Case
  const toggleCaseStatus = async (caseItem: Case) => {
    try {
      const nextStatus = caseItem.status === "active" ? "closed" : "active";
      await updateDoc(doc(db, "cases", caseItem.id), {
        status: nextStatus,
        updatedAt: Date.now()
      });
      await logActivity(
        "case_status",
        "Maqom o'zgartirildi",
        `"${caseItem.title}" ish maqomi '${nextStatus}' ko'rinishiga yangilandi.`,
        caseItem.id,
        caseItem.title
      );
      showToastMsg("Ish holati o'zgartirildi!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cases/${caseItem.id}`);
    }
  };

  // Completely delete a case
  const handleDeleteCase = async (caseItem: Case) => {
    if (!window.confirm(`'${caseItem.title}' ishini o'chirishni xohlaysizmi? Bu jildga tegishli barcha moddiy ma'lumotlar o'chib ketadi!`)) return;
    try {
      if (activeCaseId === caseItem.id) {
        setActiveCaseId(null);
      }
      await deleteDoc(doc(db, "cases", caseItem.id));
      await logActivity(
        "case_delete",
        "Ish o'chirilishi",
        `"${caseItem.title}" nomli ish portfeli butunlay o'chirib yuborildi.`,
        caseItem.id,
        caseItem.title
      );
      showToastMsg("Ish olib tashlandi!", "success");
    } catch (error) {
      alert("Xatolik: Ishni o'chirib bo'lmadi.");
    }
  };

  // Link document to active Case Workspace
  const handleLinkDoc = async (docId: string) => {
    if (!activeCaseId || !activeCase) return;
    try {
      await updateDoc(doc(db, "documents", docId), {
        caseId: activeCaseId,
        updatedAt: Date.now()
      });
      
      await logActivity(
        "document_create",
        "Hujjat bog'landi",
        `Fayl "${activeCase.title}" ish papkasiga biriktirildi.`,
        activeCase.id,
        activeCase.title
      );

      showToastMsg("Hujjat ishga muvaffaqiyatli bog'landi!");
    } catch (err) {
      console.error("Error linking file:", err);
      showToastMsg("Bog'lashda xatolik yuz berdi", "error");
    }
  };

  // Unlink document from Workspace
  const handleUnlinkDoc = async (docId: string) => {
    if (!activeCaseId || !activeCase) return;
    try {
      await updateDoc(doc(db, "documents", docId), {
        caseId: null,
        updatedAt: Date.now()
      });

      await logActivity(
        "document_create",
        "Hujjat ajratildi",
        "Hujjat ish papkasidan erkin holatga qaytarildi.",
        activeCase.id,
        activeCase.title
      );

      showToastMsg("Hujjat g'ilofdan ajratildi!");
    } catch (err) {
      console.error("Error unlinking file:", err);
    }
  };

  // Persistence for Case Notes
  const handleSaveNotes = async () => {
    if (!activeCaseId || !activeCase) return;
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, "cases", activeCaseId), {
        notes: notesText,
        updatedAt: Date.now()
      });

      await logActivity(
        "note_update",
        "Maslahat/Qayd tahrirlandi",
        `Ish bo'yicha maxsus qaydlar va eslatmalar bo'limi tahrirlandi.`,
        activeCase.id,
        activeCase.title
      );

      showToastMsg("Eslatmalar muvaffaqiyatli saqlandi!");
    } catch (err) {
      console.error("Error saving notes:", err);
      showToastMsg("Eslatmani saqlashda xatolik yuz berdi", "error");
    } finally {
      setSavingNotes(false);
    }
  };

  // Add Deadline Object to Active Case Array
  const handleAddDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaseId || !activeCase || !deadlineTitle.trim() || !deadlineDate) return;

    try {
      const newDl: Deadline = {
        id: "dl_" + Math.random().toString(36).substring(2, 9),
        title: deadlineTitle.trim(),
        dueDate: new Date(deadlineDate).getTime(),
        completed: false,
        type: deadlineType
      };

      const updatedDls = [...(activeCase.deadlines || []), newDl];
      await updateDoc(doc(db, "cases", activeCaseId), {
        deadlines: updatedDls,
        updatedAt: Date.now()
      });

      const typeLabels = {
        hearing: "Sud majlisi",
        appeal: "Apellyatsiya muddati",
        submission: "Hujjat topshirish muddati",
        custom: "Ixtiyoriy muddat"
      };

      await logActivity(
        "deadline_create",
        "Yangi muddat belgilandi",
        `"${deadlineTitle.trim()}" (${typeLabels[deadlineType] || deadlineType}) muddati qo'shildi. Muddati: ${deadlineDate}.`,
        activeCase.id,
        activeCase.title
      );

      setDeadlineTitle("");
      setDeadlineDate("");
      setDeadlineType("custom");
      showToastMsg("Yangi muddat muvaffaqiyatli qo'shildi!");
    } catch (error) {
      console.error("Error creating checklist deadline:", error);
    }
  };

  // Toggle deadline completion progress
  const handleToggleDeadline = async (dlId: string) => {
    if (!activeCaseId || !activeCase) return;
    try {
      let toggledTitle = "";
      let toggledState = false;

      const list = (activeCase.deadlines || []).map(dl => {
        if (dl.id === dlId) {
          toggledTitle = dl.title;
          toggledState = !dl.completed;
          return { ...dl, completed: !dl.completed };
        }
        return dl;
      });

      await updateDoc(doc(db, "cases", activeCaseId), {
        deadlines: list,
        updatedAt: Date.now()
      });

      await logActivity(
        "deadline_toggle",
        toggledState ? "Muddat bajarildi deb belgilandi" : "Muddat qayta tiklandi",
        `"${toggledTitle}" nomli muddat/vazifa holati o'zgartirildi.`,
        activeCase.id,
        activeCase.title
      );

      showToastMsg("Vazifa holati yangilandi!");
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Deadline object
  const handleDeleteDeadline = async (dlId: string) => {
    if (!activeCaseId || !activeCase) return;
    try {
      const deletedDl = (activeCase.deadlines || []).find(dl => dl.id === dlId);
      const list = (activeCase.deadlines || []).filter(dl => dl.id !== dlId);
      await updateDoc(doc(db, "cases", activeCaseId), {
        deadlines: list,
        updatedAt: Date.now()
      });

      if (deletedDl) {
        await logActivity(
          "deadline_delete",
          "Muddat o'chirildi",
          `"${deletedDl.title}" nomli protsessual muddat o'chirildi.`,
          activeCase.id,
          activeCase.title
        );
      }

      showToastMsg("Muddat o'chirildi.");
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Uploading Evidence
  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaseId || !activeCase || !evidenceName.trim() || !evidenceFile) return;

    setUploadingEvidence(true);
    try {
      let downloadUrl = "";
      try {
        const convertToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
          });
        };
        const base64Data = await convertToBase64(evidenceFile);
        const res = await uploadEvidence(
          auth.currentUser?.uid || "",
          activeCaseId,
          evidenceFile.name,
          base64Data
        );
        downloadUrl = res.fileUrl;
      } catch (err) {
        console.warn("Storage fallback to object URL");
        downloadUrl = URL.createObjectURL(evidenceFile);
      }

      const newEv: Evidence = {
        id: "ev_" + Math.random().toString(36).substring(2, 11),
        name: evidenceName.trim(),
        type: evidenceFile.type || "application/octet-stream",
        category: evidenceCategory,
        fileUrl: downloadUrl,
        uploadedAt: Date.now()
      };

      const revisedEv = [...(activeCase.evidence || []), newEv];
      await updateDoc(doc(db, "cases", activeCaseId), {
        evidence: revisedEv,
        updatedAt: Date.now()
      });

      await logActivity(
        "evidence_add",
        "Dalil biriktirildi",
        `"${evidenceName.trim()}" moddiy dalil isboti sifatida yuklanib ilova qilindi.`,
        activeCase.id,
        activeCase.title
      );

      setEvidenceName("");
      setEvidenceFile(null);
      const picker = document.getElementById("evidence_file_picker") as HTMLInputElement;
      if (picker) picker.value = "";
      showToastMsg("Dalil muvaffaqiyatli yuklandi!");
    } catch (err: any) {
      console.error(err);
      showToastMsg("Yuklashda xatolik: " + err.message, "error");
    } finally {
      setUploadingEvidence(false);
    }
  };

  // Remove Evidence Object
  const handleRemoveEvidence = async (evId: string) => {
    if (!activeCaseId || !activeCase) return;
    if (!window.confirm("Ushbu dalil materialini jilddan olib tashlamoqchimisiz?")) return;
    try {
      const list = (activeCase.evidence || []).filter(ev => ev.id !== evId);
      await updateDoc(doc(db, "cases", activeCaseId), {
        evidence: list,
        updatedAt: Date.now()
      });
      showToastMsg("Dalil ro'yxatdan o'chirildi.");
    } catch (err) {
      console.error(err);
    }
  };

  // AI ADVOKAT CHAT HANDLER
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaseId || !newMessageText.trim() || aiResponding) return;

    const userText = newMessageText.trim();
    setNewMessageText("");
    setAiResponding(true);

    try {
      // Add message locally & in Firestore
      const msgRef = collection(db, "cases", activeCaseId, "messages");
      await addDoc(msgRef, {
        role: "user",
        content: userText,
        createdAt: Date.now()
      });

      // Invoke lawyer chat API proxy
      const conversationContext = messages.map(m => ({ role: m.role, content: m.content }));
      conversationContext.push({ role: "user", content: userText });

      const aiResponse = await chatWithLawyer(
        userText,
        "uz_lat",
        conversationContext,
        []
      );

      await addDoc(msgRef, {
        role: "model",
        content: aiResponse,
        createdAt: Date.now()
      });

      await updateDoc(doc(db, "cases", activeCaseId), {
        updatedAt: Date.now()
      });

    } catch (err: any) {
      console.error("AI Advokat error:", err);
      showToastMsg("Xatolik: Tarmoq band yoki server javob bermadi", "error");
    } finally {
      setAiResponding(false);
    }
  };

  // AI DIAGNOSTIC UPDATE HANDLER (RISK / STRATEGY)
  const handleUpdateAIDiagnostic = async () => {
    if (!activeCaseId || !activeCase || analyzingWithAI) return;

    setAnalyzingWithAI(true);
    try {
      const docSummaries = linkedDocs.map(d => `${d.title}: ${d.generatedText || d.content || ""}`).join("\n---\n");
      const systemPrompt = `
        Siz professional yuridik AI ekspertsiz. 
        Mavzu: "${activeCase.title}"
        Kategoriya: "${activeCase.category}"
        Biriktirilgan fayllar kontenti: "${docSummaries}"
        Dalillar: ${JSON.stringify(activeCase.evidence || [])}

        Iltimos jild bo'yicha tahliliy diagnostika qiling. 
        Natija JSON formatida qaytsin, mutlaq faqat ushbu JSON kabi shaklga ega bo'lsin:
        {
          "winningProbability": 75,
          "riskLevel": "Medium",
          "strengths": ["..", ".."],
          "weaknesses": ["..", ".."],
          "risk": "...",
          "strategy": "...",
          "expertise": "..."
        }
      `;

      const aiResponseText = await callAIServer({
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
      });
      
      // Parse response cleanly
      let payload = {
        winningProbability: 55,
        riskLevel: "Medium",
        strengths: ["Ma'lumotlar yangilandi"],
        weaknesses: ["Kichik kamchiliklar tahlil qilinmoqda"],
        risk: "Noaniq xavflilik",
        strategy: "Reja yangilandi",
        expertise: "Sharh tayyor."
      };

      try {
        const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          payload = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn("AI didn't output ideal JSON, using custom string adaptation");
      }

      await updateDoc(doc(db, "cases", activeCaseId), {
        winningProbability: payload.winningProbability || 50,
        riskLevel: payload.riskLevel || "Medium",
        strengths: payload.strengths || [],
        weaknesses: payload.weaknesses || [],
        risk: payload.risk || "",
        strategy: payload.strategy || "",
        expertise: payload.expertise || "",
        updatedAt: Date.now()
      });

      await logActivity(
        "risk_generate",
        "AI Diagnostic yangilandi",
        `Sun'iy intellekt tomonidan ishdagi barcha hujjatlar asosida strategik diagnostika qayta hisoblandi.`,
        activeCaseId,
        activeCase.title
      );

      showToastMsg("AI Diagnostik tahlili muvaffaqiyatli yakunlandi!");
    } catch (err: any) {
      console.error(err);
      showToastMsg("Server tahlilini yuklashda nosozlik bo'ldi", "error");
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  // COURT PACKET SCHEME GENERATOR (DOCKET)
  const handleGenerateCourtPackage = async () => {
    if (!activeCaseId || !activeCase) return;
    try {
      const starterDocket = {
        title: "Sud Paketi (Docket)",
        createdAt: Date.now(),
        checklist: [
          { id: "chk_1", title: "Da'vo arizasini aslini chop etish va imzolash", completed: false },
          { id: "chk_2", title: "Barcha moddiy isbotlar, kvitansiya cheklarini print qilish", completed: false },
          { id: "chk_3", title: "Davlat boji to'langanligi to'g'risida to'lov nusxasi", completed: false },
          { id: "chk_4", title: "Javobgarga da'vo arizasidan nusxa yuborilganlik introducesi", completed: false }
        ]
      };

      await updateDoc(doc(db, "cases", activeCaseId), {
        courtPackage: starterDocket,
        updatedAt: Date.now()
      });

      showToastMsg("Yangi yuridik arizalar paketi muloqoti ochildi!");
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Courtpackage list items
  const handleToggleCheckItem = async (itemId: string) => {
    if (!activeCaseId || !activeCase || !activeCase.courtPackage) return;
    try {
      const list = activeCase.courtPackage.checklist.map(item => {
        if (item.id === itemId) {
          return { ...item, completed: !item.completed };
        }
        return item;
      });

      await updateDoc(doc(db, "cases", activeCaseId), {
        "courtPackage.checklist": list,
        updatedAt: Date.now()
      });

      showToastMsg("Tekshiruv qadami o'zgartirildi!");
    } catch (err) {
      console.error(err);
    }
  };

  // Clear package
  const handleClearCourtPackage = async () => {
    if (!activeCaseId || !activeCase) return;
    try {
      await updateDoc(doc(db, "cases", activeCaseId), {
        courtPackage: null,
        updatedAt: Date.now()
      });
      showToastMsg("Sud paketi tozalandi.");
    } catch (err) {
      console.error(err);
    }
  };

  // ZIP EXPORT BUILDER METHOD - COMPLETE CASE DOWNLOAD
  const handleDownloadCompleteCaseZip = async () => {
    if (!activeCase) return;
    try {
      const zip = new JSZip();
      
      // 1. Generate Summary file
      let summaryText = `==================================================\n`;
      summaryText += `  ISH HUJJATLARI PORTFELI SUMMARY\n`;
      summaryText += `==================================================\n\n`;
      summaryText += `Ish nomi: ${activeCase.title}\n`;
      summaryText += `Kategoriya: ${activeCase.category || "Umumiy"}\n`;
      summaryText += `Maqom: ${activeCase.status}\n`;
      summaryText += `Yaratilgan vaqt: ${new Date(activeCase.createdAt).toLocaleString()}\n`;
      summaryText += `So'nggi yangilanish: ${new Date(activeCase.updatedAt).toLocaleString()}\n\n`;
      
      if (activeCase.region || activeCase.courtType) {
        summaryText += `Tashkiliy ma'lumotlar:\n`;
        summaryText += `  - Region: ${activeCase.region || "Belgilanmagan"}\n`;
        summaryText += `  - Sud idorasi: ${activeCase.courtType || "Belgilanmagan"}\n\n`;
      }
      
      summaryText += `Diagnostika Hisobi:\n`;
      summaryText += `  - G'alaba qozonish ehtimoli: ${activeCase.winningProbability || 50}%\n`;
      summaryText += `  - Xavf-xatarlar darajasi: ${activeCase.riskLevel || "Medium"}\n\n`;
      
      summaryText += `--------------------------------------------------\n`;
      summaryText += `  Vazifalar & Muddatlar (Deadlines)\n`;
      summaryText += `--------------------------------------------------\n`;
      if (activeCase.deadlines && activeCase.deadlines.length > 0) {
        activeCase.deadlines.forEach((dl: any, i: number) => {
          summaryText += `${i + 1}. [${dl.completed ? "X" : " "}] ${dl.title} - ${new Date(dl.dueDate).toLocaleDateString()}\n`;
        });
      } else {
        summaryText += `Hech qanday muddat yoki vazifa o'rnatilmagan.\n`;
      }
      summaryText += `\n`;
      
      summaryText += `--------------------------------------------------\n`;
      summaryText += `  Moddiy Dalillar (Evidence)\n`;
      summaryText += `--------------------------------------------------\n`;
      if (activeCase.evidence && activeCase.evidence.length > 0) {
        activeCase.evidence.forEach((ev: any, i: number) => {
          summaryText += `${i + 1}. ${ev.name} [Tur: ${ev.category}] - ${new Date(ev.uploadedAt).toLocaleDateString()}\n`;
        });
      } else {
        summaryText += `Hech qanday moddiy dalil yuklanmagan.\n`;
      }
      
      zip.file("Summary_Hisobot.txt", summaryText);
      
      // 2. Generate intelligence files
      if (activeCase.risk) {
        zip.file("Risk_Analysis.md", `# Risk Tahlili\n\n${activeCase.risk}`);
      }
      if (activeCase.strategy) {
        zip.file("Strategy_Plan.md", `# Advokatlik Strategiyasi & Reja\n\n${activeCase.strategy}`);
      }
      if (activeCase.expertise) {
        zip.file("AI_Expertise.md", `# Sun'iy Intellekt Ekspertiza Sharhi\n\n${activeCase.expertise}`);
      }
      
      // 3. Generate Notes file
      const notesContent = (activeCase as any).notes || "Ushbu ish uchun qayd etilgan maxsus eslatmalar bo'sh.";
      zip.file("Case_Notes.txt", notesContent);
      
      // 4. Put associated documents inside "Documents/" subfolder
      if (linkedDocs.length > 0) {
        const docsFolder = zip.folder("Documents");
        linkedDocs.forEach(docItem => {
          const docTitle = (docItem.title || "Hujjat").replace(/[/\\?%*:|"<>]/g, "-"); // Sanitise
          const docText = docItem.generatedText || docItem.content || "";
          docsFolder?.file(`${docTitle}.md`, `# ${docItem.title || "Yuridik Hujjat"}\n\nKategoriya: ${docItem.category || "Ma'lum qilinmagan"}\n\n${docText}`);
        });
      }
      
      // 5. Generate and download zip
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${activeCase.title.replace(/\s+/g, "_")}_harakatlar_jildi.zip`);
      
      showToastMsg("Ish materiallari to'liq ZIP to'plam ko'rinishida yuklab olindi!");
      await logActivity(
        "document_export", 
        "Ish materiallari eksport qilindi", 
        `"${activeCase.title}" ishidagi barcha materiallar ZIP paket ko'rinishida eksport qilindi.`,
        activeCase.id,
        activeCase.title
      );
    } catch (err: any) {
      console.error("ZIP Generation failed:", err);
      errorLogger.log("zip_export", "ExportError", err, `ZIP output generation failed for case ${activeCase?.id || "unknown"}: ${err.message || err}`);
      const friendlyMsg = getFriendlyErrorMessage(err, "uz_lat");
      alert(friendlyMsg);
    }
  };

  // Helper Countdown colors for active deadlines
  const getCountdownBadge = (dueTimestamp: number) => {
    const diff = dueTimestamp - Date.now();
    const days = Math.ceil(diff / (1050 * 60 * 60 * 24));
    
    if (diff < 0) {
      return { text: "Muddati o'tdi", color: "bg-red-100 text-red-700" };
    }
    if (days <= 3) {
      return { text: `${days} kun qoldi 🔥`, color: "bg-red-50 text-red-600 border-red-100/40 animate-pulse font-bold" };
    }
    if (days <= 7) {
      return { text: `${days} kun qoldi`, color: "bg-orange-50 text-orange-600 border-orange-100/40" };
    }
    return { text: `${days} kun qoldi`, color: "bg-slate-50 text-slate-500 border-slate-100" };
  };

  // Filter cases with client search
  const filteredCases = cases.filter(c => {
    const queryLower = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(queryLower) ||
      (c.category && c.category.toLowerCase().includes(queryLower)) ||
      (c.region && c.region.toLowerCase().includes(queryLower))
    );
  });

  return (
    <div className="flex-grow flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden leading-normal transition-colors duration-200">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-6 z-[120] bg-zinc-900 dark:bg-zinc-100 border border-zinc-800 dark:border-zinc-200 text-white dark:text-zinc-900 font-medium text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade-in animate-duration-200">
          <CheckSquare className="w-4 h-4 text-emerald-500" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. LEFT CODES / CASES LIST */}
      <div className={`w-full md:w-80 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0 ${activeCaseId ? "hidden md:flex" : "flex"}`}>
        
        {/* Search & Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              Ish Portfeli ({cases.length})
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg transition-all focus:outline-none cursor-pointer"
              id="open_create_case_modal_btn"
              title="Yangi ish ochish"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sarlavha, kategoriya bo'yicha..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 rounded-lg text-xs focus:ring-1 focus:ring-zinc-400/20 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition"
            />
            <Search className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute left-3 top-2" />
          </div>
        </div>

        {/* Real-time Case Files */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 text-gray-400 dark:text-zinc-500 animate-spin" />
            </div>
          ) : filteredCases.length > 0 ? (
            filteredCases.map((c) => {
              const isSelected = c.id === activeCaseId;
              const statusStr = c.status as string;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveCaseId(c.id);
                    setActiveTab("analysis");
                  }}
                  className={`w-full p-3 rounded-lg text-left border transition-all cursor-pointer select-none ${
                    isSelected
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-950 dark:border-transparent shadow-xs"
                      : "bg-white dark:bg-zinc-900 hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 border-gray-200 dark:border-zinc-800/60 text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isSelected ? "bg-white/15 text-white dark:bg-zinc-200/60 dark:text-zinc-950" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                    }`}>
                      {c.category || "Umumiy"}
                    </span>
                    <span className={`text-[9px] font-semibold flex items-center gap-1 ${
                      statusStr === "active" ? "text-emerald-500" :
                      statusStr === "inprogress" ? "text-amber-500" :
                      statusStr === "closed" ? "text-blue-500" : "text-gray-400"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {statusStr === 'active' ? "Faol" : statusStr === 'inprogress' ? "Jarayonda" : statusStr === 'closed' ? "Yopilgan" : "Arxiv"}
                    </span>
                  </div>

                  <h3 className="font-bold text-[13px] tracking-tight mt-1.5 leading-snug line-clamp-2">
                    {c.title}
                  </h3>
                  
                  {c.region && (
                    <p className={`text-[10px] mt-1 font-medium truncate ${isSelected ? "text-white/70 dark:text-zinc-600" : "text-gray-400 dark:text-zinc-500"}`}>
                      📍 {c.region} - {c.courtType || "Fuqarolik sudi"}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-400 select-none">
              <Briefcase className="w-6 h-6 mx-auto text-gray-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs">Ushbu so'rovga mos keluvchi ish materiallari topilmadi.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. CASE DOSSIER DETAIL COMPONENT */}
      <div className={`flex-grow flex flex-col overflow-hidden bg-gray-50/30 dark:bg-zinc-950/70 ${activeCaseId ? "flex" : "hidden md:flex"}`}>
        {activeCase ? (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Dossier banner metadata & action buttons */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveCaseId(null)}
                  className="md:hidden p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                  title="Orqaga"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">
                    Ish Materiali kabineti (Case Dossier)
                  </span>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none max-w-2xl line-clamp-1">
                    {activeCase.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                
                {/* ZIP Export Button */}
                <button
                  onClick={handleDownloadCompleteCaseZip}
                  className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Fayllar, risklar va eslatmalarni to'liq ZIP yuklash"
                >
                  <Download className="w-3.5 h-3.5" />
                  Harakatlar jildini yuklash (ZIP)
                </button>

                {/* Modern Status Selector Dropdown */}
                <div className="flex items-center gap-1 shrink-0 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-0.5 rounded-lg">
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1.5">Holat:</span>
                  <select
                    value={activeCase.status || "active"}
                    onChange={async (e) => {
                      const newStat = e.target.value;
                      try {
                        await updateDoc(doc(db, "cases", activeCase.id), {
                          status: newStat,
                          updatedAt: Date.now()
                        });
                        showToastMsg(`Ish maqomi muvaffaqiyatli o'zgartirildi: ${newStat}`);
                        await logActivity(
                          "case_status",
                          "Ish maqomi o'zgartirildi",
                          `"${activeCase.title}" ish maqomi o'zgartirildi: "${newStat}".`,
                          activeCase.id,
                          activeCase.title
                        );
                      } catch (err) {
                        alert("Xatolik maqom yangilanmadi.");
                      }
                    }}
                    className="bg-white dark:bg-zinc-900 text-[10px] font-bold rounded-md px-1.5 py-1 focus:outline-none cursor-pointer text-zinc-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700"
                  >
                    <option value="active">Active (Faol)</option>
                    <option value="inprogress">In Progress (Jarayonda)</option>
                    <option value="closed">Closed (Yopilgan)</option>
                    <option value="archived">Archived (Arxivlangan)</option>
                  </select>
                </div>
                
                <button
                  onClick={() => handleDeleteCase(activeCase)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                  title="Ishni o'chirish"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Glass-inspired horizontal tab deck */}
            <div className="px-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
              <div className="flex gap-6 overflow-x-auto no-scrollbar py-2">
                <button
                  onClick={() => setActiveTab("analysis")}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-colors flex items-center gap-1 cursor-pointer ${
                    activeTab === "analysis" ? "text-zinc-900 dark:text-zinc-50" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                  id="tab_analysis"
                >
                  📊 Diognostika & Reja
                  {activeTab === "analysis" && (
                    <motion.div layoutId="active_tab_border" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("chat")}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-colors flex items-center gap-1 cursor-pointer ${
                    activeTab === "chat" ? "text-zinc-900 dark:text-zinc-50" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                  id="tab_chat"
                >
                  💬 AI Advokat Chat
                  {activeTab === "chat" && (
                    <motion.div layoutId="active_tab_border" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("documents")}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-colors flex items-center gap-1 cursor-pointer ${
                    activeTab === "documents" ? "text-zinc-900 dark:text-zinc-50" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                  id="tab_documents"
                >
                  📂 Ish Hujjatlari ({linkedDocs.length})
                  {activeTab === "documents" && (
                    <motion.div layoutId="active_tab_border" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("deadlines")}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-colors flex items-center gap-1 cursor-pointer ${
                    activeTab === "deadlines" ? "text-zinc-900 dark:text-zinc-50" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                  id="tab_deadlines"
                >
                  ⏰ Muddat & Dalillar
                  {activeTab === "deadlines" && (
                    <motion.div layoutId="active_tab_border" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("notes")}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-colors flex items-center gap-1 cursor-pointer ${
                    activeTab === "notes" ? "text-zinc-900 dark:text-zinc-50" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                  id="tab_notes"
                >
                  📝 Eslatmalar
                  {activeTab === "notes" && (
                    <motion.div layoutId="active_tab_border" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-colors flex items-center gap-1 cursor-pointer ${
                    activeTab === "history" ? "text-zinc-900 dark:text-zinc-50" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                  id="tab_history"
                >
                  📜 Hodisalar logi ({caseActivities.length})
                  {activeTab === "history" && (
                    <motion.div layoutId="active_tab_border" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("evidence_analyzer")}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
                    activeTab === "evidence_analyzer" ? "text-zinc-900 dark:text-zinc-50 animate-pulse" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                  id="tab_evidence_analyzer"
                >
                  🔍 Dalillar Tahlili (AI Analyzer)
                  {activeTab === "evidence_analyzer" && (
                    <motion.div layoutId="active_tab_border" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("research")}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
                    activeTab === "research" ? "text-zinc-900 dark:text-zinc-50" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                  id="tab_research"
                >
                  🎓 AI Yuridik Tadqiqot ({caseReports.length})
                  {activeTab === "research" && (
                    <motion.div layoutId="active_tab_border" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* TAB CONTENT SPACE */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50 dark:bg-zinc-950/40 scrollbar-thin">
              <AnimatePresence mode="wait">
                
                {/* A. TAXLIL & RISK REJA PANEL */}
                {activeTab === "analysis" && (
                  <motion.div
                    key="analysis-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Visual dashboard summary components */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Probability card with radial meter */}
                      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                        
                        <div className="absolute top-4 left-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          G'alaba ehtimolligi
                        </div>

                        {/* Circular ring meter */}
                        <div className="relative w-36 h-36 flex items-center justify-center mt-6">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="72"
                              cy="72"
                              r="60"
                              stroke="currentColor"
                              strokeWidth="10"
                              fill="transparent"
                              className="text-gray-100 dark:text-zinc-800"
                            />
                            <circle
                              cx="72"
                              cy="72"
                              r="60"
                              stroke="#2563EB"
                              strokeWidth="10"
                              fill="transparent"
                              strokeDasharray={376.8}
                              strokeDashoffset={376.8 - (376.8 * (activeCase.winningProbability || 50)) / 100}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{activeCase.winningProbability || 50}%</span>
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mt-0.5">Sud bahosi</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-400 dark:text-zinc-400 mt-4 leading-relaxed max-w-xs">
                          Ushbu ko'rsatkich barcha taqdim qilingan dalillar, yozilgan qarorlar va chat tarixiga asosan baholanadi.
                        </p>
                      </div>

                      {/* Risk Level assessment card */}
                      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider w-fit flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Xavf hisoboti
                          </div>

                          <div className="flex items-center gap-4 mt-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                              activeCase.riskLevel === 'High' ? 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400' :
                              activeCase.riskLevel === 'Medium' ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400' : 'bg-green-50 dark:bg-green-950/30 text-green-500 dark:text-green-400'
                            }`}>
                              <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold block">Baholangan xavf darajasi:</span>
                              <h4 className={`text-xl font-extrabold mt-1 uppercase ${
                                activeCase.riskLevel === 'High' ? 'text-red-600 dark:text-red-400' :
                                activeCase.riskLevel === 'Medium' ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                              }`}>
                                {activeCase.riskLevel === 'High' ? "Yuqori (High)" :
                                 activeCase.riskLevel === 'Medium' ? "O'rtacha (Medium)" : "Past (Low)"}
                              </h4>
                            </div>
                          </div>
                        </div>

                        {/* Smart updates trigger and status info trigger */}
                        <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60 dark:bg-zinc-950/40 p-3.5 rounded-2xl">
                          <span className="text-[10px] text-gray-500 dark:text-zinc-400 leading-snug">
                            Barcha yangi material va vazifalar asosida analitik hisobotni yangilang.
                          </span>
                          <button
                            onClick={handleUpdateAIDiagnostic}
                            disabled={analyzingWithAI}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md gap-1.5 shrink-0"
                            id="run_ai_analysis_btn"
                          >
                            {analyzingWithAI ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Tahlilda...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                Tahlilni Yangilash
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Strengths & Weaknesses Split Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Custom styled strengths component */}
                      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          Kuchli tomonlar (Strengths)
                        </h4>
                        <ul className="space-y-3">
                          {activeCase.strengths && activeCase.strengths.length > 0 ? (
                            activeCase.strengths.map((str, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-600 dark:text-zinc-300">
                                <span className="bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 p-0.5 rounded-full shrink-0 font-bold text-[9px]">✓</span>
                                <span className="font-medium leading-relaxed">{str}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-gray-400 dark:text-zinc-500 italic">Hech qanday kuchli taraflar ko'rsatilmagan.</li>
                          )}
                        </ul>
                      </div>

                      {/* Custom styled weakness component */}
                      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2 mb-4">
                          <ShieldAlert className="w-5 h-5 text-red-500" />
                          Zaif tomonlar (Weaknesses / Risks)
                        </h4>
                        <ul className="space-y-3">
                          {activeCase.weaknesses && activeCase.weaknesses.length > 0 ? (
                            activeCase.weaknesses.map((weak, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-600 dark:text-zinc-300">
                                <span className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-0.5 rounded-full shrink-0 font-bold text-[9px]">!</span>
                                <span className="font-medium leading-relaxed">{weak}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-gray-400 dark:text-zinc-500 italic">Hech qanday zaif taraflar ko'rsatilmagan.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Strategy & AI Expert Critique Section */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
                      
                      {/* Risk narrative content */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800 pb-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          Yuridik xavf tahlili (Risk Analysis)
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed capitalize-first font-medium">
                          {activeCase.risk || "Xavf baholarini olish uchun AI diagnostik tahlilidan foydalaning."}
                        </p>
                      </div>

                      {/* Strategy and calendar plan */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800 pb-2 mb-3">
                          <ClipboardList className="w-4 h-4 text-blue-500" />
                          Ish bo'yicha Strategiya & Harakatlar Rejasi (Strategy & Plan)
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">
                          {activeCase.strategy || "Ishning muddatli kalendar rejasini tayyorlash uchun AI diagnostik tahlilini kuting."}
                        </p>
                      </div>

                      {/* AI Expertise review */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800 pb-2 mb-3">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          Sun'iy Intellekt Ekspertiza Sharhi (AI Expertise)
                        </h4>
                        <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200 font-semibold leading-relaxed leading-6 whitespace-pre-wrap">
                          {activeCase.expertise || "Ekspertizadan o'tkazish uchun ma'lumotlarni to'ldirib yuqoridagi yangilash tugmasini ishlating."}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* B. AI ADVOKAT CHAT HISTORY TAB */}
                {activeTab === "chat" && (
                  <motion.div
                    key="chat-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden h-[calc(100vh-21rem)] min-h-[420px]"
                  >
                    
                    {/* Chat log displays */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/40 dark:bg-zinc-950/40 scrollbar-thin">
                      
                      {/* Empty state instruction */}
                      <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 text-xs text-blue-800 leading-relaxed flex gap-2.5 items-start">
                        <Info className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
                        <div>
                          <strong className="block font-semibold mb-0.5">Ish portfeli doirasidagi AI maslahatlashuv:</strong>
                          Ushbu bo'limda yozilgan savollarga javob berishda AI tizimi ish papkasidagi barcha ma'lumotlarni (dalillar, qaydlar va boshqa hujjatlar) bevosita biladi.
                        </div>
                      </div>

                      {messages.map((m, idx) => {
                        const isUser = m.role === "user";
                        return (
                          <div 
                            key={m.id || idx}
                            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed font-medium ${
                              isUser 
                                ? "bg-slate-900 text-white rounded-br-none shadow-md shadow-slate-900/10" 
                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                            }`}>
                              <div>{m.content}</div>
                              
                              <div className={`text-[9px] mt-1.5 text-right font-mono ${
                                isUser ? "text-slate-400" : "text-gray-400"
                              }`}>
                                {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Responding state spinner */}
                      {aiResponding && (
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">AI advokat tayyorlanmoqda...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Text Input and send operations */}
                    <form 
                      onSubmit={handleSendChatMessage} 
                      className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          placeholder="Murojaat bo'yicha huquqiy tahlil qilish yoki sud pozitsiyasini baholashni so'rang..."
                          className="flex-1 px-4 py-3 text-xs bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-zinc-900 transition-all focus:border-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={aiResponding || !newMessageText.trim()}
                          className="px-5 bg-slate-900 dark:bg-zinc-100 dark:text-zinc-950 rounded-xl text-white font-bold hover:bg-slate-800 dark:hover:bg-zinc-200 disabled:bg-gray-200 dark:disabled:bg-zinc-800 disabled:text-gray-400 dark:disabled:text-zinc-600 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Send className="w-4 h-4" />
                          Yuborish
                        </button>
                      </div>
                    </form>

                  </motion.div>
                )}

                {/* C. ISH HUJJATLARI MANAGEMENT TAB */}
                {activeTab === "documents" && (
                  <motion.div
                    key="documents-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 xl:grid-cols-2 gap-6"
                  >
                    
                    {/* Left Column: List of documents associated with this Case Workspace */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col h-[580px]">
                      <div className="flex items-center justify-between border-b border-gray-5 pb-4 mb-4 shrink-0">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-green-500" />
                            Biriktirilgan Hujjatlar
                          </h4>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Ushbu ish doirasida yaratilgan da'vo, shartnoma va arizalar</p>
                        </div>

                        {/* Trigger Document Selection Modal link */}
                        <button
                          onClick={() => setIsTemplateSelectorOpen(true)}
                          className="inline-flex items-center text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all gap-1 shadow-xs"
                          id="draft_new_document_btn"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Yozish (Draft)
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {linkedDocs.length > 0 ? (
                          linkedDocs.map((docItem) => (
                            <div 
                              key={docItem.id}
                              className="p-4 rounded-2xl bg-gray-50/30 dark:bg-zinc-950/30 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">
                                    {docItem.title || "Sarlavhasiz hujjat"}
                                  </h5>
                                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 block mt-0.5">
                                    Yaratildi: {new Date(docItem.createdAt?.seconds * 1050 || docItem.createdAt || Date.now()).toLocaleDateString("UZ-uz")}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Link 
                                  to={`/result/${docItem.id}`}
                                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-xl"
                                >
                                  Ochish
                                </Link>
                                <button
                                  onClick={() => handleUnlinkDoc(docItem.id)}
                                  className="p-2 text-gray-300 dark:text-zinc-600 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                  title="Jilddan ajratish"
                                >
                                  <FileMinus className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-20 text-gray-400">
                            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs">Ushbu ish uchun hujjatlar yozilmagan.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Other unbound PDF/Docs to attach */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col h-[580px]">
                      <div className="border-b border-gray-50 dark:border-zinc-800 pb-4 mb-4 shrink-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                          <LinkIcon className="w-5 h-5 text-blue-500" />
                          Bo'sh Hujjatlar (Unbound Docs)
                        </h4>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Boshqa erkin yuridik hujjatlarni jildga bog'lash</p>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {unlinkedDocs.length > 0 ? (
                          unlinkedDocs.map((docItem) => (
                            <div 
                              key={docItem.id}
                              className="p-4 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-all flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-gray-100 text-gray-500 rounded-xl shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-gray-700 truncate">
                                    {docItem.title || "Sarlavhasiz hujjat"}
                                  </h5>
                                  <span className="text-[9px] text-gray-400 block">
                                    Kategoriya: {docItem.category || "Ma'lum qilinmagan"}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleLinkDoc(docItem.id)}
                                className="inline-flex items-center text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-all font-bold shrink-0"
                              >
                                Bog'lash
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-20 text-gray-400">
                            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-xs">Biriktirilishi mumkin bo'lgan bo'sh hujjatlar mavjud emas.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* D. MUDDATLAR VA DALILLAR LIST PANEL */}
                {activeTab === "deadlines" && (
                  <motion.div
                    key="deadlines-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 xl:grid-cols-2 gap-6"
                  >
                    
                    {/* Part D1: Task / Hearing Deadlines Form & Countdown Lists */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col h-[640px]">
                      
                      <div className="border-b border-gray-50 dark:border-zinc-800 pb-4 mb-4 shrink-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-orange-500" />
                          Belgilangan Protsessual Muddatlar (Deadlines)
                        </h4>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Taqdimot muddatlari, raddiyalar va sud majlislari kunlari</p>
                      </div>
                      {/* Inline form to write deadlines */}
                      <form onSubmit={handleAddDeadline} className="flex flex-col md:flex-row gap-2 mb-4 bg-gray-50 dark:bg-zinc-800 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800/80 shrink-0">
                        <input
                          type="text"
                          required
                          value={deadlineTitle}
                          onChange={(e) => setDeadlineTitle(e.target.value)}
                          placeholder="Vazifa nomi (Masalan: Sud majlisi, apellyatsiya shikoyati)..."
                          className="flex-1 px-3 py-2 text-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <select
                            value={deadlineType}
                            onChange={(e: any) => setDeadlineType(e.target.value)}
                            className="px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none cursor-pointer text-gray-600 dark:text-zinc-300"
                          >
                            <option value="hearing" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Sud majlisi</option>
                            <option value="appeal" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Apellyatsiya</option>
                            <option value="submission" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Hujjat topshirish</option>
                            <option value="custom" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Ixtiyoriy</option>
                          </select>
                          <input
                            type="date"
                            required
                            value={deadlineDate}
                            onChange={(e) => setDeadlineDate(e.target.value)}
                            className="px-3 py-2 text-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none w-32 cursor-pointer font-bold"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shrink-0"
                          >
                            Qo'shish
                          </button>
                        </div>
                      </form>

                      {/* Deadlines lists maps */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                        {activeCase.deadlines && activeCase.deadlines.length > 0 ? (
                          activeCase.deadlines.map((dl) => {
                            const badge = getCountdownBadge(dl.dueDate);
                            return (
                              <div 
                                key={dl.id}
                                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                  dl.completed 
                                    ? "bg-gray-50 border-gray-100 opacity-60" 
                                    : "bg-white border-gray-100 hover:border-gray-200"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={dl.completed}
                                    onChange={() => handleToggleDeadline(dl.id)}
                                    className="rounded border-gray-300 w-4.5 h-4.5 text-blue-600 focus:ring-blue-500/30 cursor-pointer shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <h5 className={`text-xs font-bold truncate ${
                                      dl.completed ? "line-through text-gray-400" : "text-gray-800"
                                    }`}>
                                      {dl.title}
                                    </h5>
                                    
                                    <div className="flex items-center flex-wrap gap-2 mt-1">
                                      <span className="text-[10px] text-gray-400 font-mono">
                                        Vaqt: {new Date(dl.dueDate).toLocaleDateString("UZ-uz")}
                                      </span>
                                      {dl.type && (
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                          dl.type === "hearing" ? "bg-red-50/75 text-red-600 border-red-200" :
                                          dl.type === "appeal" ? "bg-purple-50/75 text-purple-600 border-purple-200" :
                                          dl.type === "submission" ? "bg-blue-50/75 text-blue-600 border-blue-200" :
                                          "bg-gray-50/75 text-gray-600 border-gray-200"
                                        }`}>
                                          {dl.type === "hearing" ? "Sud majlisi" :
                                           dl.type === "appeal" ? "Apellyatsiya" :
                                           dl.type === "submission" ? "Hujjat topshirish" :
                                           "Ixtiyoriy"}
                                        </span>
                                      )}
                                      {!dl.completed && (
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${badge.color}`}>
                                          {badge.text}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteDeadline(dl.id)}
                                  className="text-gray-300 hover:text-red-500 p-2 rounded-xl transition-colors shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-20 text-gray-400">
                            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs">Muddat va vazifalar o'rnatilmagan.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Part D2: Evidence File Upload Component */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col h-[640px]">
                      
                      <div className="border-b border-gray-50 dark:border-zinc-800 pb-4 mb-4 shrink-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                          <Paperclip className="w-5 h-5 text-blue-500" />
                          Moddiy Dalil va Asos materiallari (Evidence)
                        </h4>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Sudga taqdim etiluvchi chek, fotosurat, shartnoma va guvohliklar</p>
                      </div>

                      {/* Add Evidence input form block */}
                      <form onSubmit={handleAddEvidence} className="space-y-3 bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 shrink-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            value={evidenceName}
                            onChange={(e) => setEvidenceName(e.target.value)}
                            placeholder="Dalil sarlavhasi (M: Hisob faktura)"
                            className="w-full px-3 py-2.5 text-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none"
                          />
                          <select
                            value={evidenceCategory}
                            onChange={(e) => setEvidenceCategory(e.target.value as any)}
                            className="w-full px-3 py-2.5 text-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none cursor-pointer font-bold text-gray-600 dark:text-zinc-300"
                          >
                            <option value="contract">Shartnoma / Bitim</option>
                            <option value="receipt">Kvitansiya / Tranzaksiya</option>
                            <option value="photo">Foto / Visual dalil</option>
                            <option value="other">Boshqa moddiy hujjat</option>
                          </select>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                          <div className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-1 flex items-center">
                            <input
                              type="file"
                              id="evidence_file_picker"
                              required
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setEvidenceFile(e.target.files[0]);
                                }
                              }}
                              className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-gray-100 dark:file:bg-zinc-800 dark:file:text-zinc-200 file:text-xs file:font-semibold cursor-pointer text-gray-500 dark:text-zinc-400"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={uploadingEvidence}
                            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 font-bold rounded-xl text-white text-xs hover:bg-blue-700 transition-colors shrink-0 inline-flex items-center justify-center gap-1.5"
                          >
                            {uploadingEvidence ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Yuklanmoqda...
                              </>
                            ) : (
                              <>
                                <FileUp className="w-3.5 h-3.5" />
                                Qo'shish
                              </>
                            )}
                          </button>
                        </div>
                      </form>

                      {/* Evidence objects matches rendering */}
                      <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-2 scrollbar-thin">
                        {activeCase.evidence && activeCase.evidence.length > 0 ? (
                          activeCase.evidence.map((ev) => (
                            <div 
                              key={ev.id}
                              className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-xl shrink-0 text-xs font-bold font-mono">
                                  {ev.category === "contract" ? "SH" : ev.category === "receipt" ? "KV" : ev.category === "photo" ? "RA" : "BO"}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate">
                                    {ev.name}
                                  </h5>
                                  <span className="text-[9px] text-gray-400 block truncate font-semibold">
                                    Yuklandi: {new Date(ev.uploadedAt || Date.now()).toLocaleDateString("UZ-uz")}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrinks-0">
                                {ev.fileUrl && (
                                  <a 
                                    href={ev.fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                    Ochish
                                  </a>
                                )}
                                <button
                                  onClick={() => handleRemoveEvidence(ev.id)}
                                  className="text-gray-300 hover:text-red-500 p-2 rounded-xl"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-20 text-gray-400">
                            <Paperclip className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs">Moddiy dalillar biriktirilmagan.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* E. NOTES (ESLATMALAR) TAB */}
                {activeTab === "notes" && (
                  <motion.div
                    key="notes-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col h-[580px]">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-zinc-800 mb-4 shrink-0">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                            <FileEdit className="w-5 h-5 text-blue-500" />
                            Ish bo'yicha maxsus qaydlar (Case Notes)
                          </h4>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Ushbu holat doirasi bo'yicha maxsus tezkor eslatmalarini saqlang</p>
                        </div>
                        
                        <button
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                          className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          {savingNotes ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Saqlanmoqda..
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Eslatmani saqlash
                            </>
                          )}
                        </button>
                      </div>

                      <textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Advokatlik eslatmalari, sud tizer xulosalari yoki ish bo'yicha alohida faktlar va fikrlaringizni bu yerda tahrirlab saqlab boring..."
                        className="flex-1 w-full p-4 border border-gray-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none text-xs font-semibold leading-relaxed bg-[#fbfbfb] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 scrollbar-thin resize-none"
                      />
                    </div>
                  </motion.div>
                )}

                {/* F. CASE HOOISALARI LOGI (HISTORY) TAB */}
                {activeTab === "history" && (
                  <motion.div
                    key="history-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200/80 dark:border-zinc-800 shadow-sm">
                      <div className="pb-3 border-b border-gray-50 dark:border-zinc-800 mb-6">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-indigo-500" />
                          Hujjat va tahlillar tarixi (Activity Log)
                        </h4>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Ishning real-time o'zgarishlar va protsessual yuklanmalar xronologiyasi</p>
                      </div>

                      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
                        {caseActivities.length > 0 ? (
                          caseActivities.map((act) => {
                            const actDate = new Date(act.timestamp);
                            return (
                              <div key={act.id} className="relative group">
                                <div className="absolute -left-[20px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border border-white" />
                                <div className="space-y-0.5 leading-normal">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-800 text-xs tracking-tight">{act.title}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {actDate.toLocaleDateString()} {actDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 font-sans leading-relaxed">
                                    {act.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-10 text-slate-400">
                            Hech qanday log xronologiyasi joriy etilmagan.
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* G. EVIDENCE ANALYZER TAB */}
                {activeTab === "evidence_analyzer" && (
                  <motion.div
                    key="evidence-analyzer-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {auth.currentUser && activeCaseId && (
                      <EvidenceAnalyzer 
                        caseId={activeCaseId}
                        userId={auth.currentUser.uid}
                        caseTitle={activeCase?.title || "Yuridik ish"}
                      />
                    )}
                  </motion.div>
                )}

                {/* H. AI RESEARCH REQUISITION TAB */}
                {activeTab === "research" && (
                  <motion.div
                    key="research-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    
                    {/* Input launcher if they want to run a new one */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                        Ish doirasida yangi AI tadqiqot hisoboti shakllantirish
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                        Ushbu ish jildidagi vaziyat, ziddiyatlar yoki nizoli holatlar bo'yicha maxsus yuridik so'rov bering. AI kodekslar tahlili va amaliy strategik qadamlarni taqdim qiladi.
                      </p>

                      <div className="space-y-3">
                        <textarea
                          value={caseResearchInput}
                          onChange={(e) => setCaseResearchInput(e.target.value)}
                          placeholder="Savolni kiriting. Masalan: Da'voni ta'minlash choralari bo'yicha mulkni xatlash tartibi..."
                          className="w-full h-24 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-1 focus:ring-blue-500/20 focus:outline-none resize-none leading-relaxed"
                          disabled={generatingCaseResearch}
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-medium">
                            Hisobot avtomatik ravishda ushbu ishga bog'lanadi.
                          </span>
                          <button
                            onClick={async () => {
                              if (!caseResearchInput.trim() || generatingCaseResearch) return;
                              setGeneratingCaseResearch(true);
                              setCaseResearchFeedback("G'oya tahlil qilinmoqda...");
                              try {
                                setCaseResearchFeedback("Qonun kodi va pretsedentlar o'rganilmoqda...");
                                const reportData = await generateResearchReport(caseResearchInput, (msg) => {
                                  setCaseResearchFeedback(msg);
                                });
                                
                                setCaseResearchFeedback("Saqlanmoqda...");
                                await saveResearchReport({
                                  ...reportData,
                                  question: caseResearchInput.trim(),
                                  caseId: activeCaseId
                                });

                                await logActivity(
                                  "research_generate",
                                  "Ish bo'yicha tadqiqot tayyorlandi",
                                  `"${activeCase?.title}" ishi bo'yicha AI yuridik tadqiqot natijalari olinib, ish doirasiga biriktirildi.`,
                                  activeCaseId,
                                  "Yuridik tadqiqot"
                                );

                                setCaseResearchInput("");
                                showToastMsg("Ushbu ish uchun maxsus yuridik tadqiqot yo'riqnomasi shakllantirildi!");
                              } catch (err: any) {
                                showToastMsg(err.message || "Tadqiqotda xatolik yuz berdi.", "error");
                              } finally {
                                setGeneratingCaseResearch(false);
                                setCaseResearchFeedback("");
                              }
                            }}
                            disabled={!caseResearchInput.trim() || generatingCaseResearch}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {generatingCaseResearch ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>{caseResearchFeedback || "Bajarilmoqda..."}</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Tadqiqotni ishga tushirish</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Report listing and accordion */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Ish doirasidagi tadqiqot raportlari ({caseReports.length})
                      </h4>

                      {loadingCaseReports ? (
                        <div className="py-8 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                      ) : caseReports.length > 0 ? (
                        <div className="space-y-4">
                          {caseReports.map((report) => {
                            const isExpanded = expandedReportId === report.id;
                            return (
                              <div key={report.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                                
                                {/* Header (Click to Toggle) */}
                                <div 
                                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                                  className="p-4 bg-slate-50/50 hover:bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer transition-colors"
                                >
                                  <div>
                                    <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                      {report.category || 'Umumiy'}
                                    </span>
                                    <h4 className="font-extrabold text-xs text-slate-800 leading-snug mt-1.5">
                                      {report.question}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      📅 {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                    <button 
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm("Ushbu tadqiqotni ish doirasidan butunlay olib tashlamoqchimisiz?")) {
                                          await deleteResearchReport(report.id);
                                          showToastMsg("Tadqiqot hisoboti o'chirildi.");
                                        }
                                      }}
                                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Body (Visible on active expansion) */}
                                {isExpanded && (
                                  <div className="p-5 space-y-4 text-xs text-slate-700 leading-relaxed bg-white">
                                    
                                    <div>
                                      <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5">Muammo Mazmuni:</h5>
                                      <p>{report.summary}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100">
                                        <h5 className="font-bold text-emerald-800 mb-1">Qo'llab-quvvatlovchi dalillar:</h5>
                                        <ul className="space-y-1.5 list-disc pl-4 text-[11px]">
                                          {report.supportingArguments?.map((arg, i) => <li key={i}>{arg}</li>)}
                                        </ul>
                                      </div>
                                      <div className="bg-red-50/30 p-3 rounded-xl border border-red-100">
                                        <h5 className="font-bold text-red-800 mb-1">Qarshi taraf vajlari:</h5>
                                        <ul className="space-y-1.5 list-disc pl-4 text-[11px]">
                                          {report.opposingArguments?.map((arg, i) => <li key={i}>{arg}</li>)}
                                        </ul>
                                      </div>
                                    </div>

                                    <div>
                                      <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5">Qo'llaniluvchi moddalar:</h5>
                                      <ul className="space-y-1 list-disc pl-4 text-[11px] text-slate-600">
                                        {report.principles?.map((p, i) => <li key={i}>{p}</li>)}
                                      </ul>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                      <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-bold text-slate-900">Xavf-xatar & Tavsiya etilgan qadamlar</h5>
                                        <span className="text-[10px] font-bold bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200">
                                          Xavf: {report.riskLevel}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 mb-2">{report.riskAnalysis}</p>
                                      <ul className="space-y-1 list-inside list-decimal text-[11px]">
                                        {report.strategyActions?.map((act, i) => <li key={i} className="font-medium text-slate-700">{act}</li>)}
                                      </ul>
                                    </div>

                                    <div className="flex justify-end gap-2 shrink-0 pt-2 border-t border-slate-100">
                                      <Link 
                                        to="/research" 
                                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors"
                                      >
                                        To'liq Tadqiqot xonasida ko'rish
                                        <LinkIcon className="w-3.5 h-3.5" />
                                      </Link>
                                    </div>

                                  </div>
                                )}

                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 select-none">
                          <FileText className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                          <p className="text-xs">Ushbu ish doirasida hali hech qanday tadqiqot o'tkazilmagan.</p>
                        </div>
                      )}
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        ) : (
          /* Empty Case details fallback greeting template */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/10">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-md bg-white p-8 rounded-3xl border border-gray-200/80 shadow-md flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Briefcase className="w-8 h-8" />
              </div>
              
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Case Workspace'ga xush kelibsiz
              </h2>
              
              <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-sm">
                Ish materiallarini (dalillar, yuridik hujjatlar va tahlillar) bitta intellektual papkaga birlashtiring. Analitika olish uchun chap paneldan ishni tanlang.
              </p>

              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 inline-flex items-center px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md gap-1"
              >
                <Plus className="w-4 h-4" />
                Yangi ish qo'shish
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* 3. MODAL: Register New Dispute Case */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 modal-overlay-fallback">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative"
          >
            <h2 className="text-base font-extrabold text-gray-900 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Yangi huquqiy ish ochish
            </h2>
            
            <form onSubmit={handleCreateCase} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Ish sarlavhasi (Dispute Title) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white text-xs font-semibold"
                  placeholder="Masalan: Mehnat nizosi (Ish haqi nizosi)"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Kategoriya (Category) *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white text-xs font-semibold cursor-pointer"
                >
                  <option value="">Tanlang...</option>
                  <option value="Mehnat nizosi">Mehnat nizosi</option>
                  <option value="Oila huquqi">Oila huquqi</option>
                  <option value="Fuqarolik huquqi">Fuqarolik huquqi</option>
                  <option value="Ma'muriy nizo">Ma'muriy nizo</option>
                  <option value="Jinoyat huquqi">Jinoyat ishi</option>
                  <option value="Mulk huquqi">Mulk va uy-joy</option>
                  <option value="Boshqa">Boshqa masalalar</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Hudud (Region)
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold"
                    placeholder="Toshkent sh."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Sud idorasi (Court)
                  </label>
                  <input
                    type="text"
                    value={formData.courtType}
                    onChange={(e) => setFormData({...formData, courtType: e.target.value})}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold"
                    placeholder="Fuqarolik sudi"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md"
                >
                  Ishni yaratish
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 4. TEMPLATE SELECTOR: Open document flow integrated with active caseId query */}
      {activeCase && (
        <TemplateSelector 
          isOpen={isTemplateSelectorOpen}
          onClose={() => setIsTemplateSelectorOpen(false)}
          caseId={activeCase.id}
        />
      )}

    </div>
  );
}
export default Cases;

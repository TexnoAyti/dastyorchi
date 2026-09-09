import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { callAIServer } from '../services/aiService';
import { latinToCyrillic, cyrillicToLatin } from '../utils/scriptConverter';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Briefcase, 
  BookOpen, 
  Settings2, 
  Trash2, 
  Globe, 
  FileText, 
  ArrowRightLeft, 
  Upload, 
  Clock, 
  RotateCcw, 
  Terminal, 
  AlertTriangle 
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type TabType = 'translate' | 'script' | 'history';
type ModeType = 'standard' | 'legal' | 'academic';
type LanguageType = 'uz-Latn' | 'uz-Cyrl' | 'ru' | 'en';

interface ConversionHistory {
  id: string;
  type: 'translation' | 'script_conversion';
  mode: ModeType;
  sourceLanguage: LanguageType;
  targetLanguage: LanguageType;
  sourceText: string;
  targetText: string;
  createdAt: any;
}

interface DebugLog {
  timestamp: string;
  type: 'info' | 'success' | 'error';
  message: string;
  details?: any;
}

const LANGUAGES: { id: LanguageType; name: string }[] = [
  { id: 'uz-Latn', name: "O'zbek (Lotin)" },
  { id: 'uz-Cyrl', name: "Ўзбек (Кирилл)" },
  { id: 'ru', name: "Русский" },
  { id: 'en', name: "English" },
];

const LANGUAGES_LABELS: Record<LanguageType, { uz: string; en: string }> = {
  'uz-Latn': { uz: "Ozbekcha", en: "Uzbek" },
  'uz-Cyrl': { uz: "Kirillcha", en: "Cyrillic" },
  'ru': { uz: "Ruscha", en: "Russian" },
  'en': { uz: "Inglizcha", en: "English" }
};

export function LanguageCenter() {
  const { t, language, formatDate } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('translate');
  const [mode, setMode] = useState<ModeType>('standard');
  const [sourceLang, setSourceLang] = useState<LanguageType>('uz-Latn');
  const [targetLang, setTargetLang] = useState<LanguageType>('ru');
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showLogs, setShowLogs] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync auth state explicitly
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Set up Firestore Sync when auth state becomes ready
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "conversions"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const histData: ConversionHistory[] = [];
      snapshot.forEach((d) => histData.push({ id: d.id, ...d.data() } as ConversionHistory));
      setHistory(histData);
    }, (err) => {
       console.error("Conversions history sync error:", err);
       addDebugLog('error', 'Firestore-dan o\'tmish tarixi ma\'lumotlarini yangilash muvaffaqiyatsiz tugadi.', err.message);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Logging Helper
  const addDebugLog = (type: 'info' | 'success' | 'error', message: string, details?: any) => {
    const timestamp = new Date().toLocaleTimeString('uz-UZ');
    setDebugLogs(prev => [
      { timestamp, type, message, details },
      ...prev
    ].slice(0, 50)); // cap at 50 logs to avoid leaking memory
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(targetText);
    setTargetText(sourceText);
    addDebugLog('info', `Tillar o'zaro almashtirildi: ${sourceLang} ↔ ${targetLang}`);
  };

  const getExportFilename = (type: 'original' | 'translated' | 'combined', activeMode: 'translate' | 'script') => {
    const sourceLabel = LANGUAGES_LABELS[sourceLang] || { uz: "Asl", en: "Original" };
    const targetLabel = LANGUAGES_LABELS[targetLang] || { uz: "Natija", en: "Result" };

    if (type === 'original') {
      return `${sourceLabel.uz}_Asl_Matn`;
    }

    if (type === 'translated') {
      const suffix = activeMode === 'translate' ? 'Tarjima' : 'Konversiya';
      return `${targetLabel.uz}_${suffix}`;
    }

    // Combined/bilingual version naming rules
    const hasEnglish = sourceLang === 'en' || targetLang === 'en';
    if (hasEnglish) {
      const sName = sourceLang === 'en' ? 'English' : 'Uzbek';
      const tName = targetLang === 'en' ? 'English' : 'Uzbek';
      return `${sName}_${tName}_Bilingual`;
    } else {
      return `${sourceLabel.uz}_${targetLabel.uz}_Ikki_Tilli`;
    }
  };

  const getCombinedTextFormat = () => {
    return `---

## ORIGINAL TEXT

${sourceText}

---

## TRANSLATED TEXT

${targetText}`;
  };

  const handleExport = async (docType: 'original' | 'translated' | 'combined', format: 'docx' | 'pdf' | 'txt') => {
    let textToExport = '';
    if (docType === 'original') {
      textToExport = sourceText;
    } else if (docType === 'translated') {
      textToExport = targetText;
    } else {
      textToExport = getCombinedTextFormat();
    }

    if (!textToExport.trim()) {
      alert("Hujjat matni bo'sh! Iltimos, avval matn kiriting hamda jarayonni yakunlang.");
      return;
    }

    const filename = getExportFilename(docType, activeTab === 'translate' ? 'translate' : 'script');
    addDebugLog('info', `Hujjatni yuklab olish boshlandi: ${filename}.${format} (${docType})`);

    try {
      if (format === 'txt') {
        const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `${filename}.txt`);
        addDebugLog('success', `TXT yuklab olindi: ${filename}.txt`);
      } else if (format === 'docx') {
        // Convert plain text to simple styled HTML for HTMLtoDOCX backend
        const formattedHtml = textToExport
          .split('\n')
          .map(line => line.trim() ? `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : '<p>&nbsp;</p>')
          .join('');
          
        const response = await fetch('/api/export/docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: formattedHtml })
        });
        
        if (!response.ok) {
          throw new Error("DOCX serverda eksport qilish muvaffaqiyatsiz bo'ldi.");
        }
        
        const blob = await response.blob();
        saveAs(blob, `${filename}.docx`);
        addDebugLog('success', `DOCX yuklab olindi: ${filename}.docx`);
      } else if (format === 'pdf') {
        const element = document.createElement("div");
        element.style.padding = "30px";
        element.style.fontFamily = "Times New Roman, serif";
        element.style.fontSize = "12pt";
        element.style.lineHeight = "1.6";
        element.style.color = "#121212";

        // Convert standard line-breaks to HTML breaks for PDF generator safely
        let htmlContent = textToExport
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br/>");

        // Beautify markdown headings and separators for combined PDF layout
        htmlContent = htmlContent.replace(/## (.*?)<br\/>/g, "<h2 style='font-size: 15pt; font-weight: bold; color: #1e3a8a; margin-top: 15px; margin-bottom: 8px; border-bottom: 2.5px solid #cbd5e1; padding-bottom: 4px;'>$1</h2>");
        htmlContent = htmlContent.replace(/---<br\/>/g, "<hr style='border: 0; border-top: 1px dashed #94a3b8; margin: 24px 0;' />");

        element.innerHTML = htmlContent;

        html2pdf().set({
          margin: 15,
          filename: `${filename}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save();

        addDebugLog('success', `PDF yuklab olindi: ${filename}.pdf`);
      }
    } catch (err: any) {
      console.error(err);
      addDebugLog('error', `Eksport qilishda xatolik yuz berdi.`, err.message);
      alert("Hujjatni yuklab olish muvaffaqiyatsiz bo'ldi: " + err.message);
    }
  };

  const processTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    const sourceLangName = LANGUAGES.find(l => l.id === sourceLang)?.name || sourceLang;
    const targetLangName = LANGUAGES.find(l => l.id === targetLang)?.name || targetLang;

    addDebugLog('info', 'Tarjima jarayoni boshlandi...', {
      sourceLang,
      targetLang,
      textLength: sourceText.length,
      mode
    });

    try {
      let systemInstruction = `You are an expert professional translator. Translate the given text from ${sourceLangName} to ${targetLangName}. `;

      if (mode === 'legal') {
        systemInstruction += `This is a LEGAL translation. You MUST:
- Preserve all article numbers exactly (e.g. Article 310, Modda 310, Статья 310).
- Preserve exact legal terminology and formatting.
- Preserve court references, names, dates, juridical names, and amounts without altering them.
- Maintain a strict professional corporate/judicial formal tone.`;
      } else if (mode === 'academic') {
        systemInstruction += `This is an ACADEMIC translation. You MUST:
- Strictly maintain academic citations, references, bibliographical records and numbering.
- Use academic, scholarly, high-precision terminology.`;
      }

      addDebugLog('info', 'Gemini API-ga so\'rov yuborilmoqda...', { systemInstruction });

      const response = await callAIServer({
        contents: [{ role: 'user', parts: [{ text: sourceText }] }],
        systemInstruction: systemInstruction,
        config: { temperature: 0.2 }
      });

      addDebugLog('success', 'Gemini API-dan javob qabul qilindi!', { responseLength: response?.length });

      if (!response) {
        throw new Error("Tarjimadan bo'sh kontent qaytdi.");
      }

      setTargetText(response);
      addDebugLog('info', 'Tarjima tarixi saqlanmoqda...');
      await saveHistory('translation', response);
      addDebugLog('success', 'Tarjima muvaffaqiyatli yakunlandi hamda tarixga saqlandi.');

    } catch (error: any) {
      console.error("[Translation Error]", error);
      const friendlyError = error?.message || "Tizim ulanishida yoki tarjima API-sida kutilmagan xatolik yuz berdi.";
      setErrorMsg(friendlyError);
      addDebugLog('error', 'Tarjima muvaffaqiyatsiz yakunlandi.', friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const processScriptConversion = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    addDebugLog('info', 'Yozuv skriptini o\'zgartirish jarayoni boshlandi...', {
      sourceLang,
      targetLang,
      textLength: sourceText.length
    });

    try {
      let result = '';
      if (sourceLang === 'uz-Latn' && targetLang === 'uz-Cyrl') {
        result = latinToCyrillic(sourceText);
        addDebugLog('success', 'Lotin alifbosidan Kirill alifbosiga muvaffaqiyatli o\'tkazildi.');
      } else if (sourceLang === 'uz-Cyrl' && targetLang === 'uz-Latn') {
        result = cyrillicToLatin(sourceText);
        addDebugLog('success', 'Kirill alifbosidan Lotin alifbosiga muvaffaqiyatli o\'tkazildi.');
      } else {
        result = sourceText;
        addDebugLog('info', 'Manba va maqsad va yozuv turlari bir xil. Matn nusxalandi.');
      }

      setTargetText(result);
      addDebugLog('info', 'Konversiya tarixi saqlanmoqda...');
      await saveHistory('script_conversion', result);
      addDebugLog('success', 'Konversiya tarixi muvaffaqiyatli saqlandi.');
    } catch (error: any) {
      console.error("[Script Conversion Error]", error);
      const friendlyError = error?.message || "Skript (alifbo) konversiyasida xatolik yuz berdi.";
      setErrorMsg(friendlyError);
      addDebugLog('error', 'Konversiya amalga oshmadi.', friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = () => {
    if (activeTab === 'translate') {
      processTranslate();
    } else if (activeTab === 'script') {
      processScriptConversion();
    }
  };

  const handleRefresh = () => {
    if (!sourceText.trim()) {
      addDebugLog('info', 'Manba matni kiritilmagani sababli qayta yangilash to\'xtatildi.');
      return;
    }
    addDebugLog('info', 'Hozirgi tarjima holatini qaytadan yangilamoqdasiz...');
    handleProcess();
  };

  const handleReset = () => {
    setSourceText('');
    setTargetText('');
    setErrorMsg(null);
    setCopied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setDebugLogs([]);
    addDebugLog('info', 'Barcha tarjima holatlari, yuklangan fayllar va hisobotlar tozalandi.');
  };

  const saveHistory = async (type: 'translation' | 'script_conversion', resultText: string) => {
    if (!auth.currentUser) {
      addDebugLog('info', 'Foydalanuvchi hisobi aniqlanmadi, tarix saqlanmadi.');
      return;
    }
    try {
      await addDoc(collection(db, 'conversions'), {
        userId: auth.currentUser.uid,
        type,
        mode,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        sourceText,
        targetText: resultText,
        createdAt: serverTimestamp()
      });
      addDebugLog('success', 'Firestore tizimida yangi o\'tmish yozuvi yaratildi.');
    } catch (error: any) {
      console.error("Failed to save history: ", error);
      addDebugLog('error', 'Firestore tarix bazasiga yozishda xatolik yuz berdi.', error.message);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      if (file.name.endsWith('.txt')) {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      } else if (file.name.endsWith('.docx')) {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
      } else if (file.name.endsWith('.pdf')) {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullText += pageText + '\n\n';
            }
            resolve(fullText);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error("Format qabul qilinmadi. Faqat .txt, .docx yoki .pdf fayllarini ko'tarishingiz mumkin."));
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setErrorMsg(null);
    addDebugLog('info', `Yangi fayl yuklandi: ${file.name} (${file.size} bayt). Kontent o'qilmoqda...`);
    try {
      const text = await extractTextFromFile(file);
      setSourceText(text);
      addDebugLog('success', `Fayl muvaffaqiyatli o'qildi. (${text.length} ta belgi)`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Faylni o'qiy olmadim: " + err.message);
      addDebugLog('error', 'Faylni o\'qish barbod bo\'ldi.', err.message);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopy = async () => {
    if (targetText) {
      await navigator.clipboard.writeText(targetText);
      setCopied(true);
      addDebugLog('success', 'Natija matni xotiraga nusxalandi.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteDoc(doc(db, "conversions", id));
      addDebugLog('success', 'Tarix yozuvi muvaffaqiyatli o\'chirildi.', `ID: ${id}`);
    } catch (err: any) {
      console.error("Xatolik", err);
      addDebugLog('error', 'Tarix yozuvini o\'chirishda Firestore xatoligi yuz berdi.', err.message);
    }
  };

  const restoreHistory = (item: ConversionHistory) => {
    setSourceLang(item.sourceLanguage);
    setTargetLang(item.targetLanguage);
    setSourceText(item.sourceText);
    setTargetText(item.targetText);
    setMode(item.mode);
    setActiveTab(item.type === 'translation' ? 'translate' : 'script');
    addDebugLog('info', 'Tarixdan matnlar tiklandi va muhitga yuklandi.', { id: item.id });
  };

  const filteredSourceLangs = activeTab === 'script' ? LANGUAGES.filter(l => l.id === 'uz-Latn' || l.id === 'uz-Cyrl') : LANGUAGES;
  const filteredTargetLangs = activeTab === 'script' ? LANGUAGES.filter(l => l.id === 'uz-Latn' || l.id === 'uz-Cyrl') : LANGUAGES;

  useEffect(() => {
    if (activeTab === 'script') {
       if (sourceLang !== 'uz-Latn' && sourceLang !== 'uz-Cyrl') setSourceLang('uz-Latn');
       if (targetLang !== 'uz-Latn' && targetLang !== 'uz-Cyrl') setTargetLang('uz-Cyrl');
    }
  }, [activeTab]);

  return (
    <div className="flex-1 bg-slate-50 flex flex-col p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Header Block with Premium Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-6.5 h-6.5 text-blue-600" />
              {language === 'uz_lat' ? 'Til va Yozuv Markazi' : language === 'uz_cyr' ? 'Тил ва Ёзув Маркази' : language === 'ru' ? 'Языковой и Шрифтовой Центр' : 'Language & Script Center'}
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
              {language === 'uz_lat' 
                ? 'Yuridik, ilmiy hamda biznes hujjatlari uchun yuqori aniqlikdagi professional tarjima hamda yozuv konvertatsiyasi.' 
                : language === 'uz_cyr'
                ? 'Юридик, илмий ҳамда бизнес ҳужжатлари учун юқори аниқликдаги профессионал таржима ҳамда ёзув конвертацияси.'
                : language === 'ru'
                ? 'Высокоточный профессиональный перевод и конвертация шрифтов для юридических, научных и деловых документов.'
                : 'High-precision professional translation and script conversion for legal, academic, and business documents.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={isLoading || !sourceText}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all shadow-xs"
              title={language === 'uz_lat' ? 'Tarjimani qayta ishlash' : language === 'uz_cyr' ? 'Таржимани қайта ишлаш' : language === 'ru' ? 'Обновить перевод' : 'Refine processing'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {language === 'uz_lat' ? 'Yangilash' : language === 'uz_cyr' ? 'Янгилаш' : language === 'ru' ? 'Обновить' : 'Refresh'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50/50 transition-all shadow-xs"
              title={language === 'uz_lat' ? 'Tozalash' : language === 'uz_cyr' ? 'Тозалаш' : language === 'ru' ? 'Очистить всё' : 'Reset state'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {language === 'uz_lat' ? 'Tozalash' : language === 'uz_cyr' ? 'Тозалаш' : language === 'ru' ? 'Сбросить' : 'Reset'}
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5 p-1 bg-slate-200/60 rounded-xl max-w-md">
          <button 
            onClick={() => setActiveTab('translate')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'translate' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> {language === 'uz_lat' ? 'Tarjima' : language === 'uz_cyr' ? 'Таржима' : language === 'ru' ? 'Перевод' : 'Translation'}
          </button>
          <button 
            onClick={() => setActiveTab('script')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'script' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> {language === 'uz_lat' ? 'Lotin ↔ Kirill' : language === 'uz_cyr' ? 'Лотин ↔ Кирилл' : language === 'ru' ? 'Латиница ↔ Кириллица' : 'Latin ↔ Cyrillic'}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> {language === 'uz_lat' ? 'Tarix' : language === 'uz_cyr' ? 'Тарих' : language === 'ru' ? 'История' : 'History'}
          </button>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-800">{t.common.error}</h4>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-700 font-bold text-xs">OK</button>
          </div>
        )}

        {activeTab !== 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Toolbar parameters */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-2.5">
                <select 
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value as LanguageType)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none shadow-xs cursor-pointer"
                >
                  {filteredSourceLangs.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>

                <button 
                  onClick={handleSwapLanguages}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 bg-white"
                  title="Swap languages"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>

                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as LanguageType)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none shadow-xs cursor-pointer"
                >
                  {filteredTargetLangs.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {activeTab === 'translate' && (
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-slate-200 self-start sm:self-auto bg-slate-100">
                  <button
                    onClick={() => setMode('standard')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'standard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {language === 'uz_lat' ? 'Standart' : language === 'uz_cyr' ? 'Стандарт' : language === 'ru' ? 'Стандартный' : 'Standard'}
                  </button>
                  <button
                    onClick={() => setMode('legal')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${mode === 'legal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-indigo-600'}`}
                  >
                    <Briefcase className="w-3.5 h-3.5" /> {language === 'uz_lat' ? 'Yuridik tahlil (Legal)' : language === 'uz_cyr' ? 'Юридик таҳлил (Legal)' : language === 'ru' ? 'Юридический' : 'Legal Specialty'}
                  </button>
                  <button
                    onClick={() => setMode('academic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${mode === 'academic' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-600'}`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> {language === 'uz_lat' ? 'Ilmiy (Academic)' : language === 'uz_cyr' ? 'Илмий (Academic)' : language === 'ru' ? 'Академический' : 'Academic Research'}
                  </button>
                </div>
              )}
            </div>

            {/* Editing Dual columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 min-h-[420px]">
              
              {/* SOURCE PANEL */}
              <div className="flex flex-col">
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{language === 'uz_lat' ? 'Asl matn' : language === 'uz_cyr' ? 'Асл матн' : language === 'ru' ? 'Исходный текст' : 'Source text'} ({LANGUAGES.find(l => l.id === sourceLang)?.name})</span>
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={language === 'uz_lat' ? 'Matn kiriting yoki bu yerga hujjatingizni yozib qoldiring...' : language === 'uz_cyr' ? 'Матн киритинг ёки бу ерга ҳужжатингизни ёзиб қолдиринг...' : language === 'ru' ? 'Введите текст или вставьте документ здесь...' : 'Type or upload your reference text here...'}
                    className="w-full flex-1 min-h-[250px] resize-none outline-none text-slate-800 text-sm leading-relaxed bg-transparent"
                  />
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      accept=".txt,.doc,.docx,.pdf" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
                      title="TXT, DOCX yoki PDF hujjatni ochish"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" /> {language === 'uz_lat' ? 'Hujjat yuklash' : language === 'uz_cyr' ? 'Ҳужжат юклаш' : language === 'ru' ? 'Загрузить файл' : 'Upload Document'}
                    </button>
                    {(activeTab === 'translate' && mode === 'legal') && (
                      <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-wider flex items-center bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                        <Briefcase className="w-3 h-3 mr-1" /> {language === 'uz_lat' ? 'Legal terminlar yoqilgan' : language === 'uz_cyr' ? 'Legal терминлар ёқилган' : language === 'ru' ? 'Юр. термины активны' : 'Legal jargon activated'}
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleProcess}
                    disabled={isLoading || !sourceText.trim()}
                    className="flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-200"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      activeTab === 'translate' ? <Globe className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    {activeTab === 'translate' 
                      ? (language === 'uz_lat' ? 'Tarjima qilish' : language === 'uz_cyr' ? 'Таржима қилиш' : language === 'ru' ? 'Перевести' : 'Translate content') 
                      : (language === 'uz_lat' ? 'Alifboga o\'tkazish' : language === 'uz_cyr' ? 'Алифбога ўтказиш' : language === 'ru' ? 'Конвертировать' : 'Transliterate text')}
                  </button>
                </div>
              </div>

              {/* TARGET PANEL */}
              <div className="flex flex-col bg-slate-50/20">
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{language === 'uz_lat' ? 'Natija' : language === 'uz_cyr' ? 'Натижа' : language === 'ru' ? 'Результат' : 'Result Output'} ({LANGUAGES.find(l => l.id === targetLang)?.name})</span>
                  {isLoading ? (
                    <div className="w-full flex-1 min-h-[250px] flex items-center justify-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
                        <span className="text-xs font-bold text-slate-500 tracking-wider">
                          {language === 'uz_lat' ? 'Tahlil qilinmoqda...' : language === 'uz_cyr' ? 'Таҳлил қилинмоқда...' : language === 'ru' ? 'Обработка данных...' : 'Analyzing contents...'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={targetText}
                      onChange={(e) => setTargetText(e.target.value)}
                      placeholder={language === 'uz_lat' ? 'Natija matni ko\'rsatiladi...' : language === 'uz_cyr' ? 'Натижа матни кўрсатилади...' : language === 'ru' ? 'Здесь появится готовый результат...' : 'Result text will appear here...'}
                      className="w-full flex-1 min-h-[250px] resize-none outline-none text-slate-800 text-sm leading-relaxed bg-transparent"
                    />
                  )}
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {targetText && (
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        {copied 
                          ? (language === 'uz_lat' ? 'Nusxalandi' : language === 'uz_cyr' ? 'Нусхаланди' : language === 'ru' ? 'Скопировано' : 'Copied!') 
                          : (language === 'uz_lat' ? 'Nusxalash' : language === 'uz_cyr' ? 'Нусхалаш' : language === 'ru' ? 'Копировать' : 'Copy selection')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* ADVANCED EXPORTS GRID: Displays when output text exists */}
            {targetText && (
              <div className="bg-slate-50 p-5 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5 text-blue-600" /> {language === 'uz_lat' ? 'Yuklab olish va eksport qilish bo\'limi' : language === 'uz_cyr' ? 'Юклаб олиш ва экспорт қилиш бўлими' : language === 'ru' ? 'Раздел загрузки и экспорта' : 'Download & Export Hub'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* ORIGINAL COLUMN */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <span className="block text-xs font-extrabold text-slate-800 mb-2">{language === 'uz_lat' ? 'Asl hujjat' : language === 'uz_cyr' ? 'Асл ҳужжат' : language === 'ru' ? 'Исходный документ' : 'Source Document'}</span>
                    <p className="text-[11px] text-slate-500 mb-3">{language === 'uz_lat' ? 'Kiritilgan til:' : language === 'uz_cyr' ? 'Киритилган тил:' : language === 'ru' ? 'Исходный язык:' : 'Source language:'} {LANGUAGES.find(l => l.id === sourceLang)?.name}</p>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => handleExport('original', 'docx')} className="flex items-center justify-between text-left px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                        <span>Word Format (DOCX)</span>
                        <span className="text-[10px] text-blue-600 font-extrabold">DOCX</span>
                      </button>
                      <button onClick={() => handleExport('original', 'pdf')} className="flex items-center justify-between text-left px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                        <span>{language === 'uz_lat' ? 'Eksport PDF' : language === 'uz_cyr' ? 'Экспорт PDF' : language === 'ru' ? 'Экспорт PDF' : 'Save PDF'}</span>
                        <span className="text-[10px] text-rose-600 font-extrabold">PDF</span>
                      </button>
                      <button onClick={() => handleExport('original', 'txt')} className="flex items-center justify-between text-left px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                        <span>{language === 'uz_lat' ? 'Oddiy matn (TXT)' : language === 'uz_cyr' ? 'Оддий матн (TXT)' : language === 'ru' ? 'Обычный текст (TXT)' : 'Plain text (TXT)'}</span>
                        <span className="text-[10px] text-slate-500 font-extrabold">TXT</span>
                      </button>
                    </div>
                  </div>

                  {/* TRANSLATED COLUMN */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <span className="block text-xs font-extrabold text-slate-800 mb-2">
                      {activeTab === 'translate' 
                        ? (language === 'uz_lat' ? 'Tarjima' : language === 'uz_cyr' ? 'Таржима' : language === 'ru' ? 'Перевод' : 'Translation') 
                        : (language === 'uz_lat' ? 'Konversiya' : language === 'uz_cyr' ? 'Конвертация' : language === 'ru' ? 'Конвертация' : 'Conversion')}
                    </span>
                    <p className="text-[11px] text-slate-500 mb-3">{language === 'uz_lat' ? 'Natija tili:' : language === 'uz_cyr' ? 'Натижа тили:' : language === 'ru' ? 'Выходной язык:' : 'Target language:'} {LANGUAGES.find(l => l.id === targetLang)?.name}</p>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => handleExport('translated', 'docx')} className="flex items-center justify-between text-left px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                        <span>Word Format (DOCX)</span>
                        <span className="text-[10px] text-blue-600 font-extrabold">DOCX</span>
                      </button>
                      <button onClick={() => handleExport('translated', 'pdf')} className="flex items-center justify-between text-left px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                        <span>{language === 'uz_lat' ? 'Eksport PDF' : language === 'uz_cyr' ? 'Экспорт PDF' : language === 'ru' ? 'Экспорт PDF' : 'Save PDF'}</span>
                        <span className="text-[10px] text-rose-600 font-extrabold">PDF</span>
                      </button>
                      <button onClick={() => handleExport('translated', 'txt')} className="flex items-center justify-between text-left px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                        <span>{language === 'uz_lat' ? 'Oddiy matn (TXT)' : language === 'uz_cyr' ? 'Оддий матн (TXT)' : language === 'ru' ? 'Обычный текст (TXT)' : 'Plain text (TXT)'}</span>
                        <span className="text-[10px] text-slate-500 font-extrabold">TXT</span>
                      </button>
                    </div>
                  </div>

                  {/* COMBINED/BILINGUAL COLUMN */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <span className="block text-xs font-extrabold text-slate-800 mb-2">{language === 'uz_lat' ? 'Ikki tilli (Bilingual)' : language === 'uz_cyr' ? 'Икки тилли (Bilingual)' : language === 'ru' ? 'Двуязычный (Bilingual)' : 'Bilingual Mode'}</span>
                    <p className="text-[11px] text-slate-500 mb-3">{language === 'uz_lat' ? 'Asl + Natija (Ketma-ket)' : language === 'uz_cyr' ? 'Асл + Натижа (Кетма-кет)' : language === 'ru' ? 'Оригинал + Результат' : 'Source + Target text sequence'}</p>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => handleExport('combined', 'docx')} className="flex items-center justify-between text-left px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                        <span>Word Format (DOCX)</span>
                        <span className="text-[10px] text-blue-600 font-extrabold">DOCX</span>
                      </button>
                      <button onClick={() => handleExport('combined', 'pdf')} className="flex items-center justify-between text-left px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                        <span>{language === 'uz_lat' ? 'Eksport PDF' : language === 'uz_cyr' ? 'Экспорт PDF' : language === 'ru' ? 'Экспорт PDF' : 'Save PDF'}</span>
                        <span className="text-[10px] text-rose-600 font-extrabold">PDF</span>
                      </button>
                      <button onClick={() => handleExport('combined', 'txt')} className="flex items-center justify-between text-left px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                        <span>Oddiy Matn (TXT)</span>
                        <span className="text-[10px] text-slate-500 font-extrabold">TXT</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* Real-time Translator Debugger Logs Console */}
        {activeTab === 'translate' && (
          <div className="bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 shadow-xl overflow-hidden mt-4">
            <button 
              onClick={() => setShowLogs(!showLogs)} 
              className="w-full text-left p-3.5 bg-slate-950 flex items-center justify-between hover:bg-slate-900 transition-colors border-b border-slate-800"
            >
              <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                {language === 'uz_lat' ? 'Dasturchi Konsoli & Tarjima Jurnali' : language === 'uz_cyr' ? 'Дастурчи Консоли & Таржима Журнали' : language === 'ru' ? 'Консоль Разработчика и Логи' : 'Developer Console & Processing Logs'}
              </span>
              <span className="text-xs font-semibold text-slate-500 hover:text-slate-300">
                {showLogs 
                  ? (language === 'uz_lat' ? 'Yashirish' : language === 'uz_cyr' ? 'Яшириш' : language === 'ru' ? 'Скрыть' : 'Hide') 
                  : (language === 'uz_lat' ? 'Ko\'rsatish' : language === 'uz_cyr' ? 'Кўрсатиш' : language === 'ru' ? 'Показать' : 'Show')}
              </span>
            </button>
            
            {showLogs && (
              <div className="p-4 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto divide-y divide-slate-800/50">
                {debugLogs.length === 0 ? (
                  <p className="text-slate-500 p-2 italic text-center">
                    {language === 'uz_lat' ? 'Konsolda hozircha jurnallar mavjud emas.' : language === 'uz_cyr' ? 'Консолда ҳозирча журналлар мавजूद эмас.' : language === 'ru' ? 'В консоли пока нет логов.' : 'Console is currently clean.'}
                  </p>
                ) : (
                  debugLogs.map((log, idx) => (
                    <div key={idx} className="py-2 flex items-start gap-3">
                      <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                      <span className={`font-bold shrink-0 uppercase tracking-wide text-[9px] px-1 rounded-sm ${
                        log.type === 'error' ? 'bg-red-500/20 text-red-400' :
                        log.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {log.type}
                      </span>
                      <div className="flex-1">
                        <p className={log.type === 'error' ? 'text-red-400 font-bold' : log.type === 'success' ? 'text-emerald-300' : 'text-slate-300'}>
                          {log.message}
                        </p>
                        {log.details && (
                          <pre className="mt-1 p-2 bg-slate-950/50 rounded text-slate-400 overflow-x-auto text-[10px]">
                            {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* History Tab Overview */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  {language === 'uz_lat' ? 'Konversiyalar Jurnali' : language === 'uz_cyr' ? 'Конвертациялар Журнали' : language === 'ru' ? 'Журнал конвертаций' : 'Conversions Logs History'}
                </h3>
             </div>
             
             <div className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Clock className="w-9 h-9 mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-slate-700">
                      {language === 'uz_lat' ? 'Tarix jurnali bo\'sh' : language === 'uz_cyr' ? 'Тарих журнали бўш' : language === 'ru' ? 'История пуста' : 'No history yet'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'uz_lat' ? 'Siz qilgan barcha tarjimalar shu erda jamlanadi.' : language === 'uz_cyr' ? 'Сиз қилган барча таржималар шу ерда жамланади.' : language === 'ru' ? 'Здесь будут отображаться ваши переводы.' : 'Your processed entries are securely stored here.'}
                    </p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                             item.type === 'translation' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                           }`}>
                             {item.type === 'translation' 
                               ? (language === 'uz_lat' ? 'Tarjima' : language === 'uz_cyr' ? 'Таржима' : language === 'ru' ? 'Перевод' : 'Translation')
                               : (language === 'uz_lat' ? 'Yozuv' : language === 'uz_cyr' ? 'Ёзув' : language === 'ru' ? 'Шрифт' : 'Script')}
                           </span>
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                             item.mode === 'legal' ? 'bg-indigo-100 text-indigo-800' : 
                             item.mode === 'academic' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                           }`}>
                             {item.mode}
                           </span>
                           <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 rounded-xl py-0.5 flex items-center gap-1.5 border border-slate-200">
                             {LANGUAGES.find(l => l.id === item.sourceLanguage)?.name || item.sourceLanguage}
                             <ArrowRightLeft className="w-3 h-3" />
                             {LANGUAGES.find(l => l.id === item.targetLanguage)?.name || item.targetLanguage}
                           </span>
                         </div>
                         <p className="text-sm text-slate-700 truncate max-w-2xl font-bold mt-2">
                           {item.sourceText.substring(0, 100)}{item.sourceText.length > 100 ? '...' : ''}
                         </p>
                       </div>
                       
                       <div className="flex items-center gap-2 shrink-0">
                         <button 
                           onClick={() => restoreHistory(item)}
                           className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:border-slate-300 text-slate-700 shadow-xs"
                         >
                           {language === 'uz_lat' ? 'Qayta tiklash' : language === 'uz_cyr' ? 'Қайта тиклаш' : language === 'ru' ? 'Восстановить' : 'Restore'}
                         </button>
                        <button 
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                          title="Hujjatni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

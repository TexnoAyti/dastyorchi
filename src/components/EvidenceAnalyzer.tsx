import { useState, useEffect, useRef } from "react";
import { 
  FileUp, Loader2, Sparkles, AlertTriangle, ShieldCheck, 
  TrendingUp, ClipboardList, Trash2, Download, Info, CheckCircle, 
  ShieldAlert, Activity, FileSpreadsheet, Eye, ChevronRight
} from "lucide-react";
import { db } from "../firebase";
import { collection, doc, addDoc, getDocs, setDoc, query, orderBy, limit } from "firebase/firestore";
import { callAIServer } from "../services/aiService";
import { saveAs } from "file-saver";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { classifyError } from "../utils/errorFriendly";

// Standardize PDF.js worker CDN for inline extraction
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function splitTextIntoChunks(text: string, maxChunkSize = 50000, overlap = 5000): string[] {
  const chunks: string[] = [];
  let index = 0;
  while (index < text.length) {
    const end = Math.min(index + maxChunkSize, text.length);
    const chunk = text.substring(index, end);
    chunks.push(chunk);
    if (end === text.length) {
      break;
    }
    index += maxChunkSize - overlap;
  }
  return chunks;
}

interface EvidenceAnalyzerProps {
  caseId: string;
  userId: string;
  caseTitle: string;
}

export function EvidenceAnalyzer({ caseId, userId, caseTitle }: EvidenceAnalyzerProps) {
  const [files, setFiles] = useState<{ id: string; name: string; type: string; base64?: string; text?: string; size: number }[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"analysis" | "risks" | "probability" | "actions">("analysis");
  const [report, setReport] = useState<any | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [metrics, setMetrics] = useState<any | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing report history for this case on mount
  useEffect(() => {
    async function loadLatestReport() {
      setLoadingHistory(true);
      addLog("Mavjud tahlillar tarixi tekshirilmoqda...");
      try {
        const reportsRef = collection(db, "cases", caseId, "evidenceReports");
        const q = query(reportsRef, orderBy("createdAt", "desc"), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          setReport(docData);
          addLog("Muvaffaqiyatli saqlangan oxirgi AI ekspertiza hisoboti yuklandi.");
        } else {
          addLog("Ushbu ish uchun hali hech qanday dalillar tahlili o'tkazilmagan.");
        }
      } catch (err: any) {
        addLog(`Tarixni yuklashda kichik xatolik: ${err.message}`);
      } finally {
        setLoadingHistory(false);
      }
    }
    if (caseId) {
      loadLatestReport();
    }
  }, [caseId]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const saveMetricsToFirestore = async (metricRec: any) => {
    try {
      const metricsRef = collection(db, "cases", caseId, "analysisMetrics");
      await addDoc(metricsRef, metricRec);
      console.log("Analysis metrics recorded successfully:", metricRec);
    } catch (err) {
      console.error("Failed to record analysis metrics:", err);
    }
  };

  // Helper to convert File to Base64 in Browser
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result as string;
        // Strip out metadata prefix for Gemini API payload compatibility
        if (encoded.includes(",")) {
          encoded = encoded.split(",")[1];
        }
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Document Content Parser (TXT, DOCX, PDF)
  const extractTextContent = async (file: File, type: string): Promise<string> => {
    if (type === "txt") {
      return await file.text();
    } else if (type === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || "";
    } else if (type === "pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let textContent = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textObj = await page.getTextContent();
          const pageText = textObj.items.map((item: any) => item.str).join(" ");
          textContent += pageText + "\n";
        }
        
        const hasAlphaNumeric = /[a-zA-Z0-9\u0400-\u04FF]/.test(textContent);
        if (!textContent.trim() || !hasAlphaNumeric) {
          return "PDF contains no extractable text. OCR processing required.";
        }
        return textContent;
      } catch (err) {
        console.error("PDF parsing error:", err);
        return "PDF contains no extractable text. OCR processing required.";
      }
    }
    return "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploadedFiles = Array.from(e.target.files);
    addLog(`${uploadedFiles.length} ta dalil hujjati tanlandi. Yuklanmoqda...`);

    for (const f of uploadedFiles) {
      const extension = f.name.split(".").pop()?.toLowerCase() || "";
      const isImage = ["png", "jpg", "jpeg", "webp"].includes(extension);
      const isDoc = ["txt", "docx", "pdf"].includes(extension);

      if (!isImage && !isDoc) {
        addLog(`Ogohlantirish: "${f.name}" qo'llab-quvvatlanmaydigan kengaytma. Faqat PDF, DOCX, TXT va Rasmlar ruxsat etiladi.`);
        continue;
      }

      try {
        let base64Data: string | undefined;
        let parsedText: string | undefined;

        if (isImage) {
          base64Data = await getBase64(f);
        } else {
          parsedText = await extractTextContent(f, extension);
        }

        const newFile = {
          id: Math.random().toString(36).substring(7),
          name: f.name,
          type: extension,
          base64: base64Data,
          text: parsedText,
          size: f.size
        };

        setFiles(prev => [...prev, newFile]);
        addLog(`Yuklandi va tayyorlandi: ${f.name} (${Math.round(f.size / 1024)} KB)`);
      } catch (err: any) {
        addLog(`Faylni o'qishda xatolik: "${f.name}" - ${err.message}`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string, name: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    addLog(`Fayl olib tashlandi: ${name}`);
  };

  const clearAllFiles = () => {
    setFiles([]);
    addLog("Barcha tanlangan dalil fayllari ro'yxatdan o'chirildi.");
  };

  // Run Real Gemini Analysis on the Collected Evidence with Self-Healing Chunking
  const runAiAnalysis = async () => {
    if (files.length === 0) {
      addLog("Xatolik: Tahlilni boshlash uchun kamida bitta dalil yuklanishi lozim!");
      alert("Iltimos, avvalo biror dalil faylini (PDF, DOCX, TXT yoki Rasm) yuklang!");
      return;
    }

    setAnalyzing(true);
    setMetrics(null);
    addLog("Dalillarni tahlil qilish jarayoni boshlandi...");

    let combinedText = "";
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp"
    };

    const imageParts: any[] = [];

    files.forEach((f, idx) => {
      if (f.text) {
        combinedText += `\n\n--- DALIL HUJJATI #${idx + 1}: ${f.name} ---\n${f.text}\n`;
      } else if (f.base64) {
        const extension = f.type;
        imageParts.push({
          inlineData: {
            mimeType: mimeTypes[extension] || "image/jpeg",
            data: f.base64
          }
        });
        combinedText += `\n\n[RASMLI MULTIMEDIAL DALIL #${idx + 1}: ${f.name} (Tahlil qilinuvchi rasm ilova qilindi)]\n`;
      }
    });

    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const textLength = combinedText.length;
    const estimatedTokens = Math.ceil(textLength / 4);
    const startTime = Date.now();

    // Proactive chunking activation 
    const threshold = 70000;
    const shouldChunkProactively = textLength > threshold;

    const performFlow = async (useChunkMode: boolean) => {
      if (useChunkMode) {
        addLog(`Hujjatlarning umumiy matn o'lchami ruxsat etilgan me'yoriy o'lchamdan katta (${textLength} belgi, ~${estimatedTokens} token).`);
        addLog("Tizim hujjatlarni avtomatik ravishda qismlarga bo'lib (Chunking) alohida tahlil qilmoqda...");

        const chunks = splitTextIntoChunks(combinedText, 50000, 5000);
        addLog(`Matn muvaffaqiyatli ravishda ${chunks.length} ta alohida tahlil qismiga ajratildi.`);

        const intermediateAnalyses: string[] = [];

        for (let i = 0; i < chunks.length; i++) {
          addLog(`Qismli tahlil boshlandi: Bo'lak #${i + 1}/${chunks.length} yuborilmoqda...`);
          const chunkStartTime = Date.now();

          const chunkPrompt = `
            Quyida ko'rilayotgan yuridik ish materialining bir qismi (${i + 1}-bo'lak, jami ${chunks.length} tadan) keltirilgan.
            Ushbu bo'lamdagi yuridik dalillar guruhlari, nuqsonlar, qarama-qarshiliklar va xavflarni alohida tahlil qiling:

            Matn qismi:
            "${chunks[i]}"

            Vazifa: Ushbu qismdagi faktlarni tahlil qiling va quyidagi sohalar bo'yicha tahrir ko'rinishida o'zbek tilida yozib bering:
            - Kuchli huquqiy dalillar (Strong points)
            - O'rtacha kuchdagi dalillar (Medium points)
            - Zaif huquqiy yoki protsessual dalillar (Weak points)
            - Etishmayotgan hujjatlar yoki dalillar bo'shliqlari (Missing)
            - Hujjatlar orasidagi zid kelish va tahrirlar (Contradictions)
            - Kutilayotgan protsessual yoki moddiy xavflar (Complex Risks)
            - Tegishli moddalar yoki yuridik normalar (Laws referenced)

            Ushbu tahlillar keyinchalik bitta yaxlit hisobotga birlashtiriladi. Shunga ko'ra faqatgina tahrir matnlarini qaytaring.
          `;

          const chunkResponse = await callAIServer({
            contents: [{ role: "user", parts: [{ text: chunkPrompt }] }],
            systemInstruction: "Siz professional va oliy toifali yuridik tahlilchisiz. Berilgan yuridik ish hujjati qismini sinchkovlik bilan tahlil qilasiz.",
            config: {
              temperature: 0.1
            }
          });

          intermediateAnalyses.push(`--- Bo'lak #${i + 1} Tahlili ---\n${chunkResponse}`);
          addLog(`Bo'lak #${i + 1} tahlili yakunlandi. Davomiyligi: ${((Date.now() - chunkStartTime) / 1000).toFixed(1)} soniya.`);
        }

        addLog("Barcha qismlar tahlil qilindi. Birlashtirilgan va sintezlangan yakuniy yuridik hisobot (JSON) yaratilmoqda...");

        const synthesisPrompt = `
          Sizga yuridik ish materiallarining alohida qismlaridan olingan tahlillar keltirilgan.
          Ushbu tahlillarni va ashyolarni bir-biri bilan solishtirib, bitta mukammal, yaxlit va tizimli tahlil hisoboti shakllantirishingiz shart.

          Ish nomi: "${caseTitle}"

          Barcha qismlardan yig'ilgan tahlil materiallari:
          ${intermediateAnalyses.join("\n\n")}

          Siz ushbu ma'lumotlarni o'zaro muvofiqlashtirib, quyidagi JSON formatdagi yuridik ekspertiza tahlilini qaytarishingiz shart.

          Muhim qoidalar:
          1. Qaytarilgan JSON ob'ekti to'liq va xatosiz bo'lishi, unda hech qanday izoh yoki markdown formatlash darchasi bo'lmasligi lozim!
          2. Tavsiflar va tahlillar nihoyatda batafsil bo'lsin.
          3. Matnlar faqat o'zbek tilida (Lotin) yozilgan bo'lishi lozim.

          JSON formati shakli exactly mana bunday bo'lishi shart:
          {
            "analysis": {
              "strongEvidence": ["birlashtirilgan barcha kuchli dalillar tavsiflari batafsil", "..."],
              "mediumEvidence": ["birlashtirilgan o'rtacha dalillar...", "..."],
              "weakEvidence": ["birlashtirilgan zaif dalillar...", "..."],
              "missingEvidence": ["birlashtirilgan yetishmayotgan hujjatlar...", "..."],
              "contradictions": ["hujjatlar orasidagi topilgan barcha real yoki mantiqiy qarama-qarshiliklar...", "..."],
              "potentialRisks": ["umumiy kutiluvchi yuridik va protsessual xavflar...", "..."]
            },
            "winProbability": {
              "score": 65,
              "confidence": "High" or "Medium" or "Low",
              "disclaimer": "Ushbu ko'rsatkich yuridik dalillarga asoslangan taxminiy AI tahlili bo'lib, rasmiy yuridik maslahat o'rnini bosa olmaydi."
            },
            "riskMatrix": [
              { "id": "risk1", "level": "High" or "Medium" or "Low", "description": "Xavf tavsifi", "impact": "Ta'sir tafsiloti", "mitigation": "Yumshatish rejasi va choralari" }
            ],
            "opponentAnalysis": {
              "counterarguments": ["raqib tomonidan keltirilishi mumkin bo'lgan ehtimoliy raddiyalar...", "..."],
              "weaknesses": ["bizning dalillarimiz va pozitsiyamizdagi asosiy kamchiliklar...", "..."],
              "vulnerabilities": ["raqib foydalanishi mumkin bo'lgan yuridik nozik jabhalar...", "..."]
            },
            "actionPlan": {
              "immediate": ["Zudlik bilan bajarilishi shart bo'lgan harakatlar (24-48 soat)..."],
              "sevenDays": ["Yaqin 7 kun ichida amalga oshiriladigan profilaktik choralar..."],
              "thirtyDays": ["Yaqin 30 kunlik strategik maqsadlar rejasi..."]
            },
            "scorecard": {
              "overallScore": 70,
              "categories": [
                { "name": "Hujjatlar sifati", "score": 75 },
                { "name": "Guvohlar ko'rsatmalari", "score": 50 },
                { "name": "Huquqiy asoslar kuchi", "score": 80 },
                { "name": "Protsessual tayyorgarlik", "score": 65 }
              ]
            }
          }
        `;

        const responseText = await callAIServer({
          contents: [{ role: "user", parts: [{ text: synthesisPrompt }] }],
          systemInstruction: "Siz professional va oliy toifali yuridik tahlilchisiz. Olingan tahlil qismlarini birlashtirib, bitta mukammal tizimli JSON hisoboti qaytarasiz.",
          config: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        });

        let cleanText = responseText.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.substring(7);
        }
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith("```")) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        
        return JSON.parse(cleanText.trim());
      } else {
        addLog(`Gemini-dan javob kutilyapti... (${files.length} ta dalil materiali yuborilmoqda)`);

        const systemInstruction = `
          You are an elite, highly experienced legal AI analyzer specializing in Uzbekistan civil, criminal, and economic courts.
          Analyze the given legal evidence files for parts of a legal dispute/case named "${caseTitle}".
          Your analysis must be extremely thorough, critical, and objective.
          
          You MUST output ONLY a valid parseable JSON object matching exactly this signature without any markdown code fence wrapping or intro text:
          {
            "analysis": {
              "strongEvidence": ["strong point 1 description with details", "strong point 2..."],
              "mediumEvidence": ["medium point 1 description", "medium point 2..."],
              "weakEvidence": ["weak point 1...", "weak point 2..."],
              "missingEvidence": ["missing critical document 1", "missing proof 2..."],
              "contradictions": ["found contradiction 1 between document A and B", "contradiction 2..."],
              "potentialRisks": ["legal risk 1 based on evidence", "legal risk 2..."]
            },
            "winProbability": {
              "score": 72,
              "confidence": "High" (or "Medium" or "Low" based on amount of solid evidence present),
              "disclaimer": "Ushbu ko'rsatkich yuridik dalillarga asoslangan taxminiy AI tahlili bo'lib, rasmiy yuridik maslahat o'rnini bosa olmaydi."
            },
            "riskMatrix": [
              { "id": "risk1", "level": "High" (or "Medium" or "Low"), "description": "Risk description", "impact": "Case outcome impact details", "mitigation": "Mitigation steps details" }
            ],
            "opponentAnalysis": {
              "counterarguments": ["predict likely counter argument 1 by opponent", "counter 2..."],
              "weaknesses": ["current vulnerabilities in our case documentation", "weakness 2..."],
              "vulnerabilities": ["vulnerable points in our legal stance", "vulnerable 2..."]
            },
            "actionPlan": {
              "immediate": ["Immediate steps to protect this claim/evidence"],
              "sevenDays": ["7-Day steps (e.g. obtain notary, certify documents)"],
              "thirtyDays": ["30-Day steps (e.g. file additional litigation requests)"]
            },
            "scorecard": {
              "overallScore": 68,
              "categories": [
                { "name": "Hujjatlar sifati", "score": 80 },
                { "name": "Guvohlar ko'rsatmalari", "score": 45 },
                { "name": "Huquqiy asoslar kuchi", "score": 75 },
                { "name": "Protsessual tayyorgarlik", "score": 60 }
              ]
            }
          }

          Make sure descriptions are fully detailed, professional, and written in Uzbek (Lotin) language. Keep overall score out of 100.
        `;

        const userParts: any[] = [{ text: combinedText }];
        imageParts.forEach(imgPart => {
          userParts.push(imgPart);
        });

        const responseText = await callAIServer({
          contents: [{ role: "user", parts: userParts }],
          systemInstruction: systemInstruction,
          config: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });

        let cleanText = responseText.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.substring(7);
        }
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith("```")) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        return JSON.parse(cleanText.trim());
      }
    };

    try {
      let parsedReport: any;
      if (shouldChunkProactively) {
        parsedReport = await performFlow(true);
      } else {
        try {
          parsedReport = await performFlow(false);
        } catch (stdError: any) {
          const classCode = classifyError(stdError);
          if (classCode.type === "context length exceeded" || classCode.type === "request too large") {
            addLog(`Xavfsiz tahlil rejasi: Standart tahlil limit xatoligi berdi (${classCode.type}). Segmentlash tahliliga (Chunk Mode) avtomatik o'tilmoqda...`);
            parsedReport = await performFlow(true);
          } else {
            throw stdError; // Bubble up normal errors
          }
        }
      }

      addLog("AI javobi qabul qilindi. Ma'lumotlarni tahlil qilish boshlanmoqda.");

      // Add identifiers and file metadata
      const finalReport = {
        id: Math.random().toString(36).substring(7),
        caseId,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files: files.map(f => ({ name: f.name, type: f.type, size: f.size })),
        ...parsedReport
      };

      // Save into Firebase Cases/CaseId/evidenceReports/ReportId subcollection
      const reportRef = doc(db, "cases", caseId, "evidenceReports", finalReport.id);
      await setDoc(reportRef, finalReport);

      setReport(finalReport);
      addLog("Yangi tahliliy hisobot muvaffaqiyatli saqlandi va yuklandi.");

      const durationMs = Date.now() - startTime;
      const metricRec = {
        timestamp: Date.now(),
        caseId,
        filesCount: files.length,
        totalSize,
        textLength,
        estimatedTokens,
        durationMs,
        status: "success" as const
      };
      setMetrics(metricRec);
      await saveMetricsToFirestore(metricRec);

    } catch (e: any) {
      const durationMs = Date.now() - startTime;
      const classification = classifyError(e);
      addLog(`AI tahlilida xatolik yuz berdi: ${classification.friendlyMessage}`);
      addLog(`Asl xatolik: ${e.message || String(e)}`);
      console.error("Gemini full error log:", e);

      const errorCode = e.status || classification.code;

      const metricRec = {
        timestamp: Date.now(),
        caseId,
        filesCount: files.length,
        totalSize,
        textLength,
        estimatedTokens,
        durationMs,
        status: "error" as const,
        errorType: classification.type,
        errorCode,
        errorMessage: e.message || String(e)
      };
      setMetrics(metricRec);
      await saveMetricsToFirestore(metricRec);

      alert(`Xatolik: Tahlilni yakunlab bo'lmadi.\n\nTafsilot: ${classification.friendlyMessage}\n\n[API Xatosi]: ${e.message || String(e)}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Export to TXT / Plain report generator
  const exportAsTxt = () => {
    if (!report) return;
    
    let docContent = `DALILLARNI CHUQUR MULTIMEDIALI TAHLIL REPORTHisobot ID: ${report.id}\nIsh nomi: ${caseTitle}\nSana: ${new Date(report.createdAt).toLocaleString()}\n\n`;
    
    docContent += `=== 1. DALILLAR HOLATI VA BALLARI ===\nOverall Score: ${report.scorecard?.overallScore}/100\n`;
    report.scorecard?.categories?.forEach((cat: any) => {
      docContent += `- ${cat.name}: ${cat.score}/100\n`;
    });
    
    docContent += `\n=== 2. MUVAFFAQIYAT EHTIMOLI (WIN PROBABILITY) ===\nKo'rsatkich: ${report.winProbability?.score}%\nIshonch darajasi: ${report.winProbability?.confidence}\nEslatma: ${report.winProbability?.disclaimer}\n\n`;
    
    docContent += `=== 3. KUCHLI DALILLAR ===\n`;
    report.analysis?.strongEvidence?.forEach((e: string) => docContent += `+ ${e}\n`);
    
    docContent += `\n=== 4. O'RTACHA DALILLAR ===\n`;
    report.analysis?.mediumEvidence?.forEach((e: string) => docContent += `* ${e}\n`);
    
    docContent += `\n=== 5. KUCHSIZ DALILLAR ===\n`;
    report.analysis?.weakEvidence?.forEach((e: string) => docContent += `- ${e}\n`);
    
    docContent += `\n=== 6. ETISHMAYOTGAN HUJJATLAR ===\n`;
    report.analysis?.missingEvidence?.forEach((e: string) => docContent += `? ${e}\n`);
    
    docContent += `\n=== 7. ZIDDIYATLAR (CONTRADICTIONS) ===\n`;
    report.analysis?.contradictions?.forEach((e: string) => docContent += `! ${e}\n`);
    
    docContent += `\n=== 8. HUQUQIY XAVFLI MATRITSA (RISK MATRIX) ===\n`;
    report.riskMatrix?.forEach((r: any) => {
      docContent += `- [Xavf: ${r.level}] ${r.description}\n  Ta'sir: ${r.impact}\n  Yechish: ${r.mitigation}\n\n`;
    });
    
    docContent += `=== 9. RAQIB (OPPONENT) CHET ESTIME ===\n`;
    docContent += `Ehtimoliy qarshi raddiyalar:\n`;
    report.opponentAnalysis?.counterarguments?.forEach((e: string) => docContent += `* ${e}\n`);
    docContent += `\nBizning eng nozik nuqtalarimiz:\n`;
    report.opponentAnalysis?.weaknesses?.forEach((e: string) => docContent += `* ${e}\n`);
    
    docContent += `\n=== 10. HARAKATLAR REJASI ===\n`;
    docContent += `Zudlik bilan choralar:\n`;
    report.actionPlan?.immediate?.forEach((e: string) => docContent += `* ${e}\n`);
    docContent += `\n7 kunlik vazifalar:\n`;
    report.actionPlan?.sevenDays?.forEach((e: string) => docContent += `* ${e}\n`);
    docContent += `\n30 kunlik vazifalar:\n`;
    report.actionPlan?.thirtyDays?.forEach((e: string) => docContent += `* ${e}\n`);

    const blob = new Blob([docContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `AI_Dalillar_Tahlili_${caseId}.txt`);
    addLog("Hisobot TXT formatida muvaffaqiyatli yuklab olindi.");
  };

  // Modern backend-oriented DOCX Exporter
  const exportAsDocx = async () => {
    if (!report) return;

    try {
      addLog("DOCX hisoboti yaratilmoqda...");
      
      const buildSection = (title: string, list: string[]) => {
        return `<h2>${title}</h2><ul>` + list.map(item => `<li>${item}</li>`).join('') + `</ul>`;
      };

      const categoriesHtml = report.scorecard?.categories?.map((cat: any) => `<li><strong>${cat.name}:</strong> ${cat.score}/100</li>`).join('') || "";
      const riskMatrixHtml = report.riskMatrix?.map((r: any) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; font-weight: bold; color: ${r.level === 'High' ? '#dc2626' : r.level === 'Medium' ? '#d97706' : '#2563eb'}">${r.level}</td>
          <td style="padding: 10px;">${r.description}</td>
          <td style="padding: 10px;">${r.impact}</td>
          <td style="padding: 10px; background-color: #f8fafc;">${r.mitigation}</td>
        </tr>
      `).join('') || "";

      const formattedHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 20px;">
          <h1 style="color: #1e3a8a; text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">Dalillarning Kompleks AI Tahlili Ekspertiza Hisoboti</h1>
          <p style="text-align: right; font-style: italic; font-size: 11px; color: #64748b;">Hisobot yaratilgan sana: ${new Date(report.createdAt).toLocaleString()}</p>
          <p><strong>Ko'rilayotgan yuridik ish portfeli:</strong> ${caseTitle}</p>
          <p><strong>Yaratuvchi unvoni:</strong> Adliya va Loyiha AI Maslahatchisi</p>
          <hr/>
          
          <h2>1. Muhim Xulosa va Muvaffaqiyat Ko'rsatkichi</h2>
          <div style="background-color: #eff6ff; padding: 15px; border-left: 4px solid #2563eb; margin-bottom: 20px; border-radius: 4px;">
            <p style="font-size: 18px; margin: 0; color: #1e3a8a;"><strong>Taxminiy g'alaba qozonish ehtimoli:</strong> <span style="font-size: 24px; font-weight: bold; color: #2563eb;">${report.winProbability?.score}%</span></p>
            <p style="margin: 5px 0 0 0;"><strong>Tahliliy ishonch hissi:</strong> ${report.winProbability?.confidence}</p>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b; font-style: italic;">Disclaimer: ${report.winProbability?.disclaimer}</p>
          </div>

          <h2>2. Dalillar Scorecardi & Ballari</h2>
          <p><strong>Integratsiyalashgan dalillar umumiy bal GPA kuchi:</strong> ${report.scorecard?.overallScore}/100</p>
          <ul>
            ${categoriesHtml}
          </ul>

          ${buildSection("3. Tasdiqlangan Kuchli Dalillar guruhlari", report.analysis?.strongEvidence || [])}
          ${buildSection("4. O'rtacha kuchdagi dalillar guruhlari", report.analysis?.mediumEvidence || [])}
          ${buildSection("5. Zaif deb baholangan yoki bekor qilinishi mumkin bo'lgan dalillar", report.analysis?.weakEvidence || [])}
          ${buildSection("6. Etishmayotgan yoki sud tomonidan qo'shimcha so'raladigan hujjatlar ro'yxati", report.analysis?.missingEvidence || [])}
          ${buildSection("7. Materiallar va hujjatlardagi o'zaro qarama-qarshiliklar (Contradictions)", report.analysis?.contradictions || [])}
          ${buildSection("8. Potentsial protsessual va amaliy xavf-hatarlar", report.analysis?.potentialRisks || [])}

          <h2>9. Risk Matritsasi va Profilaktik Choralar</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #1e3a8a; color: white;">
                <th style="padding: 10px; text-align: left;">Daraja</th>
                <th style="padding: 10px; text-align: left;">Ogohlantirish / Xavflilik</th>
                <th style="padding: 10px; text-align: left;">Ishga Ta'siri</th>
                <th style="padding: 10px; text-align: left;">Mitigatsiya Rejasi</th>
              </tr>
            </thead>
            <tbody>
              ${riskMatrixHtml}
            </tbody>
          </table>

          <h2>10. Opponent Tomonning Strategiya va Pozitsiyalari (Raqib Analizi)</h2>
          ${buildSection("Ehtimoliy qarshi raddiya va kontr-ayblovlar", report.opponentAnalysis?.counterarguments || [])}
          ${buildSection("Hozirgi taktikamizdagi ochiq nozik nuqtalar", report.opponentAnalysis?.weaknesses || [])}
          ${buildSection("Zaif huquqiy va ma'muriy jabhada zaifliklarimiz", report.opponentAnalysis?.vulnerabilities || [])}

          <h2>11. Strategik Yo'l Xaritasi (Action Plan)</h2>
          ${buildSection("Zudlik bilan qilinishi shart bo'lgan harakatlar (24-48 soat)", report.actionPlan?.immediate || [])}
          ${buildSection("Yaqin 7 kunlik yuridik vazifalar rejasi", report.actionPlan?.sevenDays || [])}
          ${buildSection("Strategik 30 kunlik tizimli maqsadlar", report.actionPlan?.thirtyDays || [])}
        </div>
      `;

      const response = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: formattedHtml })
      });

      if (!response.ok) {
        throw new Error("Tizim eksport xizmatida xatolik qaytdi.");
      }

      const blob = await response.blob();
      saveAs(blob, `AI_Dalillar_Hisoboti_${caseId}.docx`);
      addLog("Dalillar hisoboti DOCX formatida yuklab olindi.");
    } catch (e: any) {
      addLog(`DOCX eksport xatoligi: ${e.message}`);
      alert("DOCX eksport xizmati vaqtincha nofaol. Marshrutni tekshiring.");
    }
  };

  // Helper function to print/export layout cleanly directly via browser print mechanism formatted as clean PDF
  const triggerPdfPrint = () => {
    window.print();
    addLog("Tahlil varaqasi o'rnatilgan brauzer PDF o'chog'iga yuborildi.");
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden">
      {/* HEADER BANNER */}
      <div className="p-6 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/20">
              <Sparkles className="w-4.5 h-4.5" />
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-300">ADLIYA RAQAMLI EKSPERTIZANI TAYYORLASH</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">
            Aqlli Dalillar Analizatori (Evidence Analyzer)
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Case materiallarini yuklang va ishdagi kuchli ko'rsatmalar, zid keluvchi hujjatlar, muvaffaqiyat foizi va opponent tahlilini tezkorlik bilan oling.
          </p>
        </div>
        
        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportAsTxt}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition"
              title="TXT Hisobotni Yuklab Olish"
            >
              <Download className="w-3.5 h-3.5" />
              TXT Yuklash
            </button>
            <button
              onClick={exportAsDocx}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition"
              title="Word Eksport Qilish (Durable)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Eksport DOCX
            </button>
            <button
              onClick={triggerPdfPrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl transition print:hidden"
              title="PDF qilib chop etish"
            >
              <Eye className="w-3.5 h-3.5" />
              Chop etish (PDF)
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-slate-100 dark:border-zinc-800">
        {/* LEFT COLUMN: UPLOAD PANEL & STATS */}
        <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/60">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-2">1. Dalil Materiallarini Jamlash</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal mb-4">
              Ishingizni tasdiqlovchi shartnomalar, dalolatnomalar, rasmlar yoki kelishuvlarni bu yerda birlashtiring. JSON tahlili uchun avtomatik matn o'qiladi.
            </p>

            {/* DRAG & DROP AREA */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-zinc-700 hover:border-indigo-400 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl p-6 text-center cursor-pointer transition-all group"
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".txt,.docx,.pdf,image/*"
                className="hidden"
              />
              <FileUp className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mx-auto mb-2 transition" />
              <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Yuklash uchun ustiga bosing</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">PDF, DOCX, TXT yoki Rasmlar (Ulashish cheklanmagan)</p>
            </div>
          </div>

          {/* FILE QUEUE */}
          {files.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{files.length} ta yuklangan ob'ektlar</span>
                <button
                  onClick={clearAllFiles}
                  className="text-[10px] font-bold text-rose-600 hover:underline"
                >
                  Hammasini tozalash
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {files.map(f => (
                  <div key={f.id} className="flex justify-between items-center bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 shadow-2xs">
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                       <span className="text-xs px-1.5 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400 uppercase flex-shrink-0 text-[9px]">
                        {f.type}
                      </span>
                      <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate" title={f.name}>
                        {f.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(f.id, f.name)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTION TRIGGER BUTTON */}
          <button
            onClick={runAiAnalysis}
            disabled={analyzing || files.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-sm cursor-pointer mb-6"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>AI Materiallarni diagnostika qilmoqda...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5 text-indigo-300" />
                <span>Dalillarni AI Chuqur Tahlil qilish</span>
              </>
            )}
          </button>

          {/* CONSOLE DEBUG LOGS */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-4.5 font-mono text-[10px] space-y-1.5 shadow-inner">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-2">
              <span className="text-indigo-400 font-bold">ANALYSIS STATUS LOG</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            
            {loadingHistory ? (
              <div className="flex items-center gap-1.5 py-1 text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>O'tgan tahlillar tarixi qidirilmoqda...</span>
              </div>
            ) : null}

            <div className="space-y-1 max-h-44 overflow-y-auto pr-1 text-slate-300 leading-normal">
              {logs.map((l, i) => (
                <div key={i} className="truncate">{l}</div>
              ))}
            </div>
          </div>

          {/* ANALYSIS METRICS SUMMARY */}
          {metrics && (
            <div className="mt-4 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tahlil Metrikalari (Performance Stats)</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-[10px]">
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-2.5 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 font-semibold">Fayllar soni:</span>
                  <span className="font-bold text-slate-850 dark:text-zinc-200">{metrics.filesCount} ta dalil</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-2.5 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 font-semibold">Umumiy hajm:</span>
                  <span className="font-bold text-slate-850 dark:text-zinc-200">{(metrics.totalSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-2.5 rounded-xl col-span-2">
                  <span className="text-slate-400 block mb-0.5 font-semibold">Matn o'lchami (harf / est. tokenlar):</span>
                  <span className="font-bold text-slate-855 dark:text-zinc-200">
                    {metrics.textLength.toLocaleString()} ta harf / ~{metrics.estimatedTokens.toLocaleString()} token
                  </span>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-2.5 rounded-xl col-span-2 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Tahlil davomiyligi:</span>
                    <span className="font-extrabold text-slate-850 dark:text-zinc-200">{(metrics.durationMs / 1000).toFixed(2)} soniya</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase tracking-wider ${
                    metrics.status === "success" 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200" 
                      : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200"
                  }`}>
                    {metrics.status === "success" ? "Muvaffaqiyatli" : "Xatolik"}
                  </span>
                </div>
              </div>
              
              {metrics.status === "error" && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 p-3 rounded-xl text-[10px] space-y-1 my-1">
                  <div className="font-extrabold">Xatolik sinfi: {metrics.errorType}</div>
                  <div>Zavod API Xato Kodi: {metrics.errorCode}</div>
                  <div className="text-[9px] leading-relaxed break-words line-clamp-3 bg-white/50 p-1.5 rounded" title={metrics.errorMessage}>
                    {metrics.errorMessage}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REVIEWS & REPORTS DISPLAY */}
        <div className="lg:col-span-7 p-6">
          {!report ? (
            <div className="h-full min-h-[400px] flex flex-col justify-center items-center text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 mb-1">Tahlil hisoboti tayyor emas</h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4 leading-normal">
                Ish materiallarini (PDF, rasm, shartnomalar, dalolatnomalar) tahrirlagichga yuklab tahlilni boshlang. AI sud tizimi talablariga mos hisobot shakllantiradi.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* MINI OVERVIEW PANEL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-linear-to-b from-indigo-50 to-white border border-indigo-100 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">G'ALABA EHTIMOLI</span>
                    <span className="text-3xl font-extrabold text-indigo-900">{report.winProbability?.score}%</span>
                  </div>
                  <span className="text-[10px] text-indigo-600/70 block mt-2 font-medium">Uzbekistan Court Scale</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">CONFIDENCE LEVEL</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        report.winProbability?.confidence === 'High' ? 'bg-emerald-500' :
                        report.winProbability?.confidence === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                      <span className="text-sm font-bold text-slate-800">{report.winProbability?.confidence || 'High'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-2">Dalil ishonchlilik darajasi</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">UMUMIY DALILLAR BALL</span>
                    <span className="text-3xl font-extrabold text-slate-800">{report.scorecard?.overallScore || 65} <span className="text-xs font-normal text-slate-400">/100</span></span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-2">Sifat va tayyorgarlik darajasi</span>
                </div>
              </div>

              {/* TABS SELECTOR */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveSubTab("analysis")}
                  className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all ${
                    activeSubTab === "analysis" 
                      ? "border-indigo-600 text-indigo-600 font-extrabold" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Analysis & Scorecard
                </button>
                <button
                  onClick={() => setActiveSubTab("risks")}
                  className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all ${
                    activeSubTab === "risks" 
                      ? "border-indigo-600 text-indigo-600 font-extrabold" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Risiz Matrix
                </button>
                <button
                  onClick={() => setActiveSubTab("probability")}
                  className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all ${
                    activeSubTab === "probability" 
                      ? "border-indigo-600 text-indigo-600 font-extrabold" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Opponent Strategy
                </button>
                <button
                  onClick={() => setActiveSubTab("actions")}
                  className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-all ${
                    activeSubTab === "actions" 
                      ? "border-indigo-600 text-indigo-600 font-extrabold" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Action Plan
                </button>
              </div>

              {/* TAB CONTENT: ANALYSIS / SCORECARD */}
              {activeSubTab === "analysis" && (
                <div className="space-y-6">
                  {/* Scorecard checklist detail */}
                  {report.scorecard && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5">
                      <h4 className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-3.5">
                        Dalillar Sifat Metrikalari (Evidence scorecard)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {report.scorecard.categories?.map((cat: any, i: number) => (
                          <div key={i} className="bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 rounded-xl p-3 shadow-2xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{cat.name}</span>
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{cat.score}/100</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${cat.score}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strong / Medium / Weak Evidence Groups */}
                  <div className="space-y-4">
                    {/* Strong Evidence */}
                    {report.analysis?.strongEvidence && report.analysis.strongEvidence.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-emerald-600 mb-2">
                          <CheckCircle className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Kuchli dalillar (Strong)</h4>
                        </div>
                        <ul className="space-y-1.5 bg-emerald-50/25 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl p-4">
                          {report.analysis.strongEvidence.map((e: string, i: number) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-1 flex-shrink-0">•</span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Medium / Weak Evidence */}
                    {report.analysis?.mediumEvidence && report.analysis.mediumEvidence.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-indigo-600 mb-2">
                          <Activity className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">O'rtacha kuchdagi dalillar</h4>
                        </div>
                        <ul className="space-y-1.5 bg-slate-50 dark:bg-zinc-800 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800">
                          {report.analysis.mediumEvidence.map((e: string, i: number) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-indigo-400 mt-1 flex-shrink-0">•</span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weak Evidence */}
                    {report.analysis?.weakEvidence && report.analysis.weakEvidence.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-amber-600 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Beqaror yoki Zaif dalillar</h4>
                        </div>
                        <ul className="space-y-1.5 bg-amber-50/20 dark:bg-amber-950/20 border border-amber-100/30 dark:border-amber-900/40 rounded-2xl p-4">
                          {report.analysis.weakEvidence.map((e: string, i: number) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-amber-500 mt-1 flex-shrink-0">•</span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing critical assets */}
                    {report.analysis?.missingEvidence && report.analysis.missingEvidence.length > 0 && (
                      <div className="bg-rose-50/20 dark:bg-rose-950/20 border border-rose-200/30 dark:border-rose-900/40 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 text-rose-600 mb-2">
                          <ShieldAlert className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Ishda etishmayotgan hujjatlar</h4>
                        </div>
                        <ul className="space-y-1.5">
                          {report.analysis.missingEvidence.map((e: string, i: number) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-1.5 font-medium">
                              <span className="text-rose-500 mt-1 flex-shrink-0">?</span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: RISKS MATRIX */}
              {activeSubTab === "risks" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                      Xavflar va qarshi choralarni yumshatish rejasi
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">PROTSESSUAL DIAGNOSTIKA</span>
                  </div>

                  <div className="space-y-3.5">
                    {report.riskMatrix?.map((risk: any, i: number) => (
                      <div 
                        key={risk.id || i} 
                        className={`border rounded-2xl p-4.5 bg-white dark:bg-zinc-800/40 transition shadow-2xs ${
                          risk.level === 'High' ? 'border-rose-200 dark:border-rose-900/50 relative overflow-hidden' :
                          risk.level === 'Medium' ? 'border-amber-200 dark:border-amber-900/50' : 'border-slate-100 dark:border-zinc-800/80'
                        }`}
                      >
                        {risk.level === 'High' && (
                          <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl-xl tracking-wider uppercase">
                            DIQQAT: YUQORI XAVF
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border uppercase ${
                            risk.level === 'High' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                            risk.level === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                            'bg-indigo-50 border-indigo-200 text-indigo-600'
                          }`}>
                            {risk.level} Risk
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">{risk.description}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200/60 dark:border-zinc-800 text-xs">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">KUTILAYOTGAN TA'SIRI</span>
                            <p className="text-slate-600 dark:text-zinc-400 leading-normal">{risk.impact}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">XAVFNI YUMSHATISH RELASI (MITIGATION)</span>
                            <p className="text-slate-700 dark:text-zinc-300 font-medium leading-normal">{risk.mitigation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* General warning info box */}
                  <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <Info className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 mb-0.5">Avtomatlashtirilgan ogohlantirish</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Ko'rsatilgan protsessual taqchilliklar dalillar yetishmasligi davrida o'zgarishi mumkin. Eng yuqori xavfli bandlar bo'yicha ko'rsatilgan choralar 7 kundan kechiktirilmasligi tavsiya etiladi.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: OPPONENT STRATEGY */}
              {activeSubTab === "probability" && (
                <div className="space-y-6">
                  {report.opponentAnalysis && (
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center gap-1.5 text-rose-600 mb-2">
                          <ShieldAlert className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Raqibning ehtimoliy raddiyalari</h4>
                        </div>
                        <ul className="space-y-2 bg-slate-50 rounded-2xl p-4.5 border border-slate-100">
                          {report.opponentAnalysis.counterarguments?.map((e: string, i: number) => (
                            <li key={i} className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
                              <ChevronRight className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-amber-600 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider font-extrabold text-[12px]">
                            Pozitsiyamizdagi joriy muammoli jabhalar
                          </h4>
                        </div>
                        <ul className="space-y-2 bg-white dark:bg-zinc-800/60 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4.5">
                          {report.opponentAnalysis.weaknesses?.map((e: string, i: number) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-1.5">
                              <ChevronRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {report.opponentAnalysis.vulnerabilities && (
                        <div>
                          <div className="flex items-center gap-1.5 text-indigo-600 mb-2">
                            <Activity className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase tracking-wider">Nozik huquqiy nuqtalarimiz</h4>
                          </div>
                          <ul className="space-y-2 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl p-4.5">
                            {report.opponentAnalysis.vulnerabilities?.map((e: string, i: number) => (
                              <li key={i} className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
                                <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                                <span>{e}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: ACTION PLAN */}
              {activeSubTab === "actions" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Yo'l Xaritasi va Harakatlar Rejasi</h4>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Harakat muddati</span>
                  </div>

                  {report.actionPlan && (
                    <div className="space-y-5">
                      {/* Immediate Actions */}
                      <div className="bg-linear-to-b from-indigo-50/30 to-white border border-indigo-100/60 rounded-2xl p-4.5">
                        <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-full tracking-widest block w-fit mb-2.5">
                          DIQQAT: ZUDLIK BILAN (24-48 SOAT CHORALARI)
                        </span>
                        <ul className="space-y-2">
                          {report.actionPlan.immediate?.map((e: string, i: number) => (
                            <li key={i} className="text-xs text-slate-700 leading-relaxed font-semibold flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 7-Days Actions */}
                      <div className="bg-white dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4.5">
                        <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full tracking-widest block w-fit mb-2.5">
                          YAYIN 7 KUNLIK HUQUQIY VAZIFALAR
                        </span>
                        <ul className="space-y-2">
                          {report.actionPlan.sevenDays?.map((e: string, i: number) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 30-Days Actions */}
                      <div className="bg-white dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4.5">
                        <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full tracking-widest block w-fit mb-2.5">
                          STRATEGIK 30 KUNLIK SUD REJALARI
                        </span>
                        <ul className="space-y-2">
                          {report.actionPlan.thirtyDays?.map((e: string, i: number) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DISCLAIMER AND AUDIT REPORT META */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400">
                  Hisobot ID: {report.id} • Yangilangan: {new Date(report.updatedAt).toLocaleString()}
                </span>
                
                <p className="text-[9px] text-slate-500 italic max-w-sm text-left sm:text-right">
                  <strong>Eslatma (Disclaimer):</strong> {report.winProbability?.disclaimer || "Bu ma'lumotlar AI baholashi bo'lib, rasmiy yuridik qaror yoki kafolat bo'la olmaydi."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

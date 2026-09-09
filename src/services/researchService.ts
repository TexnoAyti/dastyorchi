import { db, auth } from "../firebase";
import { 
  collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc, getDoc, orderBy 
} from "firebase/firestore";
import { ResearchReport } from "../types";
import { callAIServer } from "./aiService";

// Generate a brand new Legal Research Report using Gemini
export async function generateResearchReport(
  question: string,
  onRetry?: (msg: string) => void
): Promise<Omit<ResearchReport, "id" | "userId" | "createdAt" | "updatedAt">> {
  const systemInstruction = `Siz O'zbekiston Respublikasi qonunchiligi (Fuqarolik, Jinoyat, Ma'muriy, Mehnat, Oila, Soliq kodekslari va shartnomalar huquqi) bo'yicha yuqori malakali, professional yuridik tadqiqot tahlilchisisiz.
Berilgan huquqiy muammo yoki savolni o'rganib chiqib, yuridik jihatdan mukammal va har tomonlama asoslangan tadqiqot hisobotini taqdim qiling.

Siz faqat va faqat quyidagi tuzilishdagi to'g'ri (valid) JSON formatida javob qaytarishingiz lozim. Hech qanday kirish yoki tushuntirish matni qo'shmang, markdown \`\`\`json kodi bilan o'ramang:
{
  "question": "Savolning tahrirlangan yuridik ko'rinishi",
  "category": "civil | criminal | administrative | labour | contract | family | tax kabi kichik harflarda eng mos kategoriya nomi",
  "summary": "Huquqiy muammoning qisqacha va tushunarli mazmumi (Summary)",
  "legalQuestions": [
    "Muammodan kelib chiquvchi birinchi asosiy yuridik savol (masalan: Mehnat kodeksi 100-moddasiga muvofiq ogohlantirish muddati berilganmi?)",
    "Ikkinchi yuridik savol..."
  ],
  "principles": [
    "Mehnat kodeksi, 100-modda: Ish beruvchi tashabbusi bilan shartnomani bekor qilish tartibi",
    "Oliy sud Plenumi Qarori No. 12, 15-band..."
  ],
  "supportingArguments": [
    "Mijoz manfaatini himoya qiluvchi kuchli argument 1",
    "Argument 2..."
  ],
  "opposingArguments": [
    "Qarshi tomon (javobgar yoki davlat organi) keltirishi mumkin bo'lgan ehtimoliy raddiya va argument 1",
    "Qarshi taraf argumenti 2..."
  ],
  "risks": [
    "Da'vo muddati (srok da'vo) o'tib ketish xavfi",
    "Hujjatlar rasmiylashtirilishi bo'yicha xavf 2..."
  ],
  "requiredDocuments": [
    "Mehnat daftarchasi nusxasi",
    "Ishga qabul qilish to'g'risidagi buyruq"
  ],
  "missingEvidence": [
    "Mijoz va ish beruvchi o'rtasidagi bildirishnoma va ogohlantirish xati",
    "Bank hisobvarag'idan ko'chirma"
  ],
  "supportingMaterials": [
    "Guvohlar ko'rsatmalari (agar mavjud bo'lsa)",
    "Harakatlar davridagi yozishmalar skrinshoti"
  ],
  "riskLevel": "High | Medium | Low",
  "riskAnalysis": "Ushbu holat bo'yicha protsessual xavf va moddiy xarajatlar darajasining kengaytirilgan tahlili.",
  "strategyActions": [
    "1. Qarshi tarafga rasmiy pre-tenziya (talabnoma) yuborish",
    "2. O'tkazib yuborilgan muddatlarni tiklash haqida iltimosnoma tayyorlash",
    "3. Sudga da'vo arizasi kiritish"
  ],
  "expertiseTip": "Ushbu ish uchun mehnat huquqi bo'limi advokati tavsiya etiladi. Da'vo kiritishdan oldin muzokara olib borish muhim."
}

Barcha matnlar professional yuridik o'zbek tilida (Lotin imlosida), tushunarli, aniq moddalar bilan asoslangan shaklda yozilishi shart.`;

  const prompt = `Yuridik tadqiqot savoli: "${question}"`;

  const responseText = await callAIServer({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction,
    config: { temperature: 0.3 }
  }, onRetry);

  let jsonStr = responseText.trim();
  // Strip potential markdown wrapper
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  }

  try {
    const rawReport = JSON.parse(jsonStr);
    return rawReport;
  } catch (error) {
    console.error("JSON parse failed, raw string was:", responseText);
    // Parse via regex as backup
    throw new Error("AI tadqiqot hisobotini qayta ishlashda xatolik ro'y berdi. Iltimos qaytadan urinib ko'ring.");
  }
}

// Fetch all research reports for current logged in user
export async function getUserResearchReports(): Promise<ResearchReport[]> {
  if (!auth.currentUser) return [];
  
  const q = query(
    collection(db, "research_reports"),
    where("userId", "==", auth.currentUser.uid)
  );

  const snapshot = await getDocs(q);
  const reports = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ResearchReport[];

  // Sort by createdAt desc in-memory to prevent index constraints errors
  reports.sort((a, b) => b.createdAt - a.createdAt);
  return reports;
}

// Get Research Reports specifically attached to a given Case
export async function getCaseResearchReports(caseId: string): Promise<ResearchReport[]> {
  if (!auth.currentUser) return [];

  const q = query(
    collection(db, "research_reports"),
    where("userId", "==", auth.currentUser.uid),
    where("caseId", "==", caseId)
  );

  const snapshot = await getDocs(q);
  const reports = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ResearchReport[];

  reports.sort((a, b) => b.createdAt - a.createdAt);
  return reports;
}

// Save a research report to Firestore
export async function saveResearchReport(
  reportData: Omit<ResearchReport, "id" | "userId" | "createdAt" | "updatedAt"> & { id?: string; caseId?: string }
): Promise<string> {
  if (!auth.currentUser) throw new Error("Foydalanuvchi tizimga kirmagan.");

  const payload = {
    userId: auth.currentUser.uid,
    question: reportData.question,
    category: reportData.category,
    caseId: reportData.caseId || null,
    summary: reportData.summary,
    legalQuestions: reportData.legalQuestions || [],
    principles: reportData.principles || [],
    supportingArguments: reportData.supportingArguments || [],
    opposingArguments: reportData.opposingArguments || [],
    risks: reportData.risks || [],
    requiredDocuments: reportData.requiredDocuments || [],
    missingEvidence: reportData.missingEvidence || [],
    supportingMaterials: reportData.supportingMaterials || [],
    riskLevel: reportData.riskLevel || "Medium",
    riskAnalysis: reportData.riskAnalysis || "",
    strategyActions: reportData.strategyActions || [],
    expertiseTip: reportData.expertiseTip || "",
    updatedAt: Date.now()
  };

  if (reportData.id) {
    const docRef = doc(db, "research_reports", reportData.id);
    await updateDoc(docRef, payload);
    return reportData.id;
  } else {
    const docRef = await addDoc(collection(db, "research_reports"), {
      ...payload,
      createdAt: Date.now()
    });
    return docRef.id;
  }
}

// Delete research report
export async function deleteResearchReport(id: string): Promise<void> {
  await deleteDoc(doc(db, "research_reports", id));
}

// Attach / detach report to a case
export async function attachReportToCase(reportId: string, caseId: string | null): Promise<void> {
  const docRef = doc(db, "research_reports", reportId);
  await updateDoc(docRef, {
    caseId: caseId,
    updatedAt: Date.now()
  });
}

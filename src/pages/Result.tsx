import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Scale, Clock, ExternalLink, X, Send } from "lucide-react";
import { DOCUMENT_TEMPLATES } from "../constants";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { DocumentEditor } from "../components/DocumentEditor";

export function Result() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [docData, setDocData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitGuide, setShowSubmitGuide] = useState(false);

  useEffect(() => {
    async function fetchDoc() {
      if (!documentId) return;
      try {
        const docRef = doc(db, "documents", documentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userId !== auth.currentUser?.uid) {
            console.error("Unauthorized document access");
            setDocData(null);
          } else {
            setDocData({ id: docSnap.id, ...data });
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `documents/${documentId}`);
      } finally {
        setLoading(false);
      }
    }
    fetchDoc();
  }, [documentId]);

  const handleDocumentChange = async (newContent: string) => {
    setDocData((prev: any) => ({ ...prev, generatedText: newContent }));
    if (documentId) {
       try {
          await updateDoc(doc(db, "documents", documentId), {
             generatedText: newContent,
             updatedAt: serverTimestamp()
          });
       } catch (error) {
          console.error("Faylni saqlashda xatolik:", error);
       }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!docData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Scale className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Hujjat topilmadi</h2>
        <button onClick={() => navigate("/dashboard")} className="mt-4 text-blue-600 font-medium hover:underline">
          Dashboardga qaytish
        </button>
      </div>
    );
  }

  const template = DOCUMENT_TEMPLATES.find(t => t.id === docData.templateId);
  const lang = docData.language || "uz_lat";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 text-zinc-900 dark:text-zinc-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-500 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight">
              {template?.name[lang as keyof typeof template.name] || "Hujjat"}
            </h1>
            <p className="mt-1 text-xs md:text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {docData.createdAt?.toDate().toLocaleDateString("uz-UZ")}
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              ID: {documentId?.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSubmitGuide(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Send className="w-4 h-4 mr-2" />
            Sudga topshirish
          </button>
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Document Editor replacing the static viewer */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800/80 shadow-2xl h-auto lg:h-[calc(100vh-15rem)] min-h-[450px] lg:min-h-[500px] overflow-hidden flex flex-col"
          >
            <DocumentEditor 
                content={docData.generatedText} 
                onChange={handleDocumentChange} 
                title={template?.name[lang as keyof typeof template.name] || docData.title || "Hujjat"}
                templateId={docData.templateId}
                userRequest={docData.title || ""}
            />
          </motion.div>
        </div>
 
        {/* Sidebar / Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Tayyor</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Tahrirlashingiz mumkin</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-800/60">
                <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Hujjat turi</span>
                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">{template?.name[docData.language as keyof typeof template.name]}</span>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-800/60">
                <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">ID raqami</span>
                <span className="text-sm font-mono font-bold text-gray-900 dark:text-zinc-100">#{docData.id}</span>
              </div>
            </div>
          </div>
 
          <div className="bg-blue-600 dark:bg-zinc-800 p-6 rounded-2xl shadow-lg text-white border dark:border-zinc-800/80">
            <h3 className="font-bold mb-2 text-sm text-zinc-100 dark:text-zinc-200">Keyingi qadamlar?</h3>
            <p className="text-xs md:text-sm text-blue-100 dark:text-zinc-400 mb-6 leading-relaxed">
              Hujjat ro'yxatida yoki panel orqali PDF/DOCX formatlarida yuklab olishingiz mumkin. So'ngra ularni E-SUD tizimiga elektron tarzda yuklab sudga topshirishingiz mumkin.
            </p>
            <button 
              onClick={() => setShowSubmitGuide(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-zinc-100 text-blue-600 dark:text-zinc-950 rounded-xl font-bold text-xs md:text-sm hover:bg-blue-50 dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
              Qanday topshiriladi?
            </button>
          </div>
        </div>
      </div>
 
      {/* Submit Guide Modal */}
      {showSubmitGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-xl">
                  <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Sudga topshirish bo'yicha qo'llanma</h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">E-SUD tizimi orqali elektron topshirish</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSubmitGuide(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 rounded-xl p-4 mb-6">
                <p className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  <span className="font-bold">Eslatma:</span> Ushbu tizim hujjatni avtomatik ravishda sudga yubormaydi. Hujjatni rasmiy E-SUD portali orqali o'zingiz topshirishingiz kerak. Barcha huquqiy javobgarlik foydalanuvchi zimmasida.
                </p>
              </div>
 
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-zinc-100 mb-1 text-sm">Rasmiy portalga kiring</h4>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-400 mb-3">O'zbekiston Respublikasi Oliy sudining interaktiv xizmatlar portalini oching.</p>
                    <a 
                      href="https://my.sud.uz" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded-lg text-xs md:text-sm font-medium transition-colors border dark:border-zinc-700"
                    >
                      my.sud.uz portalini ochish
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
 
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-zinc-100 mb-1 text-sm">Tizimga kiring</h4>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-400">OneID (Yagona identifikatsiya tizimi) yoki E-IMZO (Elektron raqamli imzo) orqali avtorizatsiyadan o'ting.</p>
                  </div>
                </div>
 
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-zinc-100 mb-1 text-sm">Sud turini tanlang</h4>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-400">
                      "Fuqarolik ishlari bo'yicha sudlarga murojaat qilish" bo'limini tanlang.
                      {docData.inputData?.court_name && (
                        <span className="block mt-2 p-2 bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-800 font-medium text-gray-800 dark:text-zinc-200">
                          Tavsiya etilgan sud: {docData.inputData.court_name}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
 
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-zinc-100 mb-1 text-sm">Hujjatni yuklang</h4>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-400">
                      Tizimdan yaratilgan va yuklab olingan <span className="font-bold">PDF</span> formatidagi arizani portalga yuklang. Kerakli ilovalarni ham qo'shing.
                    </p>
                  </div>
                </div>
 
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-sm">5</div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-zinc-100 mb-1 text-sm">Arizani yuboring</h4>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-400 font-normal">Barcha ma'lumotlarni tekshirib chiqqach, E-IMZO orqali imzolang va sudga yuboring.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 flex justify-end gap-3">
              <button 
                onClick={() => setShowSubmitGuide(false)}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-xl font-bold cursor-pointer text-xs md:text-sm"
              >
                Tushunib yetdim
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles, FileText, Globe } from "lucide-react";
import { DOCUMENT_TEMPLATES } from "../constants";
import { cn } from "@/src/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateLegalDocument } from "../services/aiService";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { archiveOldDocuments } from "../services/dbArchiveService";
import { useNotification } from "../contexts/NotificationContext";
import { usePaywall } from "../contexts/PaywallContext";
import { generateMeaningfulFilename } from "../utils/documentNaming";

export function Builder() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const caseId = queryParams.get("caseId") || "";
  const { triggerNotification } = useNotification();
  const { openPaywall } = usePaywall();
  const template = DOCUMENT_TEMPLATES.find((t) => t.id === templateId);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [language, setLanguage] = useState<any>("uz_lat");

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FileText className="w-16 h-16 text-gray-300 dark:text-zinc-700 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Hujjat topilmadi</h2>
        <button onClick={() => navigate("/dashboard")} className="mt-4 text-blue-600 dark:text-blue-400 font-medium hover:underline">
          Dashboardga qaytish
        </button>
      </div>
    );
  }

  const fields = template.fields;
  const currentField = fields[currentStep];

  const schema = z.object(
    fields.reduce((acc, field) => {
      acc[field.id] = field.required ? z.string().min(1, "Majburiy maydon") : z.string().optional();
      return acc;
    }, {} as any)
  );

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const formData = watch();

  const handleNext = async () => {
    const isValid = await trigger(currentField.id);
    if (isValid) {
      if (currentStep < fields.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onSubmit(formData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: any) => {
    setIsGenerating(true);
    try {
      const variants = template.variants.map(v => v[language as keyof typeof v]).filter(Boolean);
      const randomVariant = variants.length > 0 ? variants[Math.floor(Math.random() * variants.length)] : "";

      const cleanData = Object.fromEntries(
        Object.entries(data || {}).map(([k, v]) => [k, v === undefined ? null : v])
      );

      const generatedText = await generateLegalDocument(
        template.name[language as keyof typeof template.name],
        cleanData,
        randomVariant,
        language
      );

      let docRef: any = null;
      try {
        const userId = auth.currentUser?.uid || "anonymous";
        
        // Generate a content-based meaningful title for the saved document in Firestore
        const generatedFilename = generateMeaningfulFilename({
          content: generatedText,
          title: template.name[language as keyof typeof template.name],
          templateId: template.id,
          type: "document",
          extension: "docx"
        });
        const docTitle = generatedFilename.replace(/\.docx$/i, "").replace(/_/g, " ");

        docRef = await addDoc(collection(db, "documents"), {
          userId,
          title: docTitle,
          templateId: template.id,
          inputData: cleanData,
          generatedText,
          language,
          caseId: caseId || null,
          createdAt: serverTimestamp(),
        });
        
        // Asynchronously check and archive old documents if limit is exceeded
        if (userId !== "anonymous") {
          archiveOldDocuments(userId).catch((err) => {
            console.error("Non-blocking error archiving old documents:", err);
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "documents");
        return;
      }

      // Cross-tab notification trigger for template document builder (Non-blocking)
      try {
        if (docRef?.id) {
          triggerNotification("document", language, { documentId: docRef.id });
        } else {
          triggerNotification("document", language);
        }
      } catch (notifyErr) {
        console.error("Non-blocking notification error:", notifyErr);
      }

      navigate(`/result/${docRef.id}`);
    } catch (error: any) {
      console.error("Generation Error:", error);
      if (
        error?.errorData?.code === "AI_CREDIT_LIMIT" ||
        error?.code === "AI_CREDIT_LIMIT" ||
        error?.message?.includes("AI_CREDIT_LIMIT") ||
        error?.message?.includes("limitingiz tugadi") ||
        error?.status === 429
      ) {
        openPaywall("requests");
        return;
      }
      alert(error?.message || "Hujjatni yaratishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsGenerating(false);
    }
  };

  const progress = ((currentStep + 1) / fields.length) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Bekor qilish
          </button>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="text-sm font-bold text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <option value="uz_lat">O'zbek (Lotin)</option>
              <option value="uz_cyr">Ўзбек (Кирилл)</option>
              <option value="ru">Русский</option>
            </select>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-full">
              {currentStep + 1} / {fields.length} qadam
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight mb-6">{template.name[language as keyof typeof template.name]}</h1>
        <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-blue-600"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isGenerating ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl shadow-xl-fallback"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4">
                  {currentField.label[language as keyof typeof currentField.label]}
                </label>
                <div className="relative">
                  {currentField.type === "textarea" ? (
                    <textarea
                      {...register(currentField.id)}
                      rows={5}
                      className={cn(
                        "w-full px-4 py-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg resize-none text-gray-900 dark:text-zinc-100",
                        errors[currentField.id] && "border-red-500 focus:ring-red-500"
                      )}
                      placeholder="..."
                    />
                  ) : currentField.type === "date" ? (
                    <input
                      type="date"
                      {...register(currentField.id)}
                      className={cn(
                        "w-full px-4 py-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg text-gray-900 dark:text-zinc-100",
                        errors[currentField.id] && "border-red-500 focus:ring-red-500"
                      )}
                    />
                  ) : currentField.type === "number" ? (
                    <input
                      type="number"
                      {...register(currentField.id)}
                      placeholder="0"
                      className={cn(
                        "w-full px-4 py-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg text-gray-900 dark:text-zinc-100",
                        errors[currentField.id] && "border-red-500 focus:ring-red-500"
                      )}
                    />
                  ) : currentField.type === "select" ? (
                    <select
                      {...register(currentField.id)}
                      className={cn(
                        "w-full px-4 py-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg text-gray-900 dark:text-zinc-100",
                        errors[currentField.id] && "border-red-500 focus:ring-red-500"
                      )}
                    >
                      <option value="" className="dark:bg-zinc-900">Tanlang...</option>
                      {currentField.options?.map((opt) => (
                        <option key={opt.value} value={opt.value} className="dark:bg-zinc-900">
                          {opt.label[language as keyof typeof opt.label]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      {...register(currentField.id)}
                      placeholder="..."
                      className={cn(
                        "w-full px-4 py-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg text-gray-900 dark:text-zinc-100",
                        errors[currentField.id] && "border-red-500 focus:ring-red-500"
                      )}
                    />
                  )}
                  {errors[currentField.id] && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      {errors[currentField.id]?.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className={cn(
                    "px-6 py-3 text-sm font-bold rounded-xl transition-all",
                    currentStep === 0 ? "text-gray-300 dark:text-zinc-700 cursor-not-allowed" : "text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  )}
                >
                  Orqaga
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl shadow-lg-fallback"
                >
                  {currentStep === fields.length - 1 ? "Hujjatni yaratish" : "Keyingisi"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl shadow-xl-fallback text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full animate-ping opacity-25" />
              <div className="relative p-6 bg-blue-50 dark:bg-blue-950/40 rounded-full">
                <Sparkles className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-4">Hujjat tayyorlanmoqda...</h2>
            <p className="text-gray-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              AI siz kiritgan ma'lumotlarni rasmiy huquqiy tilga o'girmoqda. 
              Iltimos, bir necha soniya kuting.
            </p>
            <div className="mt-8 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generatsiya jarayoni...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

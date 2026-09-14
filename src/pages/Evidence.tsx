import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Briefcase, ShieldAlert, FolderOpen, AlertCircle, FileSpreadsheet } from "lucide-react";
import { EvidenceAnalyzer } from "../components/EvidenceAnalyzer";

interface CaseItem {
  id: string;
  title: string;
  category?: string;
  status: string;
  createdAt: number;
}

export function EvidencePage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(collection(db, "cases"), where("userId", "==", uid));
    console.log("[Firestore] listener attached: Evidence Cases");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CaseItem[];
        setCases(items);
        if (items.length > 0) {
          setSelectedCase((prev) => prev || items[0]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error loading cases for evidence:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      console.log("[Firestore] listener detached: Evidence Cases");
    };
  }, [auth.currentUser?.uid]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-gray-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Case Selector Left Column */}
      <div className="w-full lg:w-80 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">
            Ishlar Ro'yxati
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Dalillarni tahlil qilish uchun ishni tanlang
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white" />
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FolderOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500 dark:text-zinc-400">Hech qanday ish topilmadi. Avval "Ishlar" bo'limida yangi ish oching.</p>
            </div>
          ) : (
            cases.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`w-full text-left p-3 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                      : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Briefcase className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-white dark:text-zinc-950" : "text-gray-400"}`} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.title}</p>
                      <p className={`text-[10px] mt-0.5 ${isSelected ? "text-gray-300 dark:text-zinc-600" : "text-gray-400"}`}>
                        {c.category || "Ma'lumotlar yo'q"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Analyzer Right Workspace */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {selectedCase ? (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-2">
                <span>Moddiy Dalillar</span>
                <span>/</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">{selectedCase.title}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight">
                Aqlli Dalillar Analizatori
              </h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Ushbu bo'limda sud dalillarini import qiling, ularning isbotlash kuchini baholang va qarshi tomon argumentlarini tahlil qiling.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs overflow-hidden">
              {auth.currentUser && (
                <EvidenceAnalyzer
                  caseId={selectedCase.id}
                  userId={auth.currentUser.uid}
                  caseTitle={selectedCase.title}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
            <ShieldAlert className="w-12 h-12 text-gray-300 dark:text-zinc-700 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tanlangan ish mavjud emas</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm mt-1">
              Chap tarafdagi ro'yxatdan kerakli ishni tanlang yoki unga tegishli hujjatlarni tekshiring.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EvidencePage;

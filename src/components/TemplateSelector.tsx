import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Scale, Users, Briefcase, Home } from "lucide-react";
import { DOCUMENT_TEMPLATES } from "../constants";
import { Link } from "react-router-dom";
import { cn } from "@/src/lib/utils";

export function TemplateSelector({ isOpen, onClose, caseId }: { isOpen: boolean; onClose: () => void; caseId?: string }) {
  const categories = [
    { id: "fuqarolik", label: "Fuqarolik", icon: Scale },
    { id: "oila", label: "Oila", icon: Users },
    { id: "mehnat", label: "Mehnat", icon: Briefcase },
    { id: "ma'muriy", label: "Ma'muriy", icon: Scale },
    { id: "mulk", label: "Mulk", icon: Home },
    { id: "bank", label: "Bank", icon: Briefcase },
    { id: "meros", label: "Meros", icon: Users },
    { id: "uy-joy", label: "Uy-joy", icon: Home },
    { id: "shartnoma", label: "Shartnoma", icon: FileText },
    { id: "boshqa", label: "Boshqa", icon: FileText },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay-fallback"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden shadow-2xl-fallback"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Hujjat turini tanlang</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
              {categories.map((cat) => {
                const templates = DOCUMENT_TEMPLATES.filter((t) => t.category === cat.id);
                if (templates.length === 0) return null;

                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <cat.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm">{cat.label}</h3>
                    </div>
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <Link
                          key={template.id}
                          to={caseId ? `/builder/${template.id}?caseId=${caseId}` : `/builder/${template.id}`}
                          onClick={onClose}
                          className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                          <FileText className="w-5 h-5 text-gray-400 mr-3 group-hover:text-blue-600 transition-colors" />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                            {template.name.uz_lat}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

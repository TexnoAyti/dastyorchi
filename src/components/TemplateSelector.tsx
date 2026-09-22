import React from "react";
import { Link } from "react-router-dom";
import { FileText, Scale, Users, Briefcase, Home } from "lucide-react";
import { DOCUMENT_TEMPLATES } from "../constants";
import { ResponsiveModal } from "./common/ResponsivePrimitives";

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
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Hujjat turini tanlang"
      maxWidth="max-w-3xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
        {categories.map((cat) => {
          const templates = DOCUMENT_TEMPLATES.filter((t) => t.category === cat.id);
          if (templates.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
                  <cat.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">{cat.label}</h3>
              </div>
              <div className="space-y-2">
                {templates.map((template) => (
                  <Link
                    key={template.id}
                    to={caseId ? `/builder/${template.id}?caseId=${caseId}` : `/builder/${template.id}`}
                    onClick={onClose}
                    className="flex items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all group min-h-[44px]"
                  >
                    <FileText className="w-4 h-4 text-gray-400 mr-2.5 group-hover:text-blue-600 transition-colors shrink-0" />
                    <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {template.name.uz_lat}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ResponsiveModal>
  );
}

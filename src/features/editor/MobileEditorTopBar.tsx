import React, { useState } from "react";
import { ArrowLeft, MoreHorizontal, Check, Loader2, AlertCircle, Save } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface MobileEditorTopBarProps {
  title: string;
  onBack?: () => void;
  onOpenMore: () => void;
  saveStatus?: "saved" | "saving" | "unsaved" | "error";
  onManualSave?: () => void;
}

export function MobileEditorTopBar({
  title,
  onBack,
  onOpenMore,
  saveStatus = "saved",
  onManualSave,
}: MobileEditorTopBarProps) {
  const [showFullTitle, setShowFullTitle] = useState(false);

  return (
    <>
      <header
        style={{
          paddingTop: "max(8px, env(safe-area-inset-top, 8px))",
        }}
        className="sticky top-0 z-30 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-800 shrink-0 transition-colors"
      >
        <div className="flex items-center justify-between px-2.5 sm:px-3 h-12 gap-2">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Orqaga qaytish"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Document Title (tap to view full) */}
          <button
            type="button"
            onClick={() => setShowFullTitle(prev => !prev)}
            className="flex-1 min-w-0 text-left px-1 py-1 rounded-lg hover:bg-gray-100/60 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <span className="block text-xs font-bold text-gray-900 dark:text-zinc-50 truncate leading-tight">
              {title || "Yuridik Hujjat"}
            </span>
            <span className="block text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
              Mobil Muharrir
            </span>
          </button>

          {/* Right Actions: Save Status Indicator & More Menu Button */}
          <div className="flex items-center gap-1 shrink-0">
            {onManualSave && (
              <button
                type="button"
                onClick={onManualSave}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold min-h-[44px] transition-all cursor-pointer",
                  saveStatus === "saving" && "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
                  saveStatus === "saved" && "text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30",
                  saveStatus === "unsaved" && "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 font-bold",
                  saveStatus === "error" && "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                )}
                title="Hujjatni saqlash"
              >
                {saveStatus === "saving" && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden xs:inline">Saqlanmoqda...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden xs:inline">Saqlandi</span>
                  </>
                )}
                {saveStatus === "unsaved" && (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Saqlash</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Xato</span>
                  </>
                )}
              </button>
            )}

            {/* More Menu (...) */}
            <button
              type="button"
              onClick={onOpenMore}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              aria-label="Qo'shimcha amallar"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Full Title Dropdown/Banner */}
      {showFullTitle && (
        <div
          onClick={() => setShowFullTitle(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-2xs flex items-start justify-center pt-16 px-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-xl border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95"
          >
            <h4 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Hujjat Nomi
            </h4>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 break-words leading-relaxed">
              {title || "Yuridik Hujjat"}
            </p>
            <button
              type="button"
              onClick={() => setShowFullTitle(false)}
              className="w-full mt-3 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 text-xs font-bold rounded-xl min-h-[44px] cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </>
  );
}

import React from "react";
import { Editor } from "@tiptap/react";
import {
  Heading1,
  Heading2,
  Heading3,
  PenTool,
  FileText,
  Download,
  RemoveFormatting,
  X,
  FileCode,
  Check,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface EditorMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  onOpenSignature: () => void;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  isExporting?: boolean;
}

export function EditorMoreSheet({
  isOpen,
  onClose,
  editor,
  onOpenSignature,
  onExportPDF,
  onExportDOCX,
  isExporting = false,
}: EditorMoreSheetProps) {
  if (!isOpen || !editor) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div
        style={{
          paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
        }}
        className="relative z-10 w-full bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 rounded-t-[28px] shadow-2xl p-4 sm:p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 min-h-0"
      >
        {/* Swipe Handle */}
        <div className="w-10 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-50">
              Hujjat Amallari
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Formatlash, elektron imzo va yuklab olish
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 flex items-center justify-center cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Headings & Structure */}
        <div className="mb-5">
          <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-2.5">
            Sarlavhalar va Uslub
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                onClose();
              }}
              className={cn(
                "p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all min-h-[56px] cursor-pointer",
                editor.isActive("heading", { level: 1 })
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold"
                  : "bg-gray-50/70 border-gray-200/80 dark:bg-zinc-800/60 dark:border-zinc-700/60 text-gray-800 dark:text-zinc-200"
              )}
            >
              <Heading1 className="w-5 h-5" />
              <span className="text-xs">Sarlavha 1</span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                onClose();
              }}
              className={cn(
                "p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all min-h-[56px] cursor-pointer",
                editor.isActive("heading", { level: 2 })
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold"
                  : "bg-gray-50/70 border-gray-200/80 dark:bg-zinc-800/60 dark:border-zinc-700/60 text-gray-800 dark:text-zinc-200"
              )}
            >
              <Heading2 className="w-5 h-5" />
              <span className="text-xs">Sarlavha 2</span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                onClose();
              }}
              className={cn(
                "p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all min-h-[56px] cursor-pointer",
                editor.isActive("heading", { level: 3 })
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold"
                  : "bg-gray-50/70 border-gray-200/80 dark:bg-zinc-800/60 dark:border-zinc-700/60 text-gray-800 dark:text-zinc-200"
              )}
            >
              <Heading3 className="w-5 h-5" />
              <span className="text-xs">Sarlavha 3</span>
            </button>
          </div>
        </div>

        {/* Section 2: Pro & Export Actions */}
        <div className="mb-4">
          <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-2.5">
            Eksport va Imzolash
          </span>
          <div className="space-y-2">
            {/* Signature */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSignature();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70 transition-all min-h-[50px] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <PenTool className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold leading-tight">
                    Elektron Imzo Qo'yish
                  </span>
                  <span className="block text-[11px] text-emerald-600 dark:text-emerald-400">
                    Ekranga imzo chizib hujjat tubiga biriktirish
                  </span>
                </div>
              </div>
            </button>

            {/* PDF Export */}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => {
                onClose();
                onExportPDF();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50 text-red-800 dark:text-red-300 hover:bg-red-100/70 transition-all min-h-[50px] cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold leading-tight">
                    PDF formatida yuklash
                  </span>
                  <span className="block text-[11px] text-red-600 dark:text-red-400">
                    A4 standartidagi chop etish formati
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 text-red-500 shrink-0" />
            </button>

            {/* DOCX Export */}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => {
                onClose();
                onExportDOCX();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 hover:bg-blue-100/70 transition-all min-h-[50px] cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileCode className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold leading-tight">
                    Word (DOCX) yuklash
                  </span>
                  <span className="block text-[11px] text-blue-600 dark:text-blue-400">
                    Microsoft Word da tahrirlanuvchi fayl
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 text-blue-500 shrink-0" />
            </button>
          </div>
        </div>

        {/* Section 3: Format Cleanup */}
        <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().clearNodes().unsetAllMarks().run();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 p-3 text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors min-h-[44px] cursor-pointer"
          >
            <RemoveFormatting className="w-4 h-4" />
            <span>Formatlashni tozalash (Clear formatting)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

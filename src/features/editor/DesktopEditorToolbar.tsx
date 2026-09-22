import React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  RemoveFormatting,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  PenTool,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface DesktopEditorToolbarProps {
  editor: Editor | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onOpenSignature: () => void;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  isExporting?: boolean;
}

export function DesktopEditorToolbar({
  editor,
  zoom,
  onZoomChange,
  onOpenSignature,
  onExportPDF,
  onExportDOCX,
  isExporting = false,
}: DesktopEditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-2 sm:p-2.5 flex items-center justify-between gap-3 shrink-0 select-none">
      {/* Group 1: History, Style, Alignment & Headings */}
      <div className="flex items-center gap-1 flex-wrap overflow-x-auto">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
          title="Bekor qilish (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
          title="Qaytarish (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Text Styles */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive("bold")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Qalin (Bold)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive("italic")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Kursiv (Italic)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive("underline")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Tagi chizilgan (Underline)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive("heading", { level: 1 })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Sarlavha 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive("heading", { level: 2 })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Sarlavha 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive("heading", { level: 3 })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Sarlavha 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive({ textAlign: "left" })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Chapdan tekislash"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive({ textAlign: "center" })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Markazdan tekislash"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive({ textAlign: "right" })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="O'ngdan tekislash"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive("bulletList")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Markerli ro'yxat"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            editor.isActive("orderedList")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Raqamli ro'yxat"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        {/* Clear formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          title="Formatlashni tozalash"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* Group 2: Zoom & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Zoom */}
        <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-gray-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(zoom - 10, 50))}
            disabled={zoom <= 50}
            className="p-1 text-gray-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors disabled:opacity-30 cursor-pointer"
            title="Masshtabni kamaytirish (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-bold text-gray-700 dark:text-zinc-300 px-1.5 min-w-[38px] text-center select-none">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(zoom + 10, 150))}
            disabled={zoom >= 150}
            className="p-1 text-gray-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors disabled:opacity-30 cursor-pointer"
            title="Masshtabni oshirish (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons: Imzolash, PDF, Word */}
        <button
          type="button"
          onClick={onOpenSignature}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Elektron imzo chizish"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Imzolash</span>
        </button>

        <button
          type="button"
          onClick={onExportPDF}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70 rounded-lg border border-red-200/80 dark:border-red-800/60 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          title="PDF formatida yuklab olish"
        >
          {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          <span>PDF</span>
        </button>

        <button
          type="button"
          onClick={onExportDOCX}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70 rounded-lg border border-blue-200/80 dark:border-blue-800/60 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          title="Word (DOCX) formatida yuklab olish"
        >
          {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>Word</span>
        </button>
      </div>
    </div>
  );
}

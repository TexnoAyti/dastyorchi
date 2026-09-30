import React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  RemoveFormatting,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  PenTool,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Save,
  FileCode,
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
  title?: string;
  onTitleChange?: (title: string) => void;
  saveStatus?: "saved" | "saving" | "unsaved" | "error";
  onManualSave?: () => void;
  wordCount?: number;
  charCount?: number;
}

export function DesktopEditorToolbar({
  editor,
  zoom,
  onZoomChange,
  onOpenSignature,
  onExportPDF,
  onExportDOCX,
  isExporting = false,
  title = "Yuridik Hujjat",
  onTitleChange,
  saveStatus = "saved",
  onManualSave,
  wordCount = 0,
  charCount = 0,
}: DesktopEditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shrink-0 select-none flex flex-col">
      {/* Top Header Row: Document Title, Autosave Status, Word Stats, Zoom & Exports */}
      <div className="px-3 py-2 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-900/60">
        {/* Left: Document icon + Title + Save Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="w-4 h-4" />
          </div>
          {onTitleChange ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-xs sm:text-sm font-bold text-gray-900 dark:text-zinc-100 bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-zinc-700 focus:border-blue-500 rounded px-1.5 py-0.5 max-w-[260px] truncate focus:outline-none transition-colors"
              title="Hujjat nomini tahrirlash"
            />
          ) : (
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-zinc-100 truncate max-w-[260px]">
              {title}
            </span>
          )}

          {/* Save Status / Manual Save Button */}
          {onManualSave && (
            <button
              type="button"
              onClick={onManualSave}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer shrink-0 ml-1",
                saveStatus === "saving" && "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
                saveStatus === "saved" && "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
                saveStatus === "unsaved" && "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 font-semibold hover:bg-amber-100",
                saveStatus === "error" && "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
              )}
              title="Hujjatni saqlash"
            >
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Saqlandi</span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <>
                  <Save className="w-3 h-3 text-amber-600" />
                  <span>Saqlash</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  <span>Xato (qayta urinish)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right: Stats, Zoom, Signature & Exports */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Document Stats */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-zinc-400 font-mono bg-white dark:bg-zinc-800 px-2 py-1 rounded-md border border-gray-200/80 dark:border-zinc-700">
            <span>{wordCount} so&apos;z</span>
            <span className="text-gray-300 dark:text-zinc-600">&bull;</span>
            <span>{charCount} belgi</span>
          </div>

          {/* Zoom */}
          <div className="flex items-center bg-white dark:bg-zinc-800 rounded-md p-0.5 border border-gray-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => onZoomChange(Math.max(zoom - 10, 50))}
              disabled={zoom <= 50}
              className="p-1 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors disabled:opacity-30 cursor-pointer"
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
              className="p-1 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors disabled:opacity-30 cursor-pointer"
              title="Masshtabni oshirish (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Imzolash */}
          <button
            type="button"
            onClick={onOpenSignature}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70 rounded-md border border-emerald-200/80 dark:border-emerald-800/60 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Elektron imzo chekish"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Imzolash</span>
          </button>

          {/* PDF Export */}
          <button
            type="button"
            onClick={onExportPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70 rounded-md border border-red-200/80 dark:border-red-800/60 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            title="PDF formatida yuklab olish"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            <span>PDF</span>
          </button>

          {/* DOCX Export */}
          <button
            type="button"
            onClick={onExportDOCX}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70 rounded-md border border-blue-200/80 dark:border-blue-800/60 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            title="Word (DOCX) formatida yuklab olish"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCode className="w-3.5 h-3.5" />}
            <span>Word</span>
          </button>
        </div>
      </div>

      {/* Main Formatting Row (Microsoft Word Ribbon Style) */}
      <div className="px-2.5 py-1.5 flex items-center gap-1 flex-wrap overflow-x-auto">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-md text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
          title="Bekor qilish (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-md text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
          title="Qaytarish (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Font Family Indicator (Times New Roman - Legal Standard) */}
        <div className="hidden sm:flex items-center px-2 py-1 text-xs font-serif font-medium bg-gray-50 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 rounded border border-gray-200 dark:border-zinc-700 shrink-0">
          <span>Times New Roman (14pt)</span>
        </div>

        <div className="hidden sm:block w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive("heading", { level: 1 })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Sarlavha 1 (H1)"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive("heading", { level: 2 })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Sarlavha 2 (H2)"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive("heading", { level: 3 })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Sarlavha 3 (H3)"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Text Styles: Bold, Italic, Underline, Strike */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive("bold")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Qalin (Bold) - Ctrl+B"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive("italic")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Kursiv (Italic) - Ctrl+I"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive("underline")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Tagi chizilgan (Underline) - Ctrl+U"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive("strike")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="O'chirilgan (Strikethrough)"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Alignment: Left, Center, Right, Justify (CRITICAL for Legal Docs) */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
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
            "p-1.5 rounded-md transition-colors cursor-pointer",
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
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive({ textAlign: "right" })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="O'ngdan tekislash"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive({ textAlign: "justify" })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Ikki tomondan tekislash (Justify - rasmiy yuridik standart)"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
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
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive("orderedList")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Raqamli ro'yxat"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Quote & Horizontal Rule */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
            editor.isActive("blockquote")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          title="Iqtibos / Qonun moddasi bloki"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-md text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          title="Ajratuvchi chiziq qo'shish"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0" />

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          title="Formatlashni tozalash"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { Editor } from "@tiptap/react";
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface MobileEditorToolbarProps {
  editor: Editor | null;
  onOpenMore: () => void;
  keyboardHeight?: number;
}

export function MobileEditorToolbar({
  editor,
  onOpenMore,
  keyboardHeight = 0,
}: MobileEditorToolbarProps) {
  if (!editor) return null;

  // Alignment cycling helper
  const handleAlignToggle = () => {
    if (editor.isActive({ textAlign: "center" })) {
      editor.chain().focus().setTextAlign("right").run();
    } else if (editor.isActive({ textAlign: "right" })) {
      editor.chain().focus().setTextAlign("left").run();
    } else {
      editor.chain().focus().setTextAlign("center").run();
    }
  };

  const getAlignCurrentIcon = () => {
    if (editor.isActive({ textAlign: "center" })) return <AlignCenter className="w-4 h-4" />;
    if (editor.isActive({ textAlign: "right" })) return <AlignRight className="w-4 h-4" />;
    return <AlignLeft className="w-4 h-4" />;
  };

  return (
    <div
      style={{
        paddingBottom: keyboardHeight > 0 ? "0px" : "max(8px, env(safe-area-inset-bottom, 8px))",
      }}
      className="sticky bottom-0 z-30 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-zinc-800 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center px-1.5 py-1 overflow-x-auto no-scrollbar gap-1 w-full overscroll-x-contain">
        {/* Undo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
          aria-label="Bekor qilish (Undo)"
        >
          <Undo className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
          aria-label="Qaytarish (Redo)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all cursor-pointer shrink-0",
            editor.isActive("bold")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 font-bold"
              : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          aria-label="Qalin (Bold)"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all cursor-pointer shrink-0",
            editor.isActive("italic")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 font-bold"
              : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          aria-label="Kursiv (Italic)"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all cursor-pointer shrink-0",
            editor.isActive("underline")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 font-bold"
              : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          aria-label="Tagi chizilgan (Underline)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all cursor-pointer shrink-0",
            editor.isActive("bulletList")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
              : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          aria-label="Markerli ro'yxat"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all cursor-pointer shrink-0",
            editor.isActive("orderedList")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
              : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
          )}
          aria-label="Raqamli ro'yxat"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        {/* Align Toggle */}
        <button
          type="button"
          onClick={handleAlignToggle}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          aria-label="Matnni tekislash"
          title="Tekislash (chap / markaz / o'ng)"
        >
          {getAlignCurrentIcon()}
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

        {/* More Actions Trigger */}
        <button
          type="button"
          onClick={onOpenMore}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
          aria-label="Ko'proq amallar (More)"
          title="Sarlavhalar, Imzo va Eksport"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

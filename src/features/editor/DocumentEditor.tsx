import React, { useState, useEffect, useRef, memo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import html2pdf from "html2pdf.js";
import { saveAs } from "file-saver";
import { SignaturePad } from "../../components/SignaturePad";
import { cleanAndValidateHTML } from "../../services/aiService";
import { auth } from "../../firebase";
import { checkExportQuota, incrementUserExports } from "../../services/subscriptionService";
import { usePaywall } from "../../contexts/PaywallContext";
import { generateMeaningfulFilename } from "../../utils/documentNaming";
import { errorLogger } from "../../services/errorLoggingService";
import { getFriendlyErrorMessage } from "../../utils/errorFriendly";
import { useViewport } from "../../contexts/ViewportContext";
import { MobileEditorTopBar } from "./MobileEditorTopBar";
import { MobileEditorToolbar } from "./MobileEditorToolbar";
import { EditorMoreSheet } from "./EditorMoreSheet";
import { DesktopEditorToolbar } from "./DesktopEditorToolbar";
import { ResponsiveModal } from "../../components/common/ResponsivePrimitives";

export interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => any;
  title?: string;
  templateId?: string;
  userRequest?: string;
  onBack?: () => void;
  saveStatus?: "saved" | "saving" | "unsaved" | "error";
  onManualSave?: () => void;
}

export const DocumentEditor = memo(function DocumentEditor({
  content,
  onChange,
  title = "Yuridik Hujjat",
  templateId,
  userRequest,
  onBack,
  saveStatus = "saved",
  onManualSave,
}: DocumentEditorProps) {
  const { openPaywall } = usePaywall();
  const { isMobile, keyboardHeight, setIsFullScreenEditorOpen } = useViewport();

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Zoom for desktop mode
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("editor_zoom");
      if (saved) {
        const val = parseInt(saved, 10);
        if (val >= 50 && val <= 150) return val;
      }
    }
    return 100;
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Inform ViewportContext that mobile full screen editor is active
  useEffect(() => {
    if (isMobile) {
      setIsFullScreenEditorOpen(true);
      return () => {
        setIsFullScreenEditorOpen(false);
      };
    }
  }, [isMobile, setIsFullScreenEditorOpen]);

  // TipTap Editor instance (Single source of truth)
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: cleanAndValidateHTML(content),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: isMobile
          ? "prose dark:prose-invert prose-base mx-auto focus:outline-none min-h-[calc(100vh-180px)] bg-transparent text-gray-900 dark:text-zinc-100 p-3 sm:p-4 shadow-none border-0 rounded-none break-words [overflow-wrap:anywhere] w-full leading-relaxed"
          : "prose dark:prose-invert prose-sm sm:prose lg:prose-lg mx-auto focus:outline-none min-h-[800px] bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 p-8 sm:p-12 shadow-md border border-gray-200/90 dark:border-zinc-800 rounded-sm break-words [overflow-wrap:anywhere] w-full leading-relaxed",
      },
    },
  });

  // Keep editor content in sync when incoming content updates
  useEffect(() => {
    if (editor && content) {
      const cleaned = cleanAndValidateHTML(content);
      if (cleaned !== editor.getHTML()) {
        editor.commands.setContent(cleaned, false as any);
      }
    }
  }, [content, editor]);

  // Keep cursor / active paragraph in view when keyboard opens on mobile
  useEffect(() => {
    if (!isMobile || !editor || keyboardHeight <= 0) return;

    const timer = setTimeout(() => {
      try {
        const { from } = editor.state.selection;
        const domAtPos = editor.view.domAtPos(from);
        const node = domAtPos.node as HTMLElement;
        const targetElement = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;

        if (targetElement && scrollContainerRef.current) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } catch (e) {
        // Fallback gracefully
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [keyboardHeight, isMobile, editor]);

  if (!editor) return null;

  // PDF Export
  const exportPDF = async () => {
    if (!editor || isExporting) return;
    try {
      setIsExporting(true);

      if (auth.currentUser) {
        const quota = await checkExportQuota(auth.currentUser.uid);
        if (!quota.allowed) {
          setIsExporting(false);
          openPaywall("exports");
          return;
        }
      }

      const htmlContent = editor.getHTML();
      if (!htmlContent || htmlContent === "<p></p>" || htmlContent.trim() === "") {
        alert("Hujjat bo'sh. Yuklab olish uchun matn kiriting.");
        setIsExporting(false);
        return;
      }

      const pdfFilename = generateMeaningfulFilename({
        content: htmlContent,
        title,
        templateId,
        userRequest,
        type: "document",
        extension: "pdf",
      });

      const styledHtml = `
        <div style="font-family: 'Times New Roman', serif; font-size: 14pt; padding: 20mm; line-height: 1.5; color: black; background: white;">
          ${htmlContent}
        </div>
      `;

      const opt = {
        margin: 0,
        filename: pdfFilename,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 1, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as "portrait" },
      };

      await html2pdf().set(opt).from(styledHtml).save();

      if (auth.currentUser) {
        await incrementUserExports(auth.currentUser.uid);
      }
    } catch (error: any) {
      console.error("PDF export error: ", error);
      errorLogger.log("pdf_export", "ExportError", error, `PDF output generation failed: ${error.message || error}`);
      const friendlyMsg = getFriendlyErrorMessage(error, "uz_lat");
      alert(friendlyMsg);
    } finally {
      setIsExporting(false);
    }
  };

  // DOCX Export
  const exportDOCX = async () => {
    if (!editor || isExporting) return;
    try {
      setIsExporting(true);

      if (auth.currentUser) {
        const quota = await checkExportQuota(auth.currentUser.uid);
        if (!quota.allowed) {
          setIsExporting(false);
          openPaywall("exports");
          return;
        }
      }

      const htmlContent = editor.getHTML();
      if (!htmlContent || htmlContent === "<p></p>" || htmlContent.trim() === "") {
        alert("Hujjat bo'sh. Yuklab olish uchun matn kiriting.");
        setIsExporting(false);
        return;
      }

      const docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Document</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 14pt; color: black; }
            p { margin: 0 0 10pt 0; line-height: 1.5; }
            h1, h2, h3 { font-family: 'Times New Roman', serif; font-weight: bold; }
            ul, ol { margin-bottom: 10pt; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      const docxFilename = generateMeaningfulFilename({
        content: htmlContent,
        title,
        templateId,
        userRequest,
        type: "document",
        extension: "docx",
      });

      const blob = new Blob(["\ufeff" + docHtml], { type: "application/msword" });
      saveAs(blob, docxFilename);

      if (auth.currentUser) {
        await incrementUserExports(auth.currentUser.uid);
      }
    } catch (error: any) {
      console.error("DOCX export error: ", error);
      errorLogger.log("docx_export", "ExportError", error, `DOCX output generation failed: ${error.message || error}`);
      const friendlyMsg = getFriendlyErrorMessage(error, "uz_lat");
      alert(friendlyMsg);
    } finally {
      setIsExporting(false);
    }
  };

  // Electronic Signature insertion
  const handleSignatureSave = async (dataUrl: string) => {
    if (!editor) return;

    try {
      editor.commands.focus();
      editor.commands.insertContent(`
        <p></p>
        <p style="text-align: right;"><strong>Imzolandi:</strong></p>
        <p style="text-align: right;"><img src="${dataUrl}" alt="Elektron imzo" style="max-height: 70px; display: inline-block;" /></p>
        <p style="text-align: right;"><span style="font-size: 12px; color: #666;">Sana: ${new Date().toLocaleDateString()}</span></p>
        <p></p>
      `);

      const currentHtml = editor.getHTML();
      const savePromise = onChange(currentHtml);
      if (savePromise instanceof Promise) {
        await savePromise;
      }
    } catch (error: any) {
      console.error("Signature save error:", error);
      alert(`Imzoni biriktirishda xatolik yuz berdi: ${error.message || error}`);
    } finally {
      setIsSignModalOpen(false);
    }
  };

  const handleZoomChange = (nextZoom: number) => {
    setZoom(nextZoom);
    sessionStorage.setItem("editor_zoom", nextZoom.toString());
  };

  /* =========================================================================
   * PRESENTATION 1: MOBILE MODE (< 768px)
   * True full-screen mobile workspace, NO artificial A4 paper card borders,
   * sticky top bar, sticky formatting bar directly above virtual keyboard.
   * ======================================================================= */
  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 overflow-hidden relative">
        {/* 1. Mobile Editor Top Bar */}
        <MobileEditorTopBar
          title={title}
          onBack={onBack}
          onOpenMore={() => setIsMoreSheetOpen(true)}
          saveStatus={saveStatus}
          onManualSave={onManualSave}
        />

        {/* 2. Mobile Writing Workspace (Clean full-width reading margins) */}
        <div
          ref={scrollContainerRef}
          onClick={() => {
            if (editor && !editor.isFocused) {
              editor.commands.focus("end");
            }
          }}
          className="flex-1 overflow-y-auto min-h-0 overscroll-contain px-3 py-3 sm:px-4 bg-white dark:bg-zinc-950"
        >
          <div className="w-full max-w-none mx-auto">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* 3. Mobile Formatting Bar (Sticky above keyboard) */}
        <MobileEditorToolbar
          editor={editor}
          onOpenMore={() => setIsMoreSheetOpen(true)}
          keyboardHeight={keyboardHeight}
        />

        {/* 4. More Sheet (Bottom Sheet Modal) */}
        <EditorMoreSheet
          isOpen={isMoreSheetOpen}
          onClose={() => setIsMoreSheetOpen(false)}
          editor={editor}
          onOpenSignature={() => setIsSignModalOpen(true)}
          onExportPDF={exportPDF}
          onExportDOCX={exportDOCX}
          isExporting={isExporting}
        />

        {/* 5. Signature Modal (Responsive Sheet on Mobile) */}
        <ResponsiveModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          title="Elektron Imzo"
          description="Ekranga barmog'ingiz bilan imzo cheking"
          fullScreenOnMobile={false}
        >
          <SignaturePad
            onSave={handleSignatureSave}
            onCancel={() => setIsSignModalOpen(false)}
          />
        </ResponsiveModal>
      </div>
    );
  }

  /* =========================================================================
   * PRESENTATION 2: DESKTOP MODE (>= 768px)
   * Word-like experience, A4 page view, centered, paper shadow, max-w-[210mm],
   * full toolbar with groups, zoom controls.
   * ======================================================================= */
  return (
    <div className="flex flex-col h-full w-full bg-gray-100/70 dark:bg-zinc-950 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 min-h-0">
      {/* Desktop Word-Like Toolbar */}
      <DesktopEditorToolbar
        editor={editor}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onOpenSignature={() => setIsSignModalOpen(true)}
        onExportPDF={exportPDF}
        onExportDOCX={exportDOCX}
        isExporting={isExporting}
      />

      {/* A4 Workspace View */}
      <div
        ref={scrollContainerRef}
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.commands.focus("end");
          }
        }}
        className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-200/50 dark:bg-zinc-950 overscroll-contain"
      >
        <div
          className="w-full max-w-[210mm] mx-auto transition-transform duration-150 ease-out"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Signature Modal on Desktop */}
      <ResponsiveModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        title="Elektron Imzo"
        description="Imzoingizni chizing va hujjatga biriktiring"
        maxWidth="max-w-md"
      >
        <SignaturePad
          onSave={handleSignatureSave}
          onCancel={() => setIsSignModalOpen(false)}
        />
      </ResponsiveModal>
    </div>
  );
});

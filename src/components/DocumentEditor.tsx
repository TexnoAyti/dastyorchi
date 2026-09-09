import React, { useState, memo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  AlignLeft, AlignCenter, AlignRight, 
  Heading1, Heading2, Heading3,
  Download, FileText, PenTool,
  ZoomIn, ZoomOut
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { saveAs } from 'file-saver';
import { SignaturePad } from './SignaturePad';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { cleanAndValidateHTML } from '../services/aiService';
import { auth } from '../firebase';
import { checkExportQuota, incrementUserExports } from '../services/subscriptionService';
import { usePaywall } from '../contexts/PaywallContext';
import { generateMeaningfulFilename } from '../utils/documentNaming';
import { errorLogger } from '../services/errorLoggingService';
import { getFriendlyErrorMessage } from '../utils/errorFriendly';

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => any;
  title?: string;
  templateId?: string;
  userRequest?: string;
}

export const DocumentEditor = memo(function DocumentEditor({ content, onChange, title, templateId, userRequest }: DocumentEditorProps) {
  const { openPaywall } = usePaywall();
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("editor_zoom");
      if (saved) {
        const val = parseInt(saved, 10);
        if (val >= 50 && val <= 150) return val;
      }
    }
    return 100; // Default to 100%
  });
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: cleanAndValidateHTML(content),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[800px] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-4 sm:p-12 shadow-sm border border-gray-200 dark:border-zinc-800',
      },
    },
  });

  // 6. DEBUG: Added log
  React.useEffect(() => {
    if (editor && content) {
      const cleaned = cleanAndValidateHTML(content);
      console.log("AI DOCUMENT (CLEANED):", cleaned);
      
      // 1. SINGLE SOURCE OF TRUTH: Only comes from aiResponse.document (passed as content)
      // 5. PREVENT OVERRIDE: Disable any other setContent calls and only set if new
      if (cleaned !== editor.getHTML()) {
        editor.commands.setContent(cleaned, false as any);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const editorRef = React.useRef<HTMLDivElement>(null);

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
      if (!htmlContent || htmlContent === '<p></p>' || htmlContent.trim() === '') {
        alert("Hujjat bo'sh. Yuklab olish uchun narsa yo'q.");
        setIsExporting(false);
        return;
      }

      const pdfFilename = generateMeaningfulFilename({
        content: htmlContent,
        title,
        templateId,
        userRequest,
        type: "document",
        extension: "pdf"
      });

      const styledHtml = `
        <div style="font-family: 'Times New Roman', serif; font-size: 14pt; padding: 20mm; line-height: 1.5; color: black; background: white;">
          ${htmlContent}
        </div>
      `;

      const opt = {
        margin:       0,
        filename:     pdfFilename,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 1, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as "portrait" }
      };

      await html2pdf().set(opt).from(styledHtml).save();

      if (auth.currentUser) {
        await incrementUserExports(auth.currentUser.uid);
      }
      
      console.log("Signature exported");
    } catch (error: any) {
      console.error("PDF export error: ", error);
      errorLogger.log("pdf_export", "ExportError", error, `PDF output generation failed: ${error.message || error}`);
      const friendlyMsg = getFriendlyErrorMessage(error, "uz_lat");
      alert(friendlyMsg);
    } finally {
      setIsExporting(false);
    }
  };

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
      if (!htmlContent || htmlContent === '<p></p>' || htmlContent.trim() === '') {
        alert("Hujjat bo'sh. Yuklab olish uchun narsa yo'q.");
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
        extension: "docx"
      });

      const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
      saveAs(blob, docxFilename);

      if (auth.currentUser) {
        await incrementUserExports(auth.currentUser.uid);
      }

      console.log("Signature exported");
    } catch (error: any) {
      console.error("DOCX export error: ", error);
      errorLogger.log("docx_export", "ExportError", error, `DOCX output generation failed: ${error.message || error}`);
      const friendlyMsg = getFriendlyErrorMessage(error, "uz_lat");
      alert(friendlyMsg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignatureSave = async (dataUrl: string) => {
    if (!editor) {
      alert("Signature insert failed. Editor is not initialized.");
      return;
    }

    // 1. Step: insert
    try {
      editor.commands.focus();
      
      // Let's insert the signature block beautifully formatted with standard schemas
      editor.commands.insertContent(`
        <p></p>
        <p style="text-align: right;"><strong>Imzolandi:</strong></p>
        <p style="text-align: right;"><img src="${dataUrl}" alt="Elektron imzo" /></p>
        <p style="text-align: right;"><span style="font-size: 12px; color: #666;">Sana: ${new Date().toLocaleDateString()}</span></p>
        <p></p>
      `);

      // Verify insertion in Tiptap
      const currentHtml = editor.getHTML();
      console.log("TS: Signature captured & inserted check");
      if (!currentHtml.includes("data:image/") && !currentHtml.includes("img") && !currentHtml.includes(dataUrl.substring(0, 30))) {
        throw new Error("Base64 image node was rejected or stripped by Tiptap editor.");
      }

      console.log("Signature captured");
      console.log("Signature inserted");
    } catch (error: any) {
      console.error("Signature design failed around 'insert' step:", error);
      alert(`Signature insert failed during 'insert' step. Error details: ${error.message || error}`);
      setIsSignModalOpen(false);
      return;
    }

    // 2. Step: save
    try {
      const currentHtml = editor.getHTML();
      // Try calling onChange asynchronously to persist to database
      const savePromise = onChange(currentHtml);
      if (savePromise instanceof Promise) {
        await savePromise;
      }
      
      console.log("Signature saved");
      console.log("Signature persisted after saving document");
    } catch (error: any) {
      console.error("Signature save failed:", error);
      alert(`Signature save failed during 'save' step (Firestore writing failed). Error details: ${error.message || error}`);
    } finally {
      setIsSignModalOpen(false);
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-gray-50 dark:bg-zinc-950 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 min-h-[450px] flex-1"
      style={{ minHeight: "450px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", visibility: "visible", opacity: 1 }}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('bold') ? 'bg-gray-200 text-blue-600 dark:bg-zinc-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('italic') ? 'bg-gray-200 text-blue-600 dark:bg-zinc-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('underline') ? 'bg-gray-200 text-blue-600 dark:bg-zinc-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'}`}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-zinc-700 mx-1" />
          
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-blue-600 dark:bg-zinc-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'}`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-blue-600 dark:bg-zinc-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'}`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-blue-600 dark:bg-zinc-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'}`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-zinc-700 mx-1" />

          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-blue-600 dark:bg-zinc-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'}`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-blue-600 dark:bg-zinc-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'}`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-blue-600 dark:bg-zinc-700 dark:text-blue-400' : 'text-gray-600 dark:text-zinc-400'}`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-zinc-700 mx-1 hidden sm:block" />

          {/* Zoom Controls */}
          <div className="flex items-center bg-gray-50 dark:bg-zinc-950 rounded-xl p-1 border border-gray-200/80 dark:border-zinc-800/85 shadow-sm" title="Ko'rinish masshtabi">
            <button
               type="button"
              onClick={() => {
                const next = Math.max(zoom - 10, 50);
                setZoom(next);
                sessionStorage.setItem("editor_zoom", next.toString());
              }}
              className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200/50 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer disabled:opacity-40"
              title="Kichiklashtirish (-)"
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-gray-700 dark:text-zinc-300 px-2 min-w-[42px] text-center select-none">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => {
                const next = Math.min(zoom + 10, 150);
                setZoom(next);
                sessionStorage.setItem("editor_zoom", next.toString());
              }}
              className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200/50 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer disabled:opacity-40"
              title="Kattalashtirish (+)"
              disabled={zoom >= 150}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSignModalOpen(true)}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-lg transition-colors disabled:opacity-50"
          >
            <PenTool className="w-4 h-4" />
            Imzolash
          </button>
          <button
            onClick={exportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {isExporting ? 'Yuklanmoqda...' : 'PDF'}
          </button>
          <button
            onClick={exportDOCX}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Yuklanmoqda...' : 'Word'}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100 dark:bg-zinc-950">
        <div 
          className="w-full max-w-[210mm] mx-auto transition-all duration-200 ease-in-out" 
          ref={editorRef}
          style={{ zoom: `${zoom}%`, transformOrigin: 'top center' }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Signature Modal */}
      {isSignModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SignaturePad 
            onSave={handleSignatureSave} 
            onCancel={() => setIsSignModalOpen(false)} 
          />
        </div>
      )}
    </div>
  );
});

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Paperclip, X, Mic, MicOff, Send, FileText } from "lucide-react";
import { Language } from "../types";
import { extractRawText } from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Standardize PDF.js worker CDN for inline extraction
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ChatInputRef {
  setInputValue: (val: string) => void;
  focus: () => void;
  clear: () => void;
}

interface ChatInputProps {
  onSubmit: (text: string, files: Array<{ name: string; type: string; data: string }>) => void;
  isLoading: boolean;
  language: Language | "en";
  aiMode: "study" | "document";
  openDocModal: () => void;
  isGeneratingDoc: boolean;
  messagesLength: number;
  retryMessage: string;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  onSubmit,
  isLoading,
  language,
  aiMode,
  openDocModal,
  isGeneratingDoc,
  messagesLength,
  retryMessage
}, ref) => {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ name: string; type: string; data: string }>>([]);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const previousInputRef = useRef("");

  useImperativeHandle(ref, () => ({
    setInputValue: (val: string) => {
      setInput(val);
      if (textareaRef.current) {
        textareaRef.current.value = val;
        // Adjust text area height
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    },
    focus: () => {
      textareaRef.current?.focus();
    },
    clear: () => {
      setInput("");
      setSelectedFiles([]);
    }
  }));

  // Auto-resize textarea
  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [input]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            const separator = previousInputRef.current && currentTranscript ? ' ' : '';
            setInput(previousInputRef.current + separator + currentTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error in ChatInput", event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setSpeechError("Microphone access required");
          } else if (event.error === 'no-speech') {
            setSpeechError("Try again");
          } else {
            setSpeechError("Voice recognition error");
          }
          setTimeout(() => setSpeechError(null), 3000);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  // Update voice speech recognition language
  useEffect(() => {
    if (recognitionRef.current) {
      if (language === "uz_lat" || language === "uz_cyr") {
        recognitionRef.current.lang = 'uz-UZ';
      } else if (language === "ru") {
        recognitionRef.current.lang = 'ru-RU';
      } else {
        recognitionRef.current.lang = 'en-US';
      }
    }
  }, [language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setSpeechError("Browser does not support voice recognition");
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition", e);
      }
      setIsRecording(false);
    } else {
      setSpeechError(null);
      try {
        previousInputRef.current = input;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (startErr: any) {
        console.error("Failed to start recognition", startErr);
        if (startErr.name === 'InvalidStateError') {
          setIsRecording(true);
        } else {
          setIsRecording(false);
          setSpeechError("Voice recognition error");
          setTimeout(() => setSpeechError(null), 3000);
        }
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.name.endsWith('.doc')) {
        alert("Eski .doc formati qo'llab-quvvatlanmaydi. Iltimos .docx yoki .pdf formatida yuklang.");
        continue;
      }

      if (file.name.endsWith('.docx') || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await extractRawText({ arrayBuffer });
          const base64 = btoa(unescape(encodeURIComponent(result.value)));
          
          setSelectedFiles(prev => [...prev, {
            name: file.name,
            type: 'text/plain',
            data: `data:text/plain;base64,${base64}`
          }]);
        } catch (error) {
          console.error("DOCX xatosi:", error);
          alert(`${file.name} hujjatini o'qishda xatolik yuz berdi.`);
        }
      } else if (file.name.toLowerCase().endsWith('.pdf') || file.type === "application/pdf") {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let textContent = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textObj = await page.getTextContent();
            const pageText = textObj.items.map((item: any) => item.str).join(" ");
            textContent += pageText + "\n";
          }
          
          const hasAlphaNumeric = /[a-zA-Z0-9\u0400-\u04FF]/.test(textContent);
          if (!textContent.trim() || !hasAlphaNumeric) {
            textContent = "PDF contains no extractable text. OCR processing required.";
          }
          
          const base64 = btoa(unescape(encodeURIComponent(textContent)));
          
          setSelectedFiles(prev => [...prev, {
            name: file.name,
            type: 'text/plain',
            data: `data:text/plain;base64,${base64}`
          }]);
        } catch (error) {
          console.error("PDF xatosi:", error);
          const base64Fail = btoa(unescape(encodeURIComponent("PDF contains no extractable text. OCR processing required.")));
          setSelectedFiles(prev => [...prev, {
            name: file.name,
            type: 'text/plain',
            data: `data:text/plain;base64,${base64Fail}`
          }]);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSelectedFiles(prev => [...prev, {
              name: file.name,
              type: file.type,
              data: event.target!.result as string
            }]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    onSubmit(input.trim(), selectedFiles);
    setInput("");
    setSelectedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-white/30 backdrop-blur-md border-t border-white/40 relative w-full min-w-0">
      {speechError && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          {speechError}
        </div>
      )}
      {selectedFiles.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 glass-scrollbar animate-in fade-in slide-in-from-bottom-1">
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-white/80 backdrop-blur-md border border-white/50 text-blue-900 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shadow-sm">
              <Paperclip className="w-3 h-3 text-blue-500" />
              <span className="truncate max-w-[120px] font-medium">{file.name}</span>
              <button 
                type="button" 
                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} 
                className="hover:text-red-500 ml-1 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2 items-end w-full min-w-0">
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="image/*,.pdf,.doc,.docx"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 sm:p-3 min-w-[40px] sm:min-w-[44px] min-h-[44px] rounded-[16px] flex items-center justify-center transition-all bg-white/60 hover:bg-white/90 text-blue-600 shadow-sm border border-white/50 cursor-pointer shrink-0"
        >
          <Paperclip className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
        <button
          type="button"
          onClick={toggleRecording}
          className={`p-2.5 sm:p-3 min-w-[40px] sm:min-w-[44px] min-h-[44px] rounded-[16px] flex items-center justify-center transition-all shadow-sm border border-white/50 cursor-pointer shrink-0 ${
            isRecording 
              ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] border-red-400" 
              : "bg-white/60 hover:bg-white/90 text-blue-600"
          }`}
        >
          {isRecording ? <MicOff className="w-4 sm:w-5 h-4 sm:h-5 animate-pulse" /> : <Mic className="w-4 sm:w-5 h-4 sm:h-5" />}
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onInput={autoResize}
          onKeyDown={handleKeyDown}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? "Listening..." : "Xabar yozing..."}
          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-sm/relaxed bg-white/60 backdrop-blur-md border border-white/50 rounded-[20px] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none resize-none overflow-y-auto glass-scrollbar shadow-inner text-gray-800 placeholder:text-gray-400 transition-all font-medium"
          style={{ minHeight: '44px', maxHeight: '160px' }}
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
          className="p-2.5 sm:p-3 min-w-[40px] sm:min-w-[44px] h-[44px] bg-blue-600 text-white rounded-[16px] hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shrink-0"
        >
          <Send className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
      </form>
      {aiMode === "document" && (
        <div className="flex gap-2 mt-3 animate-in fade-in duration-500">
          <button
            type="button"
            onClick={openDocModal}
            disabled={isGeneratingDoc || messagesLength < 2}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold tracking-wide rounded-[16px] hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 flex-col cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2">
              {isGeneratingDoc ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  Yaratilmoqda...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Hujjat Yaratish
                </>
              )}
            </div>
            {isGeneratingDoc && retryMessage && (
              <span className="text-xs text-indigo-100 mt-1 animate-pulse whitespace-pre-wrap px-2 text-center">{retryMessage}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
});

ChatInput.displayName = "ChatInput";

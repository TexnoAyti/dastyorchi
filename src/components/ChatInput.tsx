import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { Paperclip, X, Mic, MicOff, Send, FileText, Loader2, CheckCircle2, AlertCircle, RotateCw, Image as ImageIcon } from "lucide-react";
import { Language, ChatAttachment, AttachmentStatus } from "../types";
import { useViewport } from "../contexts/ViewportContext";
import { auth } from "../firebase";
import {
  validateAttachmentFile,
  uploadAndProcessAttachment,
  cancelAttachment,
  getCachedFile,
  removeAttachmentCache
} from "../services/attachmentService";

export interface ChatInputRef {
  setInputValue: (val: string) => void;
  focus: () => void;
  clear: () => void;
}

interface ChatInputProps {
  onSubmit: (text: string, attachments: ChatAttachment[]) => void;
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
  const { keyboardHeight, isMobile } = useViewport();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const previousInputRef = useRef("");

  useImperativeHandle(ref, () => ({
    setInputValue: (val: string) => {
      setInput(val);
      if (textareaRef.current) {
        textareaRef.current.value = val;
        textareaRef.current.style.height = "auto";
        const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 44), 140);
        textareaRef.current.style.height = `${newHeight}px`;
      }
    },
    focus: () => {
      textareaRef.current?.focus();
    },
    clear: () => {
      setInput("");
      // Clean up active attachments
      attachments.forEach(att => {
        cancelAttachment(att.id, att.storagePath);
        removeAttachmentCache(att.id);
      });
      setAttachments([]);
    }
  }));

  // Auto-resize textarea
  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 44), 140);
      textareaRef.current.style.height = `${newHeight}px`;
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
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            const separator = previousInputRef.current && currentTranscript ? " " : "";
            setInput(previousInputRef.current + separator + currentTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error in ChatInput", event.error);
          setIsRecording(false);
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setSpeechError("Microphone access required");
          } else if (event.error === "no-speech") {
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

  // Update speech recognition language
  useEffect(() => {
    if (recognitionRef.current) {
      if (language === "uz_lat" || language === "uz_cyr") {
        recognitionRef.current.lang = "uz-UZ";
      } else if (language === "ru") {
        recognitionRef.current.lang = "ru-RU";
      } else {
        recognitionRef.current.lang = "en-US";
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
        if (startErr.name === "InvalidStateError") {
          setIsRecording(true);
        } else {
          setIsRecording(false);
          setSpeechError("Voice recognition error");
          setTimeout(() => setSpeechError(null), 3000);
        }
      }
    }
  };

  // Update or append attachment in state
  const handleAttachmentUpdate = useCallback((updated: ChatAttachment) => {
    setAttachments(prev => {
      const idx = prev.findIndex(a => a.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
  }, []);

  // Handle file selection: Client validation -> Resumable upload -> Server processing
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setGeneralError("Fayl yuklash uchun avval tizimga kiring.");
      setTimeout(() => setGeneralError(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    for (const file of Array.from(files)) {
      // 1. Client-Side Defensive Validation (Limit 8MB, MIME, extension, reject .doc)
      const validation = validateAttachmentFile(file);
      if (!validation.valid) {
        setGeneralError(`${file.name}: ${validation.error}`);
        setTimeout(() => setGeneralError(null), 4500);
        continue;
      }

      // 2. Start Resumable Upload and Server Processing Flow
      uploadAndProcessAttachment(file, uid, undefined, handleAttachmentUpdate);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Independent Cancellation of an Attachment
  const handleCancelAttachment = (att: ChatAttachment) => {
    cancelAttachment(att.id, att.storagePath);
    setAttachments(prev => prev.filter(a => a.id !== att.id));
    removeAttachmentCache(att.id);
  };

  // Independent Retry of a Failed Attachment
  const handleRetryAttachment = (att: ChatAttachment) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setGeneralError("Fayl yuklash uchun avval tizimga kiring.");
      setTimeout(() => setGeneralError(null), 4000);
      return;
    }

    const file = getCachedFile(att.id);
    if (!file) {
      setGeneralError("Fayl topilmadi. Iltimos, qaytadan tanlang.");
      setTimeout(() => setGeneralError(null), 3000);
      return;
    }

    // Clean up previous storage if any
    cancelAttachment(att.id, att.storagePath);

    // Re-trigger upload & process with the same attachment id
    uploadAndProcessAttachment(file, uid, att.id, handleAttachmentUpdate);
  };

  // Submit Handler: Only submit when attachments are ready
  const hasInProgressAttachments = attachments.some(
    a => a.status === "uploading" || a.status === "processing" || a.status === "validating"
  );

  const readyAttachments = attachments.filter(a => a.status === "ready");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && readyAttachments.length === 0) || isLoading || hasInProgressAttachments) {
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    onSubmit(input.trim(), readyAttachments);
    setInput("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        paddingBottom: keyboardHeight > 0 ? "8px" : (isMobile ? "max(12px, env(safe-area-inset-bottom, 12px))" : undefined)
      }}
      className="p-3 sm:p-4 bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md border-t border-white/40 dark:border-zinc-800 relative w-full min-w-0 shrink-0"
    >
      {/* Speech or General Error Tooltip */}
      {(speechError || generalError) && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 z-20 max-w-[90%] text-center">
          {speechError || generalError}
        </div>
      )}

      {/* Attachment Chips Display */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 glass-scrollbar animate-in fade-in slide-in-from-bottom-1">
          {attachments.map((att) => {
            const isImage = att.mimeType.startsWith("image/");
            const isReady = att.status === "ready";
            const isUploading = att.status === "uploading";
            const isProcessing = att.status === "processing";
            const isError = att.status === "error" || att.status === "cancelled";

            return (
              <div
                key={att.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shadow-sm border transition-all ${
                  isReady
                    ? "bg-white/90 border-green-300 text-gray-800 dark:bg-zinc-800/90 dark:border-green-600/40 dark:text-zinc-200"
                    : isError
                    ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
                    : "bg-blue-50/90 border-blue-200 text-blue-900 dark:bg-zinc-800/90 dark:border-blue-700/40 dark:text-blue-200"
                }`}
              >
                {/* File Icon */}
                {isImage ? (
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                )}

                {/* File Name & Size */}
                <span className="truncate max-w-[120px] font-medium" title={att.name}>
                  {att.name}
                </span>
                <span className="text-[10px] text-gray-400 shrink-0">
                  ({formatFileSize(att.size)})
                </span>

                {/* Status Indicator */}
                {isUploading && (
                  <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold shrink-0">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{att.progress}%</span>
                  </div>
                )}

                {isProcessing && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold shrink-0">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Tahlil...</span>
                  </div>
                )}

                {isReady && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Tayyor</span>
                  </div>
                )}

                {isError && (
                  <div className="flex items-center gap-1 text-[11px] text-red-600 font-semibold shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <span title={att.errorMessage || "Xatolik"}>Xatolik</span>
                    {/* Retry Button */}
                    <button
                      type="button"
                      onClick={() => handleRetryAttachment(att)}
                      title="Qayta urinish"
                      className="p-0.5 hover:bg-red-100 rounded text-red-600 hover:text-red-800 transition-colors ml-1"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Cancel / Remove Button */}
                <button
                  type="button"
                  onClick={() => handleCancelAttachment(att)}
                  className="hover:text-red-500 ml-1 transition-colors text-gray-400 p-0.5 rounded"
                  title={isUploading || isProcessing ? "Bekor qilish" : "O'chirish"}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2 items-end w-full min-w-0">
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp,application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />

        {/* Paperclip Button */}
        <button
          type="button"
          disabled={hasInProgressAttachments || isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 sm:p-3 min-w-[40px] sm:min-w-[44px] min-h-[44px] rounded-[16px] flex items-center justify-center transition-all bg-white/60 hover:bg-white/90 text-blue-600 shadow-sm border border-white/50 cursor-pointer shrink-0 disabled:opacity-50"
          title={hasInProgressAttachments ? "Fayllar yuklanmoqda..." : "Fayl biriktirish (PDF, DOCX, Rasm)"}
        >
          {hasInProgressAttachments ? (
            <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin text-blue-600" />
          ) : (
            <Paperclip className="w-4 sm:w-5 h-4 sm:h-5" />
          )}
        </button>

        {/* Voice Recording Button */}
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

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onInput={autoResize}
          onKeyDown={handleKeyDown}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? "Listening..." : "Xabar yozing..."}
          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-sm/relaxed bg-white/60 backdrop-blur-md border border-white/50 rounded-[20px] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none resize-none overflow-y-auto glass-scrollbar shadow-inner text-gray-800 placeholder:text-gray-400 transition-all font-medium"
          style={{ minHeight: "44px", maxHeight: "160px" }}
          disabled={isLoading}
          autoFocus
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!input.trim() && readyAttachments.length === 0) || isLoading || hasInProgressAttachments}
          className="p-2.5 sm:p-3 min-w-[40px] sm:min-w-[44px] h-[44px] bg-blue-600 text-white rounded-[16px] hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shrink-0"
          title={hasInProgressAttachments ? "Fayllar yuklanmoqda..." : "Yuborish"}
        >
          <Send className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
      </form>

      {/* Document Generation Action in Document Mode */}
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

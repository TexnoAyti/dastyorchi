import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from "firebase/storage";
import { storage } from "../firebase";
import { getApiAuthorizationHeader } from "./apiAuth";
import { deleteStorageFile } from "./storageService";
import { ChatAttachment, AttachmentStatus } from "../types";

export const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024; // 8MB strict budget

export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".jpg", ".jpeg", ".png", ".webp"];

export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp"
];

// Active background tasks and controllers for independent cancellation
const activeUploadTasks = new Map<string, UploadTask>();
const activeAbortControllers = new Map<string, AbortController>();
const activeFiles = new Map<string, File>();

export function sanitizeFileName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot !== -1 ? name.slice(lastDot).toLowerCase() : "";
  const base = lastDot !== -1 ? name.slice(0, lastDot) : name;
  const safeBase = base
    .replace(/[^a-zA-Z0-9_\u0400-\u04FF-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 64) || "document";
  return `${safeBase}${ext}`;
}

export function detectMimeType(file: File): string {
  if (file.type && SUPPORTED_MIME_TYPES.includes(file.type)) {
    return file.type;
  }
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".webp")) return "image/webp";
  return file.type || "application/octet-stream";
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
}

export function validateAttachmentFile(file: File): ValidationResult {
  const lowerName = file.name.toLowerCase();

  // Explicitly reject legacy .doc format
  if (lowerName.endsWith(".doc")) {
    return {
      valid: false,
      error: "Eski .doc formati qo'llab-quvvatlanmaydi. Iltimos .docx yoki .pdf formatida yuklang."
    };
  }

  // Enforce 8MB limit
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      valid: false,
      error: "Fayl hajmi 8MB dan oshmasligi kerak (Telegram mobil xotirasini tejash uchun)."
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "Fayl bo'sh (0 bayt)."
    };
  }

  // Check supported extension
  const hasValidExt = SUPPORTED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
  const mime = detectMimeType(file);
  const hasValidMime = SUPPORTED_MIME_TYPES.includes(mime);

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: "Faqat PDF, DOCX va rasmlar (JPEG, PNG, WebP) qo'llab-quvvatlanadi."
    };
  }

  return {
    valid: true,
    mimeType: mime
  };
}

export function generateAttachmentId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function processAttachmentOnServer(
  attachmentId: string,
  storagePath: string,
  mimeType: string,
  name: string,
  downloadUrl?: string,
  signal?: AbortSignal
): Promise<any> {
  const authHeaders = await getApiAuthorizationHeader();
  
  const response = await fetch("/api/attachments/process", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders
    },
    body: JSON.stringify({
      attachmentId,
      storagePath,
      mimeType,
      name,
      downloadUrl
    }),
    signal
  });

  if (!response.ok) {
    let errBody: any = {};
    try {
      errBody = await response.json();
    } catch (e) {}
    const msg = errBody?.errorMessage || errBody?.error || `Server xatosi: ${response.status}`;
    const code = errBody?.errorCode || `HTTP_${response.status}`;
    const error: any = new Error(msg);
    error.code = code;
    throw error;
  }

  return await response.json();
}

/**
 * Uploads a file via Firebase Storage resumable upload, then automatically dispatches
 * the server processing endpoint to extract text/entities.
 */
export function uploadAndProcessAttachment(
  file: File,
  userId: string,
  existingAttachmentId?: string,
  onUpdate?: (attachment: ChatAttachment) => void
): { attachmentId: string; cancel: () => void } {
  const attachmentId = existingAttachmentId || generateAttachmentId();
  activeFiles.set(attachmentId, file);

  const safeFilename = sanitizeFileName(file.name);
  const storagePath = `users/${userId}/chat-attachments/${attachmentId}/${safeFilename}`;
  const mimeType = detectMimeType(file);

  const attachment: ChatAttachment = {
    id: attachmentId,
    name: file.name,
    mimeType,
    size: file.size,
    status: "uploading",
    progress: 0,
    storagePath
  };

  onUpdate?.({ ...attachment });

  const abortController = new AbortController();
  activeAbortControllers.set(attachmentId, abortController);

  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: mimeType,
    customMetadata: {
      originalName: file.name,
      attachmentId,
      userId
    }
  });

  activeUploadTasks.set(attachmentId, uploadTask);

  const cancel = () => {
    cancelAttachment(attachmentId, storagePath);
    attachment.status = "cancelled";
    attachment.errorMessage = "Yuklash bekor qilindi";
    onUpdate?.({ ...attachment });
  };

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = snapshot.totalBytes > 0
        ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        : 0;
      attachment.progress = Math.min(progress, 99);
      attachment.status = "uploading";
      onUpdate?.({ ...attachment });
    },
    (uploadError: any) => {
      activeUploadTasks.delete(attachmentId);
      if (uploadError?.code === "storage/canceled") {
        attachment.status = "cancelled";
        attachment.errorMessage = "Yuklash bekor qilindi";
      } else {
        attachment.status = "error";
        attachment.errorCode = uploadError?.code || "UPLOAD_FAILED";
        attachment.errorMessage = uploadError?.message || "Faylni yuklashda xatolik yuz berdi.";
      }
      onUpdate?.({ ...attachment });
    },
    async () => {
      activeUploadTasks.delete(attachmentId);
      attachment.progress = 100;
      attachment.status = "processing";
      onUpdate?.({ ...attachment });

      let downloadUrl = "";
      try {
        downloadUrl = await getDownloadURL(storageRef);
        attachment.downloadUrl = downloadUrl;
      } catch (dlErr) {
        console.warn("[Attachment] getDownloadURL notice:", dlErr);
      }

      // Check if cancelled in between
      if (abortController.signal.aborted) {
        attachment.status = "cancelled";
        onUpdate?.({ ...attachment });
        return;
      }

      // Call Server Processing Endpoint
      try {
        const result = await processAttachmentOnServer(
          attachmentId,
          storagePath,
          mimeType,
          file.name,
          downloadUrl,
          abortController.signal
        );

        if (result.success && result.attachment) {
          attachment.status = "ready";
          attachment.extractedText = result.attachment.text;
          attachment.processingMethod = result.attachment.processingMethod;
          attachment.metadata = result.attachment.metadata;
          attachment.errorMessage = undefined;
          attachment.errorCode = undefined;
        } else {
          attachment.status = "error";
          attachment.errorCode = result.errorCode || "ATTACHMENT_PROCESSING_FAILED";
          attachment.errorMessage = result.errorMessage || "Faylni qayta ishlashda xatolik yuz berdi.";
        }
      } catch (procErr: any) {
        if (abortController.signal.aborted || procErr.name === "AbortError") {
          attachment.status = "cancelled";
          attachment.errorMessage = "Jarayon bekor qilindi";
        } else {
          attachment.status = "error";
          attachment.errorCode = procErr?.code || "ATTACHMENT_PROCESSING_FAILED";
          attachment.errorMessage = procErr?.message || "Faylni tahlil qilishda xatolik yuz berdi.";
        }
      } finally {
        activeAbortControllers.delete(attachmentId);
        onUpdate?.({ ...attachment });
      }
    }
  );

  return { attachmentId, cancel };
}

export function cancelAttachment(attachmentId: string, storagePath?: string) {
  // Cancel upload task if running
  const uploadTask = activeUploadTasks.get(attachmentId);
  if (uploadTask) {
    try {
      uploadTask.cancel();
    } catch (e) {}
    activeUploadTasks.delete(attachmentId);
  }

  // Abort server processing request if running
  const abortCtrl = activeAbortControllers.get(attachmentId);
  if (abortCtrl) {
    try {
      abortCtrl.abort();
    } catch (e) {}
    activeAbortControllers.delete(attachmentId);
  }

  // Remove uploaded file from storage if practical
  if (storagePath) {
    deleteStorageFile(storagePath).catch(() => {});
  }
}

export function getCachedFile(attachmentId: string): File | undefined {
  return activeFiles.get(attachmentId);
}

export function removeAttachmentCache(attachmentId: string) {
  activeFiles.delete(attachmentId);
  activeUploadTasks.delete(attachmentId);
  activeAbortControllers.delete(attachmentId);
}

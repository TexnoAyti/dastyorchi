import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

export interface PendingChatWrite {
  id: string;
  userId: string;
  chatId: string;
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: number;
    files?: Array<{ name: string; type: string; fileUrl?: string }>;
  };
  chatMeta?: {
    title?: string;
    language?: string;
    aiMode?: "study" | "document";
    isBusinessMode?: boolean;
    document?: string;
    analysis?: any;
  };
  attempts: number;
  createdAt: number;
  lastAttempt?: number;
  lastError?: string;
}

class ChatPersistenceQueueService {
  private storagePrefix = "pending_chat_writes_";
  private isFlushing = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        const uid = auth.currentUser?.uid;
        if (uid) {
          console.log("[ChatPersistenceQueue] Online event detected, flushing queue...");
          this.flushPendingWrites(uid).catch((err) => {
            console.warn("[ChatPersistenceQueue] Auto-flush on online failed:", err);
          });
        }
      });
    }
  }

  private getStorageKey(userId: string): string {
    return `${this.storagePrefix}${userId}`;
  }

  public getPendingWrites(userId: string): PendingChatWrite[] {
    if (typeof window === "undefined" || !userId) return [];
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("[ChatPersistenceQueue] Failed to parse pending writes:", e);
      return [];
    }
  }

  private savePendingWrites(userId: string, items: PendingChatWrite[]): void {
    if (typeof window === "undefined" || !userId) return;
    try {
      // Keep up to 30 most recent writes to avoid unbounded storage
      const trimmed = items.slice(-30);
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(trimmed));
    } catch (e) {
      console.warn("[ChatPersistenceQueue] Failed to save pending writes to storage:", e);
    }
  }

  public enqueuePendingWrite(item: Omit<PendingChatWrite, "attempts" | "createdAt">): void {
    if (!item.userId || !item.chatId) return;
    try {
      const existing = this.getPendingWrites(item.userId);
      // Avoid duplicate enqueue if same message ID is already queued
      const alreadyQueued = existing.find(w => w.message.id === item.message.id && w.chatId === item.chatId);
      if (alreadyQueued) {
        return;
      }

      // Sanitize: do not store heavy raw file payloads in localStorage
      const safeFiles = item.message.files?.map(f => ({
        name: f.name,
        type: f.type,
        fileUrl: f.fileUrl
      }));

      const newRecord: PendingChatWrite = {
        ...item,
        message: {
          ...item.message,
          files: safeFiles
        },
        attempts: 0,
        createdAt: Date.now()
      };

      existing.push(newRecord);
      this.savePendingWrites(item.userId, existing);
      console.log(`[ChatPersistenceQueue] Enqueued pending write: msgId=${item.message.id}, chatId=${item.chatId}`);
    } catch (err) {
      console.warn("[ChatPersistenceQueue] Failed to enqueue pending write:", err);
    }
  }

  public removePendingWrite(userId: string, writeId: string): void {
    if (!userId || !writeId) return;
    try {
      const existing = this.getPendingWrites(userId);
      const filtered = existing.filter(w => w.id !== writeId && w.message.id !== writeId);
      this.savePendingWrites(userId, filtered);
    } catch (err) {
      console.warn("[ChatPersistenceQueue] Failed to remove pending write:", err);
    }
  }

  public async flushPendingWrites(userId: string): Promise<void> {
    if (this.isFlushing || !userId) return;
    const writes = this.getPendingWrites(userId);
    if (writes.length === 0) return;

    this.isFlushing = true;
    console.log(`[ChatPersistenceQueue] Starting flush for ${writes.length} pending items (user=${userId})...`);

    const remaining: PendingChatWrite[] = [];

    for (const item of writes) {
      // Max 10 retry attempts before skipping
      if (item.attempts >= 10) {
        console.warn(`[ChatPersistenceQueue] Dropping message ${item.message.id} after 10 failed attempts.`);
        continue;
      }

      try {
        // 1. Ensure parent chat document exists or is updated
        const chatDocRef = doc(db, "chats", item.chatId);
        const chatUpdateData: Record<string, any> = {
          userId: item.userId,
          updatedAt: serverTimestamp()
        };

        if (item.chatMeta) {
          if (item.chatMeta.title) chatUpdateData.title = item.chatMeta.title;
          if (item.chatMeta.language) chatUpdateData.language = item.chatMeta.language;
          if (item.chatMeta.aiMode) chatUpdateData.aiMode = item.chatMeta.aiMode;
          if (item.chatMeta.isBusinessMode !== undefined) chatUpdateData.isBusinessMode = item.chatMeta.isBusinessMode;
          if (item.chatMeta.document) chatUpdateData.document = item.chatMeta.document;
          if (item.chatMeta.analysis?.proceduralReadiness != null) chatUpdateData.proceduralReadiness = item.chatMeta.analysis.proceduralReadiness;
          if (item.chatMeta.analysis?.riskLevel) chatUpdateData.riskLevel = item.chatMeta.analysis.riskLevel;
          if (item.chatMeta.analysis?.strengths) chatUpdateData.strengths = item.chatMeta.analysis.strengths;
          if (item.chatMeta.analysis?.weaknesses) chatUpdateData.weaknesses = item.chatMeta.analysis.weaknesses;
          if (item.chatMeta.analysis?.risk) chatUpdateData.risk = item.chatMeta.analysis.risk;
          if (item.chatMeta.analysis?.strategy) chatUpdateData.strategy = item.chatMeta.analysis.strategy;
          if (item.chatMeta.analysis?.expertise) chatUpdateData.expertise = item.chatMeta.analysis.expertise;
        }

        await setDoc(chatDocRef, chatUpdateData, { merge: true });

        // 2. Persist message using idempotent setDoc on message ID
        const messageDocRef = doc(db, "chats", item.chatId, "messages", item.message.id);
        const messagePayload: Record<string, any> = {
          id: item.message.id,
          role: item.message.role,
          content: item.message.content,
          createdAt: serverTimestamp()
        };
        if (item.message.files && item.message.files.length > 0) {
          messagePayload.files = item.message.files;
        }

        await setDoc(messageDocRef, messagePayload, { merge: true });

        console.log(`[ChatPersistenceQueue] Successfully persisted pending write: msgId=${item.message.id}, chatId=${item.chatId}`);
      } catch (err: any) {
        console.warn(`[ChatPersistenceQueue] Retry attempt failed for msgId=${item.message.id}:`, err?.message || err);
        remaining.push({
          ...item,
          attempts: item.attempts + 1,
          lastAttempt: Date.now(),
          lastError: err?.message || String(err)
        });
      }
    }

    this.savePendingWrites(userId, remaining);
    this.isFlushing = false;
  }
}

export const chatPersistenceQueue = new ChatPersistenceQueueService();

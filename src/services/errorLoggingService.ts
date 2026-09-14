import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, limit, query, orderBy } from "firebase/firestore";

export interface LogRecord {
  id?: string;
  timestamp: number;
  userId: string;
  email: string;
  page: string;
  action: string;
  errorType: string;
  errorMessage: string;
  stackTrace: string;
  browserInfo: string;
  status: "pending" | "synced" | "failed";
}

class ErrorLoggingService {
  private queueKey = "legal_offline_logs_queue";
  private isOnline = typeof window !== "undefined" ? window.navigator.onLine : true;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleConnectionChange(true));
      window.addEventListener("offline", () => this.handleConnectionChange(false));
      // Try initial sync on startup
      setTimeout(() => this.syncOfflineQueue(), 3000);
    }
  }

  private handleConnectionChange(online: boolean) {
    this.isOnline = online;
    console.log(`[ErrorLogger] Connection status changed: ${online ? "ONLINE" : "OFFLINE"}`);
    if (online) {
      this.syncOfflineQueue();
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Main Logging method.
   * Exposes no stack traces to end users.
   */
  public async log(
    action: string,
    errorType: string,
    error: any,
    customMessage?: string
  ): Promise<void> {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack || "" : "";
    
    const record: LogRecord = {
      timestamp: Date.now(),
      userId: auth.currentUser?.uid || "anonymous",
      email: auth.currentUser?.email || "anonymous",
      page: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/unknown",
      action,
      errorType,
      errorMessage: customMessage || rawMessage,
      stackTrace: stack,
      browserInfo: typeof navigator !== "undefined" ? navigator.userAgent : "Server-side",
      status: "pending"
    };

    console.error(`[ErrorLogger] [${errorType}] ${action}: ${customMessage || rawMessage}`, error);

    if (this.isOnline && auth.currentUser) {
      try {
        await addDoc(collection(db, "system_logs"), {
          ...record,
          userId: auth.currentUser.uid,
          timestamp: serverTimestamp(),
          status: "synced"
        });
      } catch (err) {
        console.warn("[ErrorLogger] Failed to write live log to Firestore, caching offline:", err);
        this.enqueue(record);
      }
    } else {
      if (!this.isOnline) {
        console.log("[ErrorLogger] Offline. Queueing log record...", record);
      }
      this.enqueue(record);
    }
  }

  private enqueue(record: LogRecord) {
    try {
      const queue = this.getQueue();
      queue.push(record);
      localStorage.setItem(this.queueKey, JSON.stringify(queue.slice(-50)));
    } catch (e) {
      console.error("[ErrorLogger] LocalStorage enqueue fails:", e);
    }
  }

  private getQueue(): LogRecord[] {
    try {
      const data = localStorage.getItem(this.queueKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async syncOfflineQueue() {
    if (!this.isOnline || !auth.currentUser) return;
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`[ErrorLogger] Syncing ${queue.length} offline log records...`);
    const remaining: LogRecord[] = [];

    for (const record of queue) {
      try {
        await addDoc(collection(db, "system_logs"), {
          ...record,
          userId: auth.currentUser?.uid || "anonymous",
          timestamp: serverTimestamp(),
          status: "synced"
        });
      } catch (err) {
        console.warn("[ErrorLogger] Notice syncing offline log record:", err);
        // Do not indefinitely retry failed log records to prevent console spam
      }
    }

    // Clear processed queue
    localStorage.removeItem(this.queueKey);
  }

  /**
   * Global Exponential Backoff Retry Wrapper
   * Retries an async execution up to `retries` times (default 3) using exponential backoff.
   * If failure continues, logs appropriately.
   * Will skip retry for authentication/auth-blocked operations, if specified.
   */
  public async retryWithBackoff<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      retries?: number;
      initialDelay?: number;
      factor?: number;
      disableRetryOnAuthError?: boolean;
    } = {}
  ): Promise<T> {
    const retries = options.retries !== undefined ? options.retries : 3;
    const initialDelay = options.initialDelay !== undefined ? options.initialDelay : 1000;
    const factor = options.factor !== undefined ? options.factor : 2;
    const disableRetryOnAuthError = options.disableRetryOnAuthError !== false;

    let attempt = 0;
    while (true) {
      try {
        return await operation();
      } catch (err: any) {
        attempt++;
        const errorMessage = err?.message || String(err);
        
        const isAuthError = 
          errorMessage.includes("auth/") || 
          errorMessage.includes("permission-denied") || 
          errorMessage.includes("insufficient permissions") ||
          errorMessage.includes("unauthenticated") ||
          errorMessage.includes("login") ||
          errorMessage.includes("sign-in");

        if (isAuthError && disableRetryOnAuthError) {
          console.warn(`[Retry] Skipped retry for ${operationName} because it is a security or auth restriction.`);
          await this.log(operationName, "AuthError", err, `Auth/Permissions rejection: retry aborted.`);
          throw err;
        }

        if (attempt > retries) {
          console.error(`[Retry] ${operationName} failed after ${retries} attempts.`);
          await this.log(operationName, "OperationFailed", err, `Operation failed persistently after ${retries} retries: ${errorMessage}`);
          throw err;
        }

        const delay = initialDelay * Math.pow(factor, attempt - 1);
        console.warn(`[Retry] ${operationName} attempt ${attempt} failed: ${errorMessage}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

export const errorLogger = new ErrorLoggingService();

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { MessageSquare, FileText, Scale, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, getDocs, setDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import { performanceTracker } from "../utils/performanceTracker";

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type: "chat" | "document" | "analysis";
  timestamp: string; // ISO string to easily serialize/deserialize
  read: boolean;
  chatId?: string;
  documentId?: string;
  analysisId?: string;
}

interface NotificationContextProps {
  toasts: ToastMessage[];
  history: ToastMessage[];
  triggerNotification: (
    type: "chat" | "document" | "analysis",
    language: string,
    sources?: { chatId?: string; documentId?: string; analysisId?: string }
  ) => void;
  clearNotification: (id: string) => void;
  clearAllHistory: () => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [history, setHistory] = useState<ToastMessage[]>(() => {
    try {
      const saved = localStorage.getItem("ai_notification_history");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading notification history on load:", e);
    }
    return [];
  });

  const prevIds = useRef<Set<string>>(new Set());

  // 1. Cross-tab synchronization via standard localStorage storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ai_notification_history") {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setHistory(parsed);
          } catch (err) {
            console.error("Error parsing storage history update:", err);
          }
        } else {
          setHistory([]);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 2. Multi-tab Active Toast Propagator
  useEffect(() => {
    const currentIds = new Set(history.map((t) => t.id));

    // If we detect a new notification added from another source/tab,
    // and it was created very recently (within 15s), trigger an in-app float toast
    history.forEach((item) => {
      if (!prevIds.current.has(item.id) && prevIds.current.size > 0) {
        const isRecent = Date.now() - new Date(item.timestamp).getTime() < 15000;
        if (isRecent) {
          // Check if it's already in toasts to prevent duplicates
          setToasts((prev) => {
            if (prev.some((p) => p.id === item.id)) return prev;
            
            // Auto dismiss toast after 5s
            setTimeout(() => {
              setToasts((active) => active.filter((t) => t.id !== item.id));
            }, 5000);

            return [...prev, item];
          });
        }
      }
    });

    prevIds.current = currentIds;
  }, [history]);

  // 3. User Identity Synchronization (Firestore + LocalStorage merged dynamically)
  useEffect(() => {
    let unsubscribeSnap: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
        performanceTracker.trackListenerInactive("NotificationContext");
        console.log("[Firestore] listener detached: User Notifications");
      }

      if (authUser) {
        try {
          await authUser.getIdToken();
        } catch (tokenErr) {
          console.warn("[NotificationContext] Could not refresh ID token:", tokenErr);
        }

        // Logged in: establish real-time syncing listener under users/{userId}/notifications subcollection
        const q = collection(db, "users", authUser.uid, "notifications");

        performanceTracker.trackListenerActive("NotificationContext");
        console.log("[Firestore] listener attached: User Notifications");
        unsubscribeSnap = onSnapshot(
          q,
          (snapshot) => {
            performanceTracker.trackFirestoreRead(`users/${authUser.uid}/notifications`, snapshot.docs.length || 1);
            
            const firestoreNotifications = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: data.title,
                body: data.body,
                type: data.type,
                timestamp: data.timestamp,
                read: data.read,
                chatId: data.chatId || undefined,
                documentId: data.documentId || undefined,
                analysisId: data.analysisId || undefined,
              } as ToastMessage;
            });

            // Retrieve what local storage currently has
            let currentLocal: ToastMessage[] = [];
            try {
              const saved = localStorage.getItem("ai_notification_history");
              if (saved) {
                currentLocal = JSON.parse(saved);
              }
            } catch (e) {
              console.error("Local storage read error inside subscriber:", e);
            }

            const unsynced = currentLocal.filter(
              (local) => !firestoreNotifications.some((fire) => fire.id === local.id)
            );

            // Merge them seamlessly to prevent loss
            const combined = [...firestoreNotifications];
            unsynced.forEach((notif) => {
              if (!combined.some((m) => m.id === notif.id)) {
                combined.push(notif);
              }
            });

            // Sort newest first
            combined.sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // Cap the size of list to 50 for performance and SaaS quota limits
            const finalCollection = combined.slice(0, 50);

            // Synchronize state and write back to LocalStorage
            setHistory(finalCollection);
            localStorage.setItem("ai_notification_history", JSON.stringify(finalCollection));
          },
          (error) => {
            console.warn("[NotificationContext] Notice listening to user notifications:", error);
            try {
              handleFirestoreError(error, OperationType.LIST, `users/${authUser.uid}/notifications`);
            } catch (handledErr) {
              console.warn("[NotificationContext] Handled firestore subscription notice:", handledErr);
            }
          }
        );
      } else {
        // Guest mode/logged out: fall back entirely to local storage history
        try {
          const saved = localStorage.getItem("ai_notification_history");
          if (saved) {
            setHistory(JSON.parse(saved));
          } else {
            setHistory([]);
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) {
        unsubscribeSnap();
        performanceTracker.trackListenerInactive("NotificationContext");
        console.log("[Firestore] listener detached: User Notifications");
      }
    };
  }, []);

  // 4. Triggering notifications with dual-alert execution (sound, browser native, float-toast)
  const triggerNotification = (
    type: "chat" | "document" | "analysis",
    language: string,
    sources?: { chatId?: string; documentId?: string; analysisId?: string }
  ) => {
    import("../services/notificationService")
      .then(({ getNotifyText, notifyCompletion, playNotificationSound }) => {
        const textInfo = getNotifyText(type, language);
        const newId = Math.random().toString(36).substring(2, 9);
        const newToast: ToastMessage = {
          id: newId,
          title: textInfo.title,
          body: textInfo.body,
          type,
          timestamp: new Date().toISOString(),
          read: false,
          chatId: sources?.chatId,
          documentId: sources?.documentId,
          analysisId: sources?.analysisId,
        };

        // play synthesized sound if allowed
        playNotificationSound();

        // animate floating toast element locally
        setToasts((prev) => {
          if (prev.some((p) => p.id === newId)) return prev;
          return [...prev, newToast];
        });

        // store updated list synchronously locally
        setHistory((prev) => {
          const updated = [newToast, ...prev].slice(0, 50);
          localStorage.setItem("ai_notification_history", JSON.stringify(updated));
          
          // Trigger local storage event so other tabs of the current browser receive it immediately
          window.dispatchEvent(new Event("storage"));
          
          return updated;
        });

        // save to Firestore if authenticated under users/{userId}/notifications subcollection
        const currentUser = auth.currentUser;
        if (currentUser) {
          setDoc(doc(db, "users", currentUser.uid, "notifications", newId), {
            id: newId,
            title: textInfo.title,
            body: textInfo.body,
            type,
            timestamp: newToast.timestamp,
            read: false,
            userId: currentUser.uid,
            chatId: sources?.chatId || null,
            documentId: sources?.documentId || null,
            analysisId: sources?.analysisId || null,
          }).catch((err) => {
            console.error("Error writing notification to user subcollection:", err);
          });
        }

        // trigger OS native notification if tab is blurred
        notifyCompletion({
          title: textInfo.title,
          body: textInfo.body,
          playSound: false, // Already played chime manually above
        });

        // dismiss locally after 5 seconds
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newId));
        }, 5000);
      })
      .catch((err) => {
        console.error("Failed to load notification packages dynamically:", err);
      });
  };

  // 5. Delete specific notification
  const clearNotification = async (id: string) => {
    // Optimistic local state updates
    const updated = history.filter((t) => t.id !== id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
    setHistory(updated);
    localStorage.setItem("ai_notification_history", JSON.stringify(updated));

    // Force cross-tab sync instantly
    window.dispatchEvent(new Event("storage"));

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await deleteDoc(doc(db, "users", currentUser.uid, "notifications", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/notifications/${id}`);
      }
    }
  };

  // 6. Clear everything
  const clearAllHistory = async () => {
    setToasts([]);
    setHistory([]);
    localStorage.setItem("ai_notification_history", JSON.stringify([]));

    window.dispatchEvent(new Event("storage"));

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const q = collection(db, "users", currentUser.uid, "notifications");
        const querySnap = await getDocs(q);
        const batch = writeBatch(db);
        querySnap.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/notifications`);
      }
    }
  };

  // 7. Mark single notification as read
  const markAsRead = async (id: string) => {
    const updated = history.map((t) => (t.id === id ? { ...t, read: true } : t));
    setHistory(updated);
    localStorage.setItem("ai_notification_history", JSON.stringify(updated));

    window.dispatchEvent(new Event("storage"));

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const docRef = doc(db, "users", currentUser.uid, "notifications", id);
        await setDoc(docRef, { read: true }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/notifications/${id}`);
      }
    }
  };

  // 8. Mark all notifications as read
  const markAllAsRead = async () => {
    const updated = history.map((t) => ({ ...t, read: true }));
    setHistory(updated);
    localStorage.setItem("ai_notification_history", JSON.stringify(updated));

    window.dispatchEvent(new Event("storage"));

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const q = query(
          collection(db, "users", currentUser.uid, "notifications"),
          where("read", "==", false)
        );
        const querySnap = await getDocs(q);
        const batch = writeBatch(db);
        querySnap.docs.forEach((d) => {
          batch.update(d.ref, { read: true });
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/notifications`);
      }
    }
  };

  const unreadCount = history.filter((t) => !t.read).length;

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        history,
        triggerNotification,
        clearNotification,
        clearAllHistory,
        markAllAsRead,
        markAsRead,
        unreadCount,
      }}
    >
      {children}

      {/* Floating In-App Glassmorphism Toast Renderer Container */}
      <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-[calc(100vw-3rem)] pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            let IconComponent = MessageSquare;
            let iconBgClass = "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400";
            if (toast.type === "document") {
              IconComponent = FileText;
              iconBgClass = "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400";
            } else if (toast.type === "analysis") {
              IconComponent = Scale;
              iconBgClass = "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.95, transition: { duration: 0.2 } }}
                className="pointer-events-auto w-full"
              >
                <div className="bg-white/80 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-200/55 dark:border-zinc-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-4 flex gap-3 relative overflow-hidden group">
                  {/* Dynamic Progress/Timeline Tracker Banner */}
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
                  />

                  <div className={`p-2.5 rounded-xl shrink-0 ${iconBgClass}`}>
                    <IconComponent className="w-5 h-5 animate-pulse" />
                  </div>

                  <div className="flex-grow pr-6">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                      {toast.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed font-semibold">
                      {toast.body}
                    </p>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1 block">
                      {new Date(toast.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => clearNotification(toast.id)}
                    className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

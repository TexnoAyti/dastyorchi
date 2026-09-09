let originalTitle = typeof document !== "undefined" ? document.title : "Dastyorchi.uz";
let titleIntervalId: any = null;

// Track and restore title when window is focused
if (typeof window !== "undefined") {
  window.addEventListener("focus", () => {
    restoreTitle();
  });
}

/**
 * Request notification permission on app start if not granted or denied
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  console.log("[Notification Debug] Starting permission check sequence...");
  
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.error("[Notification Debug] HTML5 Notification API is NOT supported in this client environment.");
    return "denied";
  }

  // 7. Verify app is running under HTTPS or localhost
  const isHttps = window.location.protocol === "https:";
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const secureContext = isHttps || isLocalhost;
  
  console.log(`[Notification Debug] Host Environment Integrity Check:
    - Current Origin: ${window.location.origin}
    - Is HTTPS: ${isHttps}
    - Is Localhost: ${isLocalhost}
    - Secure Context Valid: ${secureContext}
  `);

  if (!secureContext) {
    console.warn("[Notification Debug] WARNING: Browser notifications usually require HTTPS or localhost. If you are serving the app over an insecure HTTP context, browser notification requests might be silenced or blocked by default.");
  }

  // 1 & 3. Check Notification.permission status and log to console
  const initialPermission = Notification.permission;
  console.log(`[Notification Debug] Current permission state prior to request check: "${initialPermission}"`);

  // 2. Request permission if not granted
  if (initialPermission !== "granted") {
    console.log("[Notification Debug] Permission status is NOT 'granted'. Requesting permission from user...");
    try {
      const activePermission = await Notification.requestPermission();
      console.log(`[Notification Debug] Permission request result returned: "${activePermission}"`);
      return activePermission;
    } catch (e) {
      console.warn("[Notification Debug] Modern promise-based requestPermission encountered an error; falling back to legacy callback interface...", e);
      return new Promise((resolve) => {
        try {
          Notification.requestPermission((result) => {
            console.log(`[Notification Debug] Callback-based permission request returned: "${result}"`);
            resolve(result);
          });
        } catch (err) {
          console.error("[Notification Debug] Fatal failure while invoking Notification.requestPermission callback:", err);
          resolve("denied");
        }
      });
    }
  }

  console.log("[Notification Debug] Permission status is already 'granted'. Skipping request prompt.");
  return initialPermission;
}

/**
 * Triggers a test notification on app startup to verify that native OS/browser alerts can fire.
 */
export function triggerStartupTestNotification() {
  console.log("[Notification Debug] Executing triggerStartupTestNotification()...");
  
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.error("[Notification Debug] Startup test aborted: Notification API not supported by browser.");
    return;
  }

  const currentPermission = Notification.permission;
  console.log(`[Notification Debug] Checking prerequisites for startup test notification:
    - Permission Status: "${currentPermission}"
    - Tab Is Hidden (document.hidden): ${document.hidden}
  `);

  if (currentPermission !== "granted") {
    console.warn("[Notification Debug] Test notification on startup bypassed because permission is currently:", currentPermission);
    return;
  }

  try {
    console.log("[Notification Debug] Constructing test startup Notification object with standard visual keys...");
    
    // 5. Use the exact test payload specified
    const testNotification = new Notification("AI Ready", {
      body: "Your response has finished generating.",
      icon: "/logo.png"
    });

    // 8. Add debug logs showing notification sent and events/errors
    console.log("[Notification Debug] SUCCESS - Test notification instantiated successfully. Watch for OS/browser container alert!");

    testNotification.onshow = () => {
      console.log("[Notification Debug] EVENT - Test notification was successfully presented to the user.");
    };

    testNotification.onclick = () => {
      console.log("[Notification Debug] EVENT - User clicked on the test notification.");
      window.focus();
    };

    testNotification.onerror = (err) => {
      console.error("[Notification Debug] ERROR - Test notification failed to display or was blocked. Details:", err);
    };

    testNotification.onclose = () => {
      console.log("[Notification Debug] EVENT - Test notification was closed.");
    };

  } catch (e) {
    console.error("[Notification Debug] EXC - Failed to construct standard Notification object. Origin may be non-secure or user interaction might be missing:", e);
  }
}

/**
 * Restores the document title to its original value and stops blinking/pulsing
 */
export function restoreTitle() {
  if (titleIntervalId) {
    clearInterval(titleIntervalId);
    titleIntervalId = null;
  }
  document.title = originalTitle;
}

/**
 * Changes/pulses the document title when user is on another tab
 */
export function triggerTitleAlert() {
  if (typeof document === "undefined") return;
  restoreTitle();
  originalTitle = "Dastyorchi.uz"; // Standard default title for the app
  
  let isReadyState = true;
  document.title = "🔔 AI ready";
  
  // Flash/toggle the title between "🔔 AI ready" and original title to attract attention
  titleIntervalId = setInterval(() => {
    document.title = isReadyState ? originalTitle : "🔔 AI ready";
    isReadyState = !isReadyState;
  }, 1500);
}

/**
 * Plays a beautiful, high-quality notification chime using Web Audio API.
 * This completely avoids external file dependencies, ensuring 100% reliable playback.
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    // Check if sound alerts are disabled in localStorage
    const soundEnabled = localStorage.getItem("ai_notification_sound") !== "false";
    if (!soundEnabled) return;
    
    const ctx = new AudioContextClass();
    
    // Play two elegant chime notes: E5 (659.25Hz) and A5 (880Hz)
    const playNote = (time: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      
      // Gentle synthesizer envelope
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };
    
    const now = ctx.currentTime;
    playNote(now, 659.25, 0.4); // E5
    playNote(now + 0.12, 880.00, 0.6); // A5
  } catch (e) {
    console.error("Could not play synthesized audio alert:", e);
  }
}

interface NotifyOptions {
  title: string;
  body: string;
  icon?: string;
  playSound?: boolean;
}

/**
 * Sends a notification if the document is hidden / tab has lost focus.
 * Also flashes the tab title and plays a synthesized alert chime if enabled.
 */
export function notifyCompletion({ title, body, icon = "/favicon.ico", playSound = true }: NotifyOptions) {
  const isUserInactive = typeof document !== "undefined" && document.hidden;
  
  console.log(`[Notification Debug] notifyCompletion invoked:
    - Target Title: "${title}"
    - Target Body: "${body}"
    - Tab Status (document.hidden): ${isUserInactive} (Should be true to dispatch)
    - Play Sound Flag: ${playSound}
  `);

  if (isUserInactive) {
    if (playSound) {
      console.log("[Notification Debug] Actioning audio alert sound...");
      playNotificationSound();
    }
    
    // Flash title
    console.log("[Notification Debug] Actioning tab title blinking alert...");
    triggerTitleAlert();
    
    // Browser notification
    if (typeof window !== "undefined" && "Notification" in window) {
      const activePermission = Notification.permission;
      console.log(`[Notification Debug] Dispensing browser notification. Permission status: "${activePermission}"`);
      
      if (activePermission === "granted") {
        try {
          console.log("[Notification Debug] Instantiating Notification object...");
          const notification = new Notification(title, {
            body,
            icon,
            tag: "ai-ready",
            renotify: true
          } as any);

          notification.onshow = () => {
            console.log(`[Notification Debug] SUCCESS - Notification shown: "${title}"`);
          };

          notification.onclick = () => {
            console.log("[Notification Debug] EVENT - User clicked browser notification. Refocusing window...");
            window.focus();
          };

          notification.onerror = (err) => {
            console.error("[Notification Debug] ERROR - Failed to present browser notification:", err);
          };

        } catch (e) {
          console.error("[Notification Debug] EXC - Failed to display notification object construct:", e);
        }
      } else {
        console.warn(`[Notification Debug] Blocked notification dispatch: permission is "${activePermission}" instead of "granted".`);
      }
    } else {
      console.error("[Notification Debug] Notification API not supported by this browser.");
    }
  } else {
    console.log("[Notification Debug] Dispatch skipped: document.hidden is false. Notifications are restricted to background tab view.");
  }
}

const NOTIFICATION_DICTS = {
  chat: {
    uz_lat: { title: "Yangi xabar", body: "AI maslahatchi savolingizga javob berdi." },
    uz_cyr: { title: "Янги хабар", body: "AI маслаҳатчи саволингизга жавоб берди." },
    ru: { title: "Новое сообщение", body: "AI консультант ответил на ваш вопрос." },
    en: { title: "New Message", body: "AI advisor responded to your message." }
  },
  document: {
    uz_lat: { title: "Hujjat tayyor", body: "Siz so'ragan huquqiy hujjat muvaffaqiyatli yaratildi." },
    uz_cyr: { title: "Ҳужжат тайёр", body: "Сиз сўраган ҳуқуқий ҳужжат муваффақиятли яратилди." },
    ru: { title: "Документ готов", body: "Запрошенный вами юридический документ успешно создан." },
    en: { title: "Document Ready", body: "The requested legal document has been generated successfully." }
  },
  analysis: {
    uz_lat: { title: "Tahlil yakunlandi", body: "Ish bo'yicha yutuq va xavflar tahlili tayyor." },
    uz_cyr: { title: "Таҳлил якунланди", body: "Иш бўйича ютуқ ва хавфлар таҳлили тайёр." },
    ru: { title: "Анализ завершен", body: "Анализ вероятности выигрыша и рисков по делу готов." },
    en: { title: "Analysis Complete", body: "The case success rate and risk analysis is ready." }
  }
};

export function getNotifyText(type: "chat" | "document" | "analysis", lang: string) {
  const normLang = lang === "uz_cyr" || lang === "ru" || lang === "en" ? lang : "uz_lat";
  return NOTIFICATION_DICTS[type][normLang];
}

export function notifyAICompletion(type: "chat" | "document" | "analysis", language: string) {
  const textInfo = getNotifyText(type, language);
  notifyCompletion({
    title: textInfo.title,
    body: textInfo.body
  });
}

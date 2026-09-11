// ============================================================================
// DASTYORCHI CENTRALIZED AI GATEWAY & UNIFIED AI CREDIT SYSTEM
// ============================================================================
import { GoogleGenAI } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";

export type AIOperation = "chat" | "reasoning" | "document" | "file_analysis" | "deep_analysis";

export const AI_CREDIT_COSTS: Record<AIOperation, number> = {
  chat: 1,
  reasoning: 2,
  document: 3,
  file_analysis: 4,
  deep_analysis: 5
};

export const DEFAULT_TIER_LIMITS: Record<string, number> = {
  free: 10,
  pro: 100,
  business: 300
};

// Global safety thresholds (configurable via environment variables)
export function getGlobalSafetyLimits() {
  const reqEnv = process.env.DAILY_AI_REQUEST_LIMIT?.trim();
  const freeEnv = process.env.DAILY_FREE_AI_CREDIT_LIMIT?.trim();

  let dailyRequestLimit = reqEnv ? parseInt(reqEnv, 10) : 10000;
  let dailyFreeCreditLimit = freeEnv ? parseInt(freeEnv, 10) : 50000;

  if (isNaN(dailyRequestLimit) || dailyRequestLimit <= 0) {
    dailyRequestLimit = 10000;
  }
  if (isNaN(dailyFreeCreditLimit) || dailyFreeCreditLimit <= 0) {
    dailyFreeCreditLimit = 50000;
  }

  return {
    dailyRequestLimit,
    dailyFreeCreditLimit
  };
}

// Log resolved limits at startup without secrets (Requirement 5)
const startupLimits = getGlobalSafetyLimits();
console.log(`[AI Gateway] Global limits initialized: dailyRequestLimit=${startupLimits.dailyRequestLimit}, dailyFreeCreditLimit=${startupLimits.dailyFreeCreditLimit}`);

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

// Global in-memory accounting counters for emergency safety check across server lifespan
let globalRequestsToday = 0;
let globalFreeCreditsToday = 0;
let globalResetDate = getTashkentDateString();

// In-flight concurrency lock per user
const inFlightUsers = new Set<string>();

export function acquireUserLock(userId: string): boolean {
  if (inFlightUsers.has(userId)) {
    return false;
  }
  inFlightUsers.add(userId);
  return true;
}

export function releaseUserLock(userId: string): void {
  inFlightUsers.delete(userId);
}

// In-memory fallback stores when dbAdmin is unavailable (e.g. initial dev test without service account)
interface FallbackUserState {
  tier: string;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  resetDate: string;
  lifetimeUsed: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}
const fallbackUsers = new Map<string, FallbackUserState>();
const fallbackLedger = new Map<string, any>();

// Status tracking for Firestore Admin credentials (detects whether server runtime has IAM permissions)
let isFirestoreAdminAuthorized: boolean | null = null;

export function setFirestoreAdminAuthorized(val: boolean) {
  isFirestoreAdminAuthorized = val;
}

export function getFirestoreAdminAuthorized(): boolean | null {
  return isFirestoreAdminAuthorized;
}

export function isPermissionDeniedError(err: any): boolean {
  if (!err) return false;
  const code = err.code || err.status;
  const msg = String(err.message || "");
  return (
    code === 7 ||
    code === "PERMISSION_DENIED" ||
    msg.includes("PERMISSION_DENIED") ||
    msg.includes("Missing or insufficient permissions")
  );
}

function reserveFallbackCredits(
  userId: string,
  operation: AIOperation,
  modelName: string,
  requestId: string,
  creditCost: number,
  today: string
): ReservationResult {
  let user = fallbackUsers.get(userId);
  if (!user) {
    user = {
      tier: "free",
      dailyLimit: DEFAULT_TIER_LIMITS.free,
      usedToday: 0,
      remaining: DEFAULT_TIER_LIMITS.free,
      resetDate: today,
      lifetimeUsed: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0
    };
    fallbackUsers.set(userId, user);
  }

  if (user.resetDate !== today) {
    user.usedToday = 0;
    user.remaining = user.dailyLimit;
    user.resetDate = today;
  }

  const safety = checkGlobalSafetyLimits(user.tier, creditCost);
  if (!safety.allowed) {
    return {
      allowed: false,
      error: safety.reason,
      code: "GLOBAL_SAFETY_LIMIT",
      requestId,
      creditCost,
      creditsRemaining: user.remaining,
      creditsDailyLimit: user.dailyLimit,
      creditsUsedToday: user.usedToday,
      resetDate: user.resetDate,
      tier: user.tier
    };
  }

  if (user.remaining < creditCost) {
    return {
      allowed: false,
      error: "Bugungi bepul AI limitingiz tugadi. AI kreditlaringiz ertaga yangilanadi.",
      code: "AI_CREDIT_LIMIT",
      requestId,
      creditCost,
      creditsRemaining: user.remaining,
      creditsDailyLimit: user.dailyLimit,
      creditsUsedToday: user.usedToday,
      resetDate: user.resetDate,
      tier: user.tier
    };
  }

  user.remaining -= creditCost;
  user.usedToday += creditCost;
  user.lifetimeUsed += creditCost;

  fallbackLedger.set(requestId, {
    requestId,
    userId,
    operation,
    creditCost,
    status: "RESERVED",
    model: modelName,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    createdAt: new Date().toISOString(),
    completedAt: null,
    refundedAt: null
  });

  globalRequestsToday++;
  if (user.tier === "free") globalFreeCreditsToday += creditCost;

  return {
    allowed: true,
    requestId,
    creditCost,
    creditsRemaining: user.remaining,
    creditsDailyLimit: user.dailyLimit,
    creditsUsedToday: user.usedToday,
    resetDate: user.resetDate,
    tier: user.tier
  };
}

function getFallbackUserCreditStatus(userId: string, today: string) {
  const user = fallbackUsers.get(userId);
  if (!user) {
    return {
      creditsRemaining: DEFAULT_TIER_LIMITS.free,
      creditsDailyLimit: DEFAULT_TIER_LIMITS.free,
      creditsUsedToday: 0,
      resetDate: today,
      tier: "free",
      lifetimeUsed: 0
    };
  }
  if (user.resetDate !== today) {
    user.usedToday = 0;
    user.remaining = user.dailyLimit;
    user.resetDate = today;
  }
  return {
    creditsRemaining: user.remaining,
    creditsDailyLimit: user.dailyLimit,
    creditsUsedToday: user.usedToday,
    resetDate: user.resetDate,
    tier: user.tier,
    lifetimeUsed: user.lifetimeUsed
  };
}

function finalizeFallbackAiUsage(
  requestId: string,
  userId: string,
  tokens: { inputTokens: number; outputTokens: number; totalTokens: number }
) {
  const nowIso = new Date().toISOString();
  const entry = fallbackLedger.get(requestId);
  if (entry) {
    entry.status = "COMPLETED";
    entry.completedAt = nowIso;
    entry.inputTokens = tokens.inputTokens;
    entry.outputTokens = tokens.outputTokens;
    entry.totalTokens = tokens.totalTokens;
  }
  const user = fallbackUsers.get(userId);
  if (user) {
    user.totalInputTokens += tokens.inputTokens;
    user.totalOutputTokens += tokens.outputTokens;
  }
}

function refundFallbackAiUsage(
  requestId: string,
  userId: string,
  creditCost: number,
  errorMessage: string
): boolean {
  const nowIso = new Date().toISOString();
  const entry = fallbackLedger.get(requestId);
  if (!entry || entry.status !== "RESERVED") {
    return false;
  }
  entry.status = "REFUNDED";
  entry.refundedAt = nowIso;
  entry.error = errorMessage;

  const user = fallbackUsers.get(userId);
  if (user) {
    user.remaining = Math.min(user.dailyLimit, user.remaining + creditCost);
    user.usedToday = Math.max(0, user.usedToday - creditCost);
    user.lifetimeUsed = Math.max(0, user.lifetimeUsed - creditCost);
  }
  if (user?.tier === "free") {
    globalFreeCreditsToday = Math.max(0, globalFreeCreditsToday - creditCost);
  }
  console.log(`[AI Gateway] Refunded ${creditCost} credit(s) to user ${userId} (in-memory fallback)`);
  return true;
}

function getFallbackAnalytics(today: string) {
  return {
    date: today,
    requestsToday: fallbackLedger.size,
    creditsConsumedToday: Array.from(fallbackLedger.values()).reduce((acc, v) => acc + (v.creditCost || 0), 0),
    failedRequests: Array.from(fallbackLedger.values()).filter(v => v.status === "FAILED").length,
    refundedRequests: Array.from(fallbackLedger.values()).filter(v => v.status === "REFUNDED").length,
    totalInputTokensToday: 0,
    totalOutputTokensToday: 0,
    operationBreakdown: { chat: 0, reasoning: 0, document: 0, file_analysis: 0, deep_analysis: 0 },
    modelBreakdown: {}
  };
}

/**
 * Returns current calendar date in Asia/Tashkent timezone (YYYY-MM-DD)
 */
export function getTashkentDateString(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date());
  } catch (e) {
    // Fallback: UTC+5 offset
    const d = new Date(Date.now() + 5 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  }
}

/**
 * Resolves Gemini model according to operation complexity and server environment variables.
 */
export function resolveModel(operation: AIOperation, requestedModel?: string): string {
  const fastModel = process.env.GEMINI_FAST_MODEL?.trim() || "gemini-3.8-flash";
  const strongModel = process.env.GEMINI_STRONG_MODEL?.trim() || "gemini-3.1-pro-preview";

  if (requestedModel && (requestedModel.includes("pro") || requestedModel.includes("strong"))) {
    return strongModel;
  }

  switch (operation) {
    case "reasoning":
    case "document":
    case "deep_analysis":
      return strongModel;
    case "file_analysis":
    case "chat":
    default:
      return fastModel;
  }
}

/**
 * Validates operation string against allowed types
 */
export function validateOperation(op: any): AIOperation {
  if (op === "reasoning" || op === "document" || op === "file_analysis" || op === "deep_analysis") {
    return op;
  }
  return "chat";
}

/**
 * Checks application-wide global emergency safety limits
 */
export function checkGlobalSafetyLimits(tier: string, cost: number): { allowed: boolean; reason?: string } {
  const today = getTashkentDateString();
  if (globalResetDate !== today) {
    globalRequestsToday = 0;
    globalFreeCreditsToday = 0;
    globalResetDate = today;
  }

  const limits = getGlobalSafetyLimits();

  if (globalRequestsToday >= limits.dailyRequestLimit) {
    return {
      allowed: false,
      reason: "Tizimda bugungi umumiy so'rovlar chegarasiga yetildi. Iltimos, keyinroq qayta urinib ko'ring."
    };
  }

  if (tier === "free" && (globalFreeCreditsToday + cost) > limits.dailyFreeCreditLimit) {
    return {
      allowed: false,
      reason: "Bugungi umumiy bepul xizmat ko'rsatish sig'imiga yetildi. Iltimos, ertaga qayta urinib ko'ring yoki Pro tarifiga o'ting."
    };
  }

  return { allowed: true };
}

export interface ReservationResult {
  allowed: boolean;
  error?: string;
  code?: string;
  requestId: string;
  creditCost: number;
  creditsRemaining: number;
  creditsDailyLimit: number;
  creditsUsedToday: number;
  resetDate: string;
  tier: string;
}

/**
 * Atomically reserves credits for an AI operation.
 * Automatically performs daily reset in Asia/Tashkent timezone and initializes missing user records.
 */
export async function reserveCredits(
  dbAdmin: FirebaseFirestore.Firestore | null,
  userId: string,
  operation: AIOperation,
  modelName: string
): Promise<ReservationResult> {
  const requestId = "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
  const creditCost = AI_CREDIT_COSTS[operation] || 1;
  const today = getTashkentDateString();

  if (!dbAdmin || isFirestoreAdminAuthorized === false) {
    if (isProductionEnvironment()) {
      return {
        allowed: false,
        error: "Ma'lumotlar bazasi bilan aloqada xatolik yuz berdi (Firestore ruxsati yetarli emas).",
        code: "CREDIT_STORAGE_UNAVAILABLE",
        requestId,
        creditCost,
        creditsRemaining: 0,
        creditsDailyLimit: 10,
        creditsUsedToday: 0,
        resetDate: today,
        tier: "free"
      };
    }
    return reserveFallbackCredits(userId, operation, modelName, requestId, creditCost, today);
  }

  // Firestore transaction for production atomic consistency
  const userRef = dbAdmin.collection("users").doc(userId);
  const ledgerRef = dbAdmin.collection("ai_usage").doc(requestId);

  try {
    const result = await dbAdmin.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      let userData: any = {};
      let isNew = false;

      if (!userSnap.exists) {
        isNew = true;
      } else {
        userData = userSnap.data() || {};
      }

      const tier = (userData.subscriptionTier === "pro" || userData.subscriptionTier === "business") ? userData.subscriptionTier : "free";
      const expectedLimit = DEFAULT_TIER_LIMITS[tier] || 10;
      let dailyLimit = Number(userData.aiCreditsDailyLimit);
      if (isNaN(dailyLimit) || dailyLimit <= 0) {
        dailyLimit = expectedLimit;
      }

      let usedToday = Number(userData.aiCreditsUsedToday);
      if (isNaN(usedToday) || usedToday < 0) {
        usedToday = 0;
      }

      let remaining = Number(userData.aiCreditsRemaining);
      if (isNaN(remaining) || remaining < 0) {
        remaining = Math.max(0, dailyLimit - usedToday);
      }
      if (remaining > dailyLimit) {
        remaining = dailyLimit;
      }

      let resetDate = typeof userData.aiCreditResetDate === "string" ? userData.aiCreditResetDate : "";
      let lifetimeUsed = Number(userData.lifetimeAiCreditsUsed);
      if (isNaN(lifetimeUsed) || lifetimeUsed < 0) {
        lifetimeUsed = 0;
      }

      // Lazy Daily Reset (Asia/Tashkent) - requirement 4: Free users initialize with 10 remaining, 0 used
      if (resetDate !== today) {
        usedToday = 0;
        remaining = dailyLimit;
        resetDate = today;
      }

      // Check global safety limits first
      const safety = checkGlobalSafetyLimits(tier, creditCost);
      if (!safety.allowed) {
        return {
          allowed: false,
          error: safety.reason,
          code: "GLOBAL_SAFETY_LIMIT",
          requestId,
          creditCost,
          creditsRemaining: remaining,
          creditsDailyLimit: dailyLimit,
          creditsUsedToday: usedToday,
          resetDate,
          tier
        };
      }

      // Requirement 4: ONLY return AI_CREDIT_LIMIT when creditsRemaining < creditCost before reservation
      if (remaining < creditCost) {
        return {
          allowed: false,
          error: "Bugungi bepul AI limitingiz tugadi. AI kreditlaringiz ertaga yangilanadi.",
          code: "AI_CREDIT_LIMIT",
          requestId,
          creditCost,
          creditsRemaining: remaining,
          creditsDailyLimit: dailyLimit,
          creditsUsedToday: usedToday,
          resetDate,
          tier
        };
      }

      // Atomic reservation
      const newRemaining = remaining - creditCost;
      const newUsedToday = usedToday + creditCost;
      const newLifetime = lifetimeUsed + creditCost;
      const nowIso = new Date().toISOString();

      if (isNew) {
        tx.set(userRef, {
          uid: userId,
          id: userId,
          subscriptionTier: tier,
          role: "user",
          aiCreditsDailyLimit: dailyLimit,
          aiCreditsUsedToday: newUsedToday,
          aiCreditsRemaining: newRemaining,
          aiCreditResetDate: resetDate,
          lifetimeAiCreditsUsed: newLifetime,
          totalGeminiInputTokens: 0,
          totalGeminiOutputTokens: 0,
          lastAiRequestAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso
        });
      } else {
        tx.update(userRef, {
          aiCreditsDailyLimit: dailyLimit,
          aiCreditsUsedToday: newUsedToday,
          aiCreditsRemaining: newRemaining,
          aiCreditResetDate: resetDate,
          lifetimeAiCreditsUsed: newLifetime,
          lastAiRequestAt: nowIso,
          updatedAt: nowIso
        });
      }

      // Create ledger document
      tx.set(ledgerRef, {
        requestId,
        userId,
        operation,
        creditCost,
        status: "RESERVED",
        model: modelName,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        createdAt: nowIso,
        completedAt: null,
        refundedAt: null
      });

      return {
        allowed: true,
        requestId,
        creditCost,
        creditsRemaining: newRemaining,
        creditsDailyLimit: dailyLimit,
        creditsUsedToday: newUsedToday,
        resetDate,
        tier
      };
    });

    if (result.allowed) {
      globalRequestsToday++;
      if (result.tier === "free") globalFreeCreditsToday += creditCost;
      console.log(`[AI Gateway] Reserved ${creditCost} credit(s) for user ${userId}. Remaining: ${result.creditsRemaining}`);
    }

    return result;
  } catch (txErr: any) {
    if (isPermissionDeniedError(txErr)) {
      isFirestoreAdminAuthorized = false;
      if (isProductionEnvironment()) {
        console.error("[AI Gateway] Firestore Admin lacks credentials in production (7 PERMISSION_DENIED). Returning CREDIT_STORAGE_UNAVAILABLE.");
        return {
          allowed: false,
          error: "Ma'lumotlar bazasi bilan aloqada xatolik yuz berdi (Firestore ruxsati yetarli emas).",
          code: "CREDIT_STORAGE_UNAVAILABLE",
          requestId,
          creditCost,
          creditsRemaining: 0,
          creditsDailyLimit: 10,
          creditsUsedToday: 0,
          resetDate: today,
          tier: "free"
        };
      }
      console.warn("[AI Gateway] Firestore Admin lacks credentials in development runtime (7 PERMISSION_DENIED). Resilient in-memory credit ledger activated.");
      return reserveFallbackCredits(userId, operation, modelName, requestId, creditCost, today);
    }

    console.error("[AI Gateway] Credit reservation transaction failed:", txErr.message);
    return {
      allowed: false,
      error: "Kreditlarni tekshirishda xatolik yuz berdi: " + (txErr.message || "Server xatosi"),
      code: "RESERVATION_FAILED",
      requestId,
      creditCost,
      creditsRemaining: 0,
      creditsDailyLimit: 10,
      creditsUsedToday: 0,
      resetDate: today,
      tier: "free"
    };
  }
}

/**
 * Finalizes usage in ledger and increments user Gemini token count upon successful response.
 */
export async function finalizeAiUsage(
  dbAdmin: FirebaseFirestore.Firestore | null,
  requestId: string,
  userId: string,
  tokens: { inputTokens: number; outputTokens: number; totalTokens: number }
): Promise<void> {
  const nowIso = new Date().toISOString();

  if (!dbAdmin || isFirestoreAdminAuthorized === false) {
    finalizeFallbackAiUsage(requestId, userId, tokens);
    return;
  }

  try {
    const ledgerRef = dbAdmin.collection("ai_usage").doc(requestId);
    const userRef = dbAdmin.collection("users").doc(userId);

    await Promise.all([
      ledgerRef.update({
        status: "COMPLETED",
        completedAt: nowIso,
        inputTokens: tokens.inputTokens,
        outputTokens: tokens.outputTokens,
        totalTokens: tokens.totalTokens
      }),
      userRef.update({
        totalGeminiInputTokens: FieldValue.increment(tokens.inputTokens),
        totalGeminiOutputTokens: FieldValue.increment(tokens.outputTokens),
        updatedAt: nowIso
      })
    ]);

    console.log(`[AI Gateway] Finalized ${requestId}. Tokens: In=${tokens.inputTokens}, Out=${tokens.outputTokens}`);
  } catch (err: any) {
    if (isPermissionDeniedError(err)) {
      finalizeFallbackAiUsage(requestId, userId, tokens);
      return;
    }
    console.error(`[AI Gateway] Failed to finalize usage for ${requestId}:`, err.message);
  }
}

/**
 * Idempotently refunds reserved credits if Gemini or infrastructure fails before usable response.
 */
export async function refundAiUsage(
  dbAdmin: FirebaseFirestore.Firestore | null,
  requestId: string,
  userId: string,
  creditCost: number,
  errorMessage: string
): Promise<boolean> {
  const nowIso = new Date().toISOString();

  if (!dbAdmin || isFirestoreAdminAuthorized === false) {
    return refundFallbackAiUsage(requestId, userId, creditCost, errorMessage);
  }

  const ledgerRef = dbAdmin.collection("ai_usage").doc(requestId);
  const userRef = dbAdmin.collection("users").doc(userId);

  try {
    const refunded = await dbAdmin.runTransaction(async (tx) => {
      const ledgerSnap = await tx.get(ledgerRef);
      if (!ledgerSnap.exists) return false;

      const ledgerData = ledgerSnap.data() || {};
      if (ledgerData.status !== "RESERVED") {
        // Idempotent: already refunded or completed
        return false;
      }

      const userSnap = await tx.get(userRef);
      if (userSnap.exists) {
        const userData = userSnap.data() || {};
        const dailyLimit = userData.aiCreditsDailyLimit || 10;
        const currentRemaining = userData.aiCreditsRemaining ?? 0;
        const currentUsedToday = userData.aiCreditsUsedToday ?? creditCost;
        const lifetime = userData.lifetimeAiCreditsUsed ?? creditCost;

        tx.update(userRef, {
          aiCreditsRemaining: Math.min(dailyLimit, currentRemaining + creditCost),
          aiCreditsUsedToday: Math.max(0, currentUsedToday - creditCost),
          lifetimeAiCreditsUsed: Math.max(0, lifetime - creditCost),
          updatedAt: nowIso
        });
      }

      tx.update(ledgerRef, {
        status: "REFUNDED",
        refundedAt: nowIso,
        error: errorMessage
      });

      return true;
    });

    if (refunded) {
      console.log(`[AI Gateway] Successfully refunded ${creditCost} credit(s) to ${userId} for request ${requestId}`);
    }
    return refunded;
  } catch (err: any) {
    if (isPermissionDeniedError(err)) {
      return refundFallbackAiUsage(requestId, userId, creditCost, errorMessage);
    }
    console.error(`[AI Gateway] Refund transaction error for ${requestId}:`, err.message);
    return false;
  }
}

/**
 * Retrieves current user's credit status, initializing if not present.
 */
export async function getUserCreditStatus(
  dbAdmin: FirebaseFirestore.Firestore | null,
  userId: string
): Promise<{
  creditsRemaining: number;
  creditsDailyLimit: number;
  creditsUsedToday: number;
  resetDate: string;
  tier: string;
  lifetimeUsed: number;
  error?: string;
  code?: string;
}> {
  const today = getTashkentDateString();

  if (!dbAdmin || isFirestoreAdminAuthorized === false) {
    if (isProductionEnvironment()) {
      return {
        creditsRemaining: 0,
        creditsDailyLimit: 10,
        creditsUsedToday: 0,
        resetDate: today,
        tier: "free",
        lifetimeUsed: 0,
        error: "Ma'lumotlar bazasi bilan aloqada xatolik yuz berdi (Firestore ruxsati yetarli emas).",
        code: "CREDIT_STORAGE_UNAVAILABLE"
      };
    }
    return getFallbackUserCreditStatus(userId, today);
  }

  try {
    const userRef = dbAdmin.collection("users").doc(userId);
    const snap = await userRef.get();

    if (!snap.exists) {
      return {
        creditsRemaining: DEFAULT_TIER_LIMITS.free,
        creditsDailyLimit: DEFAULT_TIER_LIMITS.free,
        creditsUsedToday: 0,
        resetDate: today,
        tier: "free",
        lifetimeUsed: 0
      };
    }

    const data = snap.data() || {};
    const tier = (data.subscriptionTier === "pro" || data.subscriptionTier === "business") ? data.subscriptionTier : "free";
    const expectedLimit = DEFAULT_TIER_LIMITS[tier] || 10;
    let dailyLimit = Number(data.aiCreditsDailyLimit);
    if (isNaN(dailyLimit) || dailyLimit <= 0) {
      dailyLimit = expectedLimit;
    }

    let usedToday = Number(data.aiCreditsUsedToday);
    if (isNaN(usedToday) || usedToday < 0) {
      usedToday = 0;
    }

    let remaining = Number(data.aiCreditsRemaining);
    if (isNaN(remaining) || remaining < 0) {
      remaining = Math.max(0, dailyLimit - usedToday);
    }
    if (remaining > dailyLimit) {
      remaining = dailyLimit;
    }

    let resetDate = typeof data.aiCreditResetDate === "string" ? data.aiCreditResetDate : "";

    if (resetDate !== today) {
      usedToday = 0;
      remaining = dailyLimit;
      resetDate = today;

      // Lazy update
      userRef.update({
        aiCreditsDailyLimit: dailyLimit,
        aiCreditsUsedToday: 0,
        aiCreditsRemaining: dailyLimit,
        aiCreditResetDate: today,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }

    return {
      creditsRemaining: remaining,
      creditsDailyLimit: dailyLimit,
      creditsUsedToday: usedToday,
      resetDate,
      tier,
      lifetimeUsed: Number(data.lifetimeAiCreditsUsed) || 0
    };
  } catch (err: any) {
    if (isPermissionDeniedError(err)) {
      isFirestoreAdminAuthorized = false;
      if (isProductionEnvironment()) {
        console.error(`[AI Gateway] Firestore Admin lacks credentials in production (7 PERMISSION_DENIED) for ${userId}.`);
        return {
          creditsRemaining: 0,
          creditsDailyLimit: 10,
          creditsUsedToday: 0,
          resetDate: today,
          tier: "free",
          lifetimeUsed: 0,
          error: "Ma'lumotlar bazasi bilan aloqada xatolik yuz berdi (Firestore ruxsati yetarli emas).",
          code: "CREDIT_STORAGE_UNAVAILABLE"
        };
      }
      console.warn("[AI Gateway] Firestore Admin lacks credentials (7 PERMISSION_DENIED). Using in-memory credits.");
      return getFallbackUserCreditStatus(userId, today);
    }
    console.error(`[AI Gateway] Failed to read credits for ${userId}:`, err.message);
    return {
      creditsRemaining: 10,
      creditsDailyLimit: 10,
      creditsUsedToday: 0,
      resetDate: today,
      tier: "free",
      lifetimeUsed: 0
    };
  }
}

/**
 * Aggregates admin statistics for AI gateway usage.
 */
export async function getAiAnalytics(dbAdmin: FirebaseFirestore.Firestore | null) {
  const today = getTashkentDateString();

  if (!dbAdmin || isFirestoreAdminAuthorized === false) {
    return getFallbackAnalytics(today);
  }

  try {
    const todayStart = new Date(today + "T00:00:00+05:00").toISOString();
    const snapshot = await dbAdmin.collection("ai_usage")
      .where("createdAt", ">=", todayStart)
      .limit(1000)
      .get();

    let requestsToday = 0;
    let creditsConsumedToday = 0;
    let failedRequests = 0;
    let refundedRequests = 0;
    let totalInputTokensToday = 0;
    let totalOutputTokensToday = 0;
    const operationBreakdown: Record<string, number> = {
      chat: 0,
      reasoning: 0,
      document: 0,
      file_analysis: 0,
      deep_analysis: 0
    };
    const modelBreakdown: Record<string, number> = {};
    const userUsageMap: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      requestsToday++;
      if (data.status === "COMPLETED" || data.status === "RESERVED") {
        creditsConsumedToday += data.creditCost || 0;
      }
      if (data.status === "FAILED") failedRequests++;
      if (data.status === "REFUNDED") refundedRequests++;

      totalInputTokensToday += data.inputTokens || 0;
      totalOutputTokensToday += data.outputTokens || 0;

      const op = data.operation || "chat";
      operationBreakdown[op] = (operationBreakdown[op] || 0) + 1;

      const model = data.model || "unknown";
      modelBreakdown[model] = (modelBreakdown[model] || 0) + 1;

      if (data.userId) {
        userUsageMap[data.userId] = (userUsageMap[data.userId] || 0) + (data.creditCost || 0);
      }
    });

    const topUsers = Object.entries(userUsageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uid, credits]) => ({ userId: uid, credits }));

    return {
      date: today,
      requestsToday,
      creditsConsumedToday,
      failedRequests,
      refundedRequests,
      totalInputTokensToday,
      totalOutputTokensToday,
      operationBreakdown,
      modelBreakdown,
      topUsers
    };
  } catch (err: any) {
    if (isPermissionDeniedError(err)) {
      return getFallbackAnalytics(today);
    }
    console.error("[AI Gateway] Analytics aggregation error:", err.message);
    return {
      date: today,
      error: err.message || "Failed to aggregate analytics"
    };
  }
}

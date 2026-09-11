// server/app.ts
import express from "express";
import cors from "cors";
import HTMLtoDOCX from "html-to-docx";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// server/aiGateway.ts
import { FieldValue } from "firebase-admin/firestore";
var AI_CREDIT_COSTS = {
  chat: 1,
  reasoning: 2,
  document: 3,
  file_analysis: 4,
  deep_analysis: 5
};
var DEFAULT_TIER_LIMITS = {
  free: 10,
  pro: 100,
  business: 300
};
function getGlobalSafetyLimits() {
  const reqEnv = process.env.DAILY_AI_REQUEST_LIMIT?.trim();
  const freeEnv = process.env.DAILY_FREE_AI_CREDIT_LIMIT?.trim();
  let dailyRequestLimit = reqEnv ? parseInt(reqEnv, 10) : 1e4;
  let dailyFreeCreditLimit = freeEnv ? parseInt(freeEnv, 10) : 5e4;
  if (isNaN(dailyRequestLimit) || dailyRequestLimit <= 0) {
    dailyRequestLimit = 1e4;
  }
  if (isNaN(dailyFreeCreditLimit) || dailyFreeCreditLimit <= 0) {
    dailyFreeCreditLimit = 5e4;
  }
  return {
    dailyRequestLimit,
    dailyFreeCreditLimit
  };
}
var startupLimits = getGlobalSafetyLimits();
console.log(`[AI Gateway] Global limits initialized: dailyRequestLimit=${startupLimits.dailyRequestLimit}, dailyFreeCreditLimit=${startupLimits.dailyFreeCreditLimit}`);
function isProductionEnvironment() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || Boolean(process.env.VERCEL) || Boolean(process.env.VERCEL_ENV);
}
var globalRequestsToday = 0;
var globalFreeCreditsToday = 0;
var globalResetDate = getTashkentDateString();
var inFlightUsers = /* @__PURE__ */ new Set();
function acquireUserLock(userId) {
  if (inFlightUsers.has(userId)) {
    return false;
  }
  inFlightUsers.add(userId);
  return true;
}
function releaseUserLock(userId) {
  inFlightUsers.delete(userId);
}
var fallbackUsers = /* @__PURE__ */ new Map();
var fallbackLedger = /* @__PURE__ */ new Map();
var isFirestoreAdminAuthorized = null;
function isCredentialOrPermissionError(err) {
  if (!err) return false;
  const code = err.code || err.status;
  const msg = String(err.message || "").toLowerCase();
  return code === 7 || code === 16 || code === "PERMISSION_DENIED" || code === "UNAUTHENTICATED" || msg.includes("permission_denied") || msg.includes("permission denied") || msg.includes("missing or insufficient permissions") || msg.includes("could not load the default credentials") || msg.includes("default credentials") || msg.includes("unauthenticated");
}
function isPermissionDeniedError(err) {
  return isCredentialOrPermissionError(err);
}
function reserveFallbackCredits(userId, operation, modelName, requestId, creditCost, today) {
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
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
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
function getFallbackUserCreditStatus(userId, today) {
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
function finalizeFallbackAiUsage(requestId, userId, tokens) {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
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
function refundFallbackAiUsage(requestId, userId, creditCost, errorMessage) {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
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
function getFallbackAnalytics(today) {
  return {
    date: today,
    requestsToday: fallbackLedger.size,
    creditsConsumedToday: Array.from(fallbackLedger.values()).reduce((acc, v) => acc + (v.creditCost || 0), 0),
    failedRequests: Array.from(fallbackLedger.values()).filter((v) => v.status === "FAILED").length,
    refundedRequests: Array.from(fallbackLedger.values()).filter((v) => v.status === "REFUNDED").length,
    totalInputTokensToday: 0,
    totalOutputTokensToday: 0,
    operationBreakdown: { chat: 0, reasoning: 0, document: 0, file_analysis: 0, deep_analysis: 0 },
    modelBreakdown: {}
  };
}
function getTashkentDateString() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(/* @__PURE__ */ new Date());
  } catch (e) {
    const d = new Date(Date.now() + 5 * 60 * 60 * 1e3);
    return d.toISOString().split("T")[0];
  }
}
function resolveModel(operation, requestedModel) {
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
function validateOperation(op) {
  if (op === "reasoning" || op === "document" || op === "file_analysis" || op === "deep_analysis") {
    return op;
  }
  return "chat";
}
function checkGlobalSafetyLimits(tier, cost) {
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
  if (tier === "free" && globalFreeCreditsToday + cost > limits.dailyFreeCreditLimit) {
    return {
      allowed: false,
      reason: "Bugungi umumiy bepul xizmat ko'rsatish sig'imiga yetildi. Iltimos, ertaga qayta urinib ko'ring yoki Pro tarifiga o'ting."
    };
  }
  return { allowed: true };
}
async function reserveCredits(dbAdmin2, userId, operation, modelName) {
  const requestId = "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
  const creditCost = AI_CREDIT_COSTS[operation] || 1;
  const today = getTashkentDateString();
  if (!dbAdmin2 || isFirestoreAdminAuthorized === false) {
    if (isProductionEnvironment()) {
      return {
        allowed: false,
        error: "Server ma'lumotlar bazasi autentifikatsiyasi sozlanmagan.",
        code: "FIREBASE_ADMIN_UNAVAILABLE",
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
  const userRef = dbAdmin2.collection("users").doc(userId);
  const ledgerRef = dbAdmin2.collection("ai_usage").doc(requestId);
  try {
    const result = await dbAdmin2.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      let userData = {};
      let isNew = false;
      if (!userSnap.exists) {
        isNew = true;
      } else {
        userData = userSnap.data() || {};
      }
      const tier = userData.subscriptionTier === "pro" || userData.subscriptionTier === "business" ? userData.subscriptionTier : "free";
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
      if (resetDate !== today) {
        usedToday = 0;
        remaining = dailyLimit;
        resetDate = today;
      }
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
      const newRemaining = remaining - creditCost;
      const newUsedToday = usedToday + creditCost;
      const newLifetime = lifetimeUsed + creditCost;
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
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
  } catch (txErr) {
    if (isCredentialOrPermissionError(txErr)) {
      isFirestoreAdminAuthorized = false;
      if (isProductionEnvironment()) {
        console.error("[AI Gateway] Firestore Admin lacks credentials/permission in production:", txErr.message);
        return {
          allowed: false,
          error: "Server ma'lumotlar bazasi autentifikatsiyasi sozlanmagan.",
          code: "FIREBASE_ADMIN_UNAVAILABLE",
          requestId,
          creditCost,
          creditsRemaining: 0,
          creditsDailyLimit: 10,
          creditsUsedToday: 0,
          resetDate: today,
          tier: "free"
        };
      }
      console.warn("[AI Gateway] Firestore Admin lacks credentials in development runtime. Resilient in-memory credit ledger activated.");
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
async function finalizeAiUsage(dbAdmin2, requestId, userId, tokens) {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  if (!dbAdmin2 || isFirestoreAdminAuthorized === false) {
    if (isProductionEnvironment()) {
      console.error("[AI Gateway] Cannot finalize AI usage: dbAdmin is unauthorized in production.");
      return;
    }
    finalizeFallbackAiUsage(requestId, userId, tokens);
    return;
  }
  try {
    const ledgerRef = dbAdmin2.collection("ai_usage").doc(requestId);
    const userRef = dbAdmin2.collection("users").doc(userId);
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
  } catch (err) {
    if (isCredentialOrPermissionError(err)) {
      if (isProductionEnvironment()) {
        isFirestoreAdminAuthorized = false;
        console.error("[AI Gateway] Cannot finalize AI usage: credentials/permissions failed in production:", err.message);
        return;
      }
      finalizeFallbackAiUsage(requestId, userId, tokens);
      return;
    }
    console.error(`[AI Gateway] Failed to finalize usage for ${requestId}:`, err.message);
  }
}
async function refundAiUsage(dbAdmin2, requestId, userId, creditCost, errorMessage) {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  if (!dbAdmin2 || isFirestoreAdminAuthorized === false) {
    if (isProductionEnvironment()) {
      console.error("[AI Gateway] Cannot refund AI usage: dbAdmin is unauthorized in production.");
      return false;
    }
    return refundFallbackAiUsage(requestId, userId, creditCost, errorMessage);
  }
  const ledgerRef = dbAdmin2.collection("ai_usage").doc(requestId);
  const userRef = dbAdmin2.collection("users").doc(userId);
  try {
    const refunded = await dbAdmin2.runTransaction(async (tx) => {
      const ledgerSnap = await tx.get(ledgerRef);
      if (!ledgerSnap.exists) return false;
      const ledgerData = ledgerSnap.data() || {};
      if (ledgerData.status !== "RESERVED") {
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
  } catch (err) {
    if (isCredentialOrPermissionError(err)) {
      if (isProductionEnvironment()) {
        isFirestoreAdminAuthorized = false;
        console.error(`[AI Gateway] Cannot refund AI usage: credentials/permissions failed in production for ${requestId}:`, err.message);
        return false;
      }
      return refundFallbackAiUsage(requestId, userId, creditCost, errorMessage);
    }
    console.error(`[AI Gateway] Refund transaction error for ${requestId}:`, err.message);
    return false;
  }
}
async function getUserCreditStatus(dbAdmin2, userId) {
  const today = getTashkentDateString();
  if (!dbAdmin2 || isFirestoreAdminAuthorized === false) {
    if (isProductionEnvironment()) {
      return {
        creditsRemaining: 0,
        creditsDailyLimit: 10,
        creditsUsedToday: 0,
        resetDate: today,
        tier: "free",
        lifetimeUsed: 0,
        error: "Server ma'lumotlar bazasi autentifikatsiyasi sozlanmagan.",
        code: "FIREBASE_ADMIN_UNAVAILABLE"
      };
    }
    return getFallbackUserCreditStatus(userId, today);
  }
  try {
    const userRef = dbAdmin2.collection("users").doc(userId);
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
    const tier = data.subscriptionTier === "pro" || data.subscriptionTier === "business" ? data.subscriptionTier : "free";
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
      userRef.update({
        aiCreditsDailyLimit: dailyLimit,
        aiCreditsUsedToday: 0,
        aiCreditsRemaining: dailyLimit,
        aiCreditResetDate: today,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }).catch(() => {
      });
    }
    return {
      creditsRemaining: remaining,
      creditsDailyLimit: dailyLimit,
      creditsUsedToday: usedToday,
      resetDate,
      tier,
      lifetimeUsed: Number(data.lifetimeAiCreditsUsed) || 0
    };
  } catch (err) {
    if (isCredentialOrPermissionError(err)) {
      isFirestoreAdminAuthorized = false;
      if (isProductionEnvironment()) {
        console.error(`[AI Gateway] Firestore Admin credential/permission error in production for ${userId}:`, err.message);
        return {
          creditsRemaining: 0,
          creditsDailyLimit: 10,
          creditsUsedToday: 0,
          resetDate: today,
          tier: "free",
          lifetimeUsed: 0,
          error: "Server ma'lumotlar bazasi autentifikatsiyasi sozlanmagan.",
          code: "FIREBASE_ADMIN_UNAVAILABLE"
        };
      }
      console.warn("[AI Gateway] Firestore Admin lacks credentials (credential/permission error). Using in-memory credits.");
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
async function getAiAnalytics(dbAdmin2) {
  const today = getTashkentDateString();
  if (!dbAdmin2 || isFirestoreAdminAuthorized === false) {
    return getFallbackAnalytics(today);
  }
  try {
    const todayStart = (/* @__PURE__ */ new Date(today + "T00:00:00+05:00")).toISOString();
    const snapshot = await dbAdmin2.collection("ai_usage").where("createdAt", ">=", todayStart).limit(1e3).get();
    let requestsToday = 0;
    let creditsConsumedToday = 0;
    let failedRequests = 0;
    let refundedRequests = 0;
    let totalInputTokensToday = 0;
    let totalOutputTokensToday = 0;
    const operationBreakdown = {
      chat: 0,
      reasoning: 0,
      document: 0,
      file_analysis: 0,
      deep_analysis: 0
    };
    const modelBreakdown = {};
    const userUsageMap = {};
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
    const topUsers = Object.entries(userUsageMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([uid, credits]) => ({ userId: uid, credits }));
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
  } catch (err) {
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

// server/app.ts
dotenv.config();
var firebaseAdminState = {
  initialized: false,
  credentialMode: "none",
  firestoreReady: false
};
var dbAdmin = null;
var firebaseInitStatus = "not_initialized";
function parseAndValidateServiceAccount(rawEnv) {
  if (!rawEnv || !rawEnv.trim()) {
    return { valid: false, configured: false, parsed: false, error: "FIREBASE_SERVICE_ACCOUNT_KEY not set" };
  }
  let str = rawEnv.trim();
  if (str.startsWith('"') && str.endsWith('"') || str.startsWith("'") && str.endsWith("'")) {
    str = str.slice(1, -1).trim();
  }
  let parsedObj = null;
  try {
    parsedObj = JSON.parse(str);
  } catch (e1) {
    try {
      const decoded = Buffer.from(str, "base64").toString("utf-8").trim();
      parsedObj = JSON.parse(decoded);
    } catch (e2) {
      return { valid: false, configured: true, parsed: false, error: "Failed to parse JSON (checked raw and base64)" };
    }
  }
  if (!parsedObj || typeof parsedObj !== "object") {
    return { valid: false, configured: true, parsed: false, error: "Service account is not a valid JSON object" };
  }
  const { type, project_id, private_key, client_email } = parsedObj;
  const missing = [];
  if (!type) missing.push("type");
  if (!project_id) missing.push("project_id");
  if (!private_key) missing.push("private_key");
  if (!client_email) missing.push("client_email");
  if (missing.length > 0) {
    return {
      valid: false,
      configured: true,
      parsed: true,
      data: parsedObj,
      error: `Missing required service account fields: ${missing.join(", ")}`
    };
  }
  if (typeof private_key === "string") {
    parsedObj.private_key = private_key.replace(/\\n/g, "\n");
  }
  return { valid: true, configured: true, parsed: true, data: parsedObj };
}
var configPath = path.join(process.cwd(), "firebase-applet-config.json");
var expectedFrontendProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
var configuredDatabaseId = process.env.FIRESTORE_DATABASE_ID?.trim();
if (fs.existsSync(configPath)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (!expectedFrontendProjectId && cfg.projectId) {
      expectedFrontendProjectId = cfg.projectId.trim();
    }
    if (!configuredDatabaseId && cfg.firestoreDatabaseId) {
      configuredDatabaseId = cfg.firestoreDatabaseId.trim();
    }
  } catch (e) {
  }
}
try {
  const isProd = isProductionEnvironment();
  const rawKeyEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  const sa = parseAndValidateServiceAccount(rawKeyEnv);
  const isConfigured = sa.configured;
  const isParsed = sa.parsed;
  const saProjectId = sa.data?.project_id || "none";
  const isClientEmailConfigured = Boolean(sa.data?.client_email);
  console.log(`[FirebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY configured: ${isConfigured ? "yes" : "no"}`);
  console.log(`[FirebaseAdmin] service account parsed: ${isParsed ? "yes" : "no"}`);
  console.log(`[FirebaseAdmin] project id: ${sa.valid ? saProjectId : expectedFrontendProjectId || "none"}`);
  console.log(`[FirebaseAdmin] client email configured: ${isClientEmailConfigured ? "yes" : "no"}`);
  let projectMismatch = false;
  if (sa.valid && sa.data) {
    const candidateProjectId = sa.data.project_id;
    if (process.env.FIREBASE_PROJECT_ID?.trim() && process.env.FIREBASE_PROJECT_ID.trim() !== candidateProjectId) {
      console.error(`[FirebaseAdmin] PROJECT_ID_MISMATCH`);
      console.error(`[FirebaseAdmin] service account project_id (${candidateProjectId}) does not match FIREBASE_PROJECT_ID (${process.env.FIREBASE_PROJECT_ID.trim()})`);
      projectMismatch = true;
    }
    if (expectedFrontendProjectId && expectedFrontendProjectId !== candidateProjectId) {
      console.error(`[FirebaseAdmin] PROJECT_ID_MISMATCH`);
      console.error(`[FirebaseAdmin] service account project_id (${candidateProjectId}) does not match frontend project (${expectedFrontendProjectId})`);
      projectMismatch = true;
    }
  }
  let adminApp = null;
  if (sa.valid && !projectMismatch) {
    try {
      if (admin.apps.length > 0) {
        adminApp = admin.apps[0];
      } else {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(sa.data),
          projectId: sa.data.project_id
        });
      }
      if (configuredDatabaseId && configuredDatabaseId !== "(default)") {
        dbAdmin = getFirestore(adminApp, configuredDatabaseId);
      } else {
        dbAdmin = getFirestore(adminApp);
      }
      firebaseAdminState.initialized = true;
      firebaseAdminState.credentialMode = "service_account_cert";
      firebaseAdminState.firestoreReady = true;
      firebaseAdminState.projectId = sa.data.project_id;
      firebaseAdminState.clientEmail = sa.data.client_email;
      firebaseInitStatus = "service_account_cert";
      console.log(`[FirebaseAdmin] credential mode: service_account_cert`);
      console.log(`[FirebaseAdmin] initialization: success`);
      console.log(`[FirebaseAdmin] Firestore ready. Target database: ${configuredDatabaseId || "(default)"}`);
    } catch (initErr) {
      console.error("[FirebaseAdmin] Initialization error:", initErr.message);
      firebaseAdminState.initialized = false;
      firebaseAdminState.credentialMode = "none";
      firebaseAdminState.firestoreReady = false;
      firebaseAdminState.error = initErr.message;
      firebaseInitStatus = "error: " + initErr.message;
      console.log(`[FirebaseAdmin] credential mode: service_account_cert`);
      console.log(`[FirebaseAdmin] initialization: failure`);
    }
  } else {
    if (isProd) {
      firebaseAdminState.initialized = false;
      firebaseAdminState.credentialMode = "none";
      firebaseAdminState.firestoreReady = false;
      firebaseAdminState.error = projectMismatch ? "PROJECT_ID_MISMATCH" : sa.error || "FIREBASE_SERVICE_ACCOUNT_KEY missing or invalid";
      firebaseInitStatus = "unavailable: " + firebaseAdminState.error;
      dbAdmin = null;
      console.log(`[FirebaseAdmin] credential mode: none`);
      console.log(`[FirebaseAdmin] initialization: failure`);
      if (projectMismatch) {
        console.error("[FirebaseAdmin] PROJECT_ID_MISMATCH - Production Firebase Admin initialization aborted.");
      } else {
        console.error(`[FirebaseAdmin] Production Firebase Admin credentials unavailable: ${sa.error || "missing key"}. ADC fallback disabled.`);
      }
    } else {
      const devProjectId = expectedFrontendProjectId || "pure-wording-pf6jr";
      if (!adminApp && admin.apps.length === 0 && devProjectId) {
        try {
          adminApp = admin.initializeApp({ projectId: devProjectId });
          if (configuredDatabaseId && configuredDatabaseId !== "(default)") {
            dbAdmin = getFirestore(adminApp, configuredDatabaseId);
          } else {
            dbAdmin = getFirestore(adminApp);
          }
          firebaseAdminState.initialized = true;
          firebaseAdminState.credentialMode = "development_fallback";
          firebaseAdminState.firestoreReady = true;
          firebaseAdminState.projectId = devProjectId;
          firebaseInitStatus = "development_fallback";
          console.log(`[FirebaseAdmin] credential mode: development_fallback`);
          console.log(`[FirebaseAdmin] initialization: success (dev fallback)`);
        } catch (devErr) {
          console.warn("[FirebaseAdmin] Development fallback init warning:", devErr.message);
          firebaseAdminState.initialized = false;
          firebaseAdminState.credentialMode = "none";
          firebaseAdminState.firestoreReady = false;
          firebaseAdminState.error = devErr.message;
          firebaseInitStatus = "error: " + devErr.message;
          console.log(`[FirebaseAdmin] credential mode: none`);
          console.log(`[FirebaseAdmin] initialization: failure`);
        }
      } else {
        console.log(`[FirebaseAdmin] credential mode: none`);
        console.log(`[FirebaseAdmin] initialization: failure`);
      }
    }
  }
} catch (fatalErr) {
  console.error("[FirebaseAdmin] Fatal startup error:", fatalErr.message);
  firebaseAdminState.initialized = false;
  firebaseAdminState.credentialMode = "none";
  firebaseAdminState.firestoreReady = false;
  firebaseAdminState.error = fatalErr.message;
  firebaseInitStatus = "fatal_error: " + fatalErr.message;
}
function verifyTelegramWebAppData(initData, botToken) {
  try {
    if (!initData || typeof initData !== "string") {
      return { valid: false, error: "Bo'sh yoki noto'g'ri initData" };
    }
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) {
      return { valid: false, error: "initData ichida hash topilmadi" };
    }
    params.delete("hash");
    const keys = Array.from(params.keys()).sort();
    const checkString = keys.map((key) => `${key}=${params.get(key)}`).join("\n");
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");
    const hashBuf = Buffer.from(hash, "hex");
    const calcBuf = Buffer.from(calculatedHash, "hex");
    if (hashBuf.length !== calcBuf.length || !crypto.timingSafeEqual(hashBuf, calcBuf)) {
      return { valid: false, error: "Telegram imzosi (hash) mos kelmadi" };
    }
    const authDateStr = params.get("auth_date");
    const authDate = authDateStr ? parseInt(authDateStr, 10) : 0;
    const now = Math.floor(Date.now() / 1e3);
    if (!authDate || now - authDate > 86400 * 2) {
      return { valid: false, error: "Telegram sessiyasi eskirgan (auth_date expired)" };
    }
    const userRaw = params.get("user");
    if (!userRaw) {
      return { valid: false, error: "Foydalanuvchi ma'lumoti topilmadi" };
    }
    const user = JSON.parse(userRaw);
    if (!user || !user.id) {
      return { valid: false, error: "Foydalanuvchi IDsi mavjud emas" };
    }
    return { valid: true, user, authDate };
  } catch (err) {
    return { valid: false, error: err.message || "Tasdiqlashda xatolik yuz berdi" };
  }
}
function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    console.error("[Session] FATAL: SESSION_SECRET is required in production environment.");
    throw new Error("Server configuration error: SESSION_SECRET is required in production.");
  }
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || "dastyorchi_dev_session_secret";
}
function createSessionToken(payload) {
  const secret = getSessionSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}
function verifySessionToken(token) {
  try {
    if (!token) {
      return { valid: false, reason: "missing_token", error: "Token taqdim etilmagan" };
    }
    const cleanToken = token.trim();
    const parts = cleanToken.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { valid: false, reason: "malformed_token", error: "Yaroqsiz token formati" };
    }
    let secret;
    try {
      secret = getSessionSecret();
    } catch (err) {
      return { valid: false, reason: "malformed_token", error: err.message };
    }
    const [data, signature] = parts;
    let expectedSignature;
    try {
      expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    } catch (err) {
      return { valid: false, reason: "malformed_token", error: "Imzo hisoblashda xatolik" };
    }
    const sigBuf = Buffer.from(signature, "utf-8");
    const expBuf = Buffer.from(expectedSignature, "utf-8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: "signature_mismatch", error: "Token imzosi noto'g'ri" };
    }
    let payload;
    try {
      payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    } catch {
      return { valid: false, reason: "malformed_token", error: "Token ma'lumotini o'qib bo'lmadi" };
    }
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
      return { valid: false, reason: "expired", error: "Sessiya vaqti tugagan" };
    }
    if (!payload.uid) {
      return { valid: false, reason: "malformed_token", error: "Token foydalanuvchi ma'lumotiga ega emas" };
    }
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: "malformed_token", error: err.message || "Tokenni tekshirishda xatolik" };
  }
}
async function upgradeUserSubscription(userId, tier, provider, amount) {
  const newLimit = tier === "pro" ? 100 : 300;
  if (!dbAdmin) {
    console.warn(`[SubscriptionUpgrade] dbAdmin unavailable. Cannot persist upgrade for user: ${userId}`);
    return;
  }
  try {
    const userRef = dbAdmin.collection("users").doc(userId);
    await userRef.update({
      subscriptionTier: tier,
      subscriptionStatus: "active",
      requestsToday: 0,
      aiCreditsDailyLimit: newLimit,
      aiCreditsRemaining: newLimit,
      aiCreditsUsedToday: 0,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log(`[SubscriptionUpgrade] Successfully upgraded user: ${userId} to ${tier} tier (${newLimit} credits/day) via ${provider}`);
  } catch (err) {
    console.error(`[SubscriptionUpgrade] Error updating user ${userId}:`, err.message);
  }
}
async function authenticateRequestDetails(req) {
  const rawAuth = req.headers.authorization || req.headers.Authorization || "";
  const authHeaderPresent = Boolean(rawAuth && rawAuth.trim().length > 0);
  if (!authHeaderPresent) {
    const devUserId = process.env.NODE_ENV !== "production" && req.body?.userId ? req.body.userId : null;
    return {
      userId: devUserId,
      authHeaderPresent: false,
      tokenFormat: "unknown",
      sessionVerification: "fail",
      sessionFailReason: "missing_token",
      firebaseVerificationAttempted: false,
      firebaseVerification: "skipped",
      errorCode: "AUTH_REQUIRED",
      error: "Authentication required"
    };
  }
  const token = rawAuth.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    const devUserId = process.env.NODE_ENV !== "production" && req.body?.userId ? req.body.userId : null;
    return {
      userId: devUserId,
      authHeaderPresent: true,
      tokenFormat: "unknown",
      sessionVerification: "fail",
      sessionFailReason: "missing_token",
      firebaseVerificationAttempted: false,
      firebaseVerification: "skipped",
      errorCode: "AUTH_REQUIRED",
      error: "Authentication required"
    };
  }
  const dotCount = (token.match(/\./g) || []).length;
  let tokenFormat = "unknown";
  if (dotCount === 1) {
    tokenFormat = "session";
  } else if (dotCount === 2) {
    tokenFormat = "firebase";
  }
  const sessionResult = verifySessionToken(token);
  if (sessionResult.valid && sessionResult.payload?.uid) {
    return {
      userId: sessionResult.payload.uid,
      authHeaderPresent: true,
      tokenFormat: "session",
      sessionVerification: "pass",
      firebaseVerificationAttempted: false,
      firebaseVerification: "skipped"
    };
  }
  const sessionFailReason = sessionResult.reason || "malformed_token";
  let firebaseVerificationAttempted = false;
  let firebaseVerification = "skipped";
  let firebaseFailReason = null;
  if (admin.apps.length > 0 && firebaseAdminState.credentialMode === "service_account_cert") {
    firebaseVerificationAttempted = true;
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      if (decoded && decoded.uid) {
        return {
          userId: decoded.uid,
          authHeaderPresent: true,
          tokenFormat: tokenFormat === "unknown" ? "firebase" : tokenFormat,
          sessionVerification: "fail",
          sessionFailReason,
          firebaseVerificationAttempted: true,
          firebaseVerification: "pass"
        };
      } else {
        firebaseVerification = "fail";
        firebaseFailReason = "firebase_invalid";
      }
    } catch {
      firebaseVerification = "fail";
      firebaseFailReason = "firebase_invalid";
    }
  }
  if (process.env.NODE_ENV !== "production" && req.body?.userId) {
    return {
      userId: req.body.userId,
      authHeaderPresent: true,
      tokenFormat,
      sessionVerification: "fail",
      sessionFailReason,
      firebaseVerificationAttempted,
      firebaseVerification,
      firebaseFailReason
    };
  }
  const isExpired = sessionFailReason === "expired";
  return {
    userId: null,
    authHeaderPresent: true,
    tokenFormat,
    sessionVerification: "fail",
    sessionFailReason,
    firebaseVerificationAttempted,
    firebaseVerification,
    firebaseFailReason,
    errorCode: isExpired ? "SESSION_EXPIRED" : "AUTH_REQUIRED",
    error: isExpired ? "Session expired" : "Authentication required"
  };
}
async function authenticateRequestUser(req) {
  const diagnosis = await authenticateRequestDetails(req);
  return diagnosis.userId;
}
var app = express();
console.log("[Vercel API] Express app loaded");
console.log("[Vercel API] Runtime initialized");
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
var apiRouter = express.Router();
apiRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    firebaseAdmin: {
      initialized: firebaseAdminState.initialized,
      credentialMode: firebaseAdminState.credentialMode,
      firestoreReady: firebaseAdminState.firestoreReady
    }
  });
});
apiRouter.post("/auth/telegram", async (req, res) => {
  try {
    console.log("[TelegramAuth] request received");
    const { initData, devBypass } = req.body || {};
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    console.log("[TelegramAuth] initData present:", Boolean(initData) ? "yes" : "no");
    console.log("[TelegramAuth] initData length:", initData ? initData.length : 0);
    console.log("[TelegramAuth] TELEGRAM_BOT_TOKEN configured:", Boolean(botToken) ? "yes" : "no");
    let telegramUser = null;
    let authDate = 0;
    if (botToken) {
      if (!initData) {
        return res.status(400).json({ error: "Telegram initData parametri taqdim etilmagan" });
      }
      const verification = verifyTelegramWebAppData(initData, botToken);
      console.log("[TelegramAuth] validation:", verification.valid ? "pass" : "fail");
      if (!verification.valid) {
        return res.status(401).json({ error: verification.error || "Telegram ma'lumotlari tasdiqlanmadi" });
      }
      telegramUser = verification.user;
      authDate = verification.authDate || 0;
      const now = Math.floor(Date.now() / 1e3);
      console.log("[TelegramAuth] auth_date age:", now - authDate, "seconds");
      console.log("[TelegramAuth] telegram user id after verification:", telegramUser.id);
    } else {
      if (process.env.NODE_ENV === "production") {
        console.error("[TelegramAuth] Missing TELEGRAM_BOT_TOKEN in production environment");
        return res.status(500).json({
          error: "Serverda TELEGRAM_BOT_TOKEN sozlanmagan. Iltimos bot tokenini muhit sozlamalariga kiriting."
        });
      }
      console.warn("[TelegramAuth] TELEGRAM_BOT_TOKEN not set. Running in development test mode.");
      if (initData) {
        try {
          const params = new URLSearchParams(initData);
          const userRaw = params.get("user");
          if (userRaw) {
            telegramUser = JSON.parse(userRaw);
          }
        } catch (e) {
          console.warn("[TelegramAuth] Failed to parse user from initData in dev mode");
        }
      }
      if (!telegramUser && devBypass) {
        telegramUser = {
          id: 999999999,
          first_name: "Dasturchi",
          last_name: "Sinovchi",
          username: "dastyorchi_dev",
          language_code: "uz"
        };
      }
      if (!telegramUser) {
        return res.status(400).json({ error: "Telegram initData yoki foydalanuvchi ma'lumoti topilmadi" });
      }
    }
    const telegramId = Number(telegramUser.id);
    const internalUserId = `tg_${telegramId}`;
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const isEnvAdmin = adminIds.includes(String(telegramId));
    let userProfile = null;
    let firestoreStatus = "skipped (no dbAdmin)";
    if (dbAdmin) {
      try {
        const userDocRef = dbAdmin.collection("users").doc(internalUserId);
        const snap = await userDocRef.get();
        if (snap.exists) {
          userProfile = snap.data();
          firestoreStatus = "read: user found";
        } else {
          firestoreStatus = "read: user not found";
        }
      } catch (e) {
        console.error("[TelegramAuth] Firestore read error:", e.message);
        firestoreStatus = "read error: " + e.message;
      }
    }
    if (!userProfile) {
      const role = isEnvAdmin ? "admin" : "user";
      const displayName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ") || telegramUser.username || `Foydalanuvchi #${telegramId}`;
      const avatarUrl = telegramUser.photo_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${internalUserId}`;
      userProfile = {
        uid: internalUserId,
        id: internalUserId,
        telegramId,
        firstName: telegramUser.first_name || "",
        lastName: telegramUser.last_name || "",
        username: telegramUser.username || "",
        displayName,
        photoUrl: avatarUrl,
        avatarUrl,
        languageCode: telegramUser.language_code || "uz",
        role,
        subscriptionTier: "free",
        subscriptionStatus: "active",
        requestsToday: 0,
        exportsToday: 0,
        aiCreditsDailyLimit: 10,
        aiCreditsUsedToday: 0,
        aiCreditsRemaining: 10,
        aiCreditResetDate: getTashkentDateString(),
        lifetimeAiCreditsUsed: 0,
        totalGeminiInputTokens: 0,
        totalGeminiOutputTokens: 0,
        lastAiRequestAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastRequestResetDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA"),
        lastExportResetDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA"),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (dbAdmin) {
        try {
          await dbAdmin.collection("users").doc(internalUserId).set(userProfile);
          firestoreStatus = "write: new user created";
        } catch (e) {
          console.error("[TelegramAuth] Firestore create error:", e.message);
          firestoreStatus = "write error: " + e.message;
        }
      }
    } else {
      const updatedFields = {
        firstName: telegramUser.first_name || userProfile.firstName || "",
        lastName: telegramUser.last_name || userProfile.lastName || "",
        username: telegramUser.username || userProfile.username || "",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (telegramUser.photo_url) {
        updatedFields.photoUrl = telegramUser.photo_url;
        updatedFields.avatarUrl = telegramUser.photo_url;
      }
      if (isEnvAdmin && userProfile.role !== "admin") {
        updatedFields.role = "admin";
        userProfile.role = "admin";
      }
      if (userProfile.aiCreditsDailyLimit === void 0) {
        const tier = userProfile.subscriptionTier || "free";
        const limit = DEFAULT_TIER_LIMITS[tier] || 10;
        updatedFields.aiCreditsDailyLimit = limit;
        updatedFields.aiCreditsUsedToday = 0;
        updatedFields.aiCreditsRemaining = limit;
        updatedFields.aiCreditResetDate = getTashkentDateString();
        updatedFields.lifetimeAiCreditsUsed = 0;
        updatedFields.totalGeminiInputTokens = 0;
        updatedFields.totalGeminiOutputTokens = 0;
      }
      userProfile = { ...userProfile, ...updatedFields };
      if (dbAdmin) {
        try {
          await dbAdmin.collection("users").doc(internalUserId).update(updatedFields);
          firestoreStatus = "write: user updated";
        } catch (e) {
          console.error("[TelegramAuth] Firestore update error:", e.message);
          firestoreStatus = "update error: " + e.message;
        }
      }
    }
    console.log("[TelegramAuth] Firestore read/write result:", firestoreStatus);
    const token = createSessionToken({
      uid: internalUserId,
      telegramId,
      role: userProfile.role || "user",
      iat: Math.floor(Date.now() / 1e3),
      exp: Math.floor(Date.now() / 1e3) + 14 * 24 * 60 * 60
    });
    console.log("[TelegramAuth] session token created: yes");
    let firebaseCustomToken = null;
    if (admin.apps.length > 0 && firebaseAdminState.credentialMode === "service_account_cert") {
      try {
        const customClaims = {
          telegramId,
          role: userProfile.role || "user"
        };
        if (isEnvAdmin || userProfile.role === "admin") {
          customClaims.role = "admin";
          customClaims.admin = true;
        }
        firebaseCustomToken = await admin.auth().createCustomToken(internalUserId, customClaims);
        console.log("[TelegramAuth] Firebase custom token: success");
      } catch (tokenErr) {
        console.error("[TelegramAuth] Firebase custom token: fail -", tokenErr.message);
      }
    }
    return res.json({
      success: true,
      token,
      firebaseCustomToken,
      user: {
        uid: internalUserId,
        id: internalUserId,
        telegramId,
        displayName: userProfile.displayName,
        username: userProfile.username,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        avatarUrl: userProfile.avatarUrl,
        photoUrl: userProfile.photoUrl,
        role: userProfile.role,
        subscriptionTier: userProfile.subscriptionTier,
        subscriptionStatus: userProfile.subscriptionStatus,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt
      }
    });
  } catch (err) {
    console.error("[TelegramAuth] Unexpected server error:", err);
    return res.status(500).json({ error: "Avtorizatsiyada server xatoligi yuz berdi: " + (err.message || "") });
  }
});
apiRouter.get("/auth/session", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Avtorizatsiya tokeni topilmadi" });
    }
    const token = authHeader.substring(7).trim();
    const verified = verifySessionToken(token);
    if (!verified.valid || !verified.payload) {
      return res.status(401).json({ error: verified.error || "Yaroqsiz yoki muddati o'tgan sessiya" });
    }
    const { uid } = verified.payload;
    let userProfile = null;
    if (dbAdmin) {
      try {
        const snap = await dbAdmin.collection("users").doc(uid).get();
        if (snap.exists) {
          userProfile = snap.data();
        }
      } catch (e) {
        console.warn("Error reading session user profile from Firestore Admin:", e.message);
      }
    }
    if (!userProfile) {
      userProfile = {
        uid,
        id: uid,
        telegramId: verified.payload.telegramId,
        role: verified.payload.role || "user"
      };
    }
    return res.json({
      valid: true,
      user: userProfile
    });
  } catch (err) {
    return res.status(500).json({ error: "Sessiyani tekshirishda xatolik yuz berdi" });
  }
});
apiRouter.post("/auth/dev-login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Dev login is strictly forbidden in production" });
  }
  try {
    const devTelegramId = 999999999;
    const internalUserId = `tg_${devTelegramId}`;
    let userProfile = null;
    if (dbAdmin) {
      try {
        const snap = await dbAdmin.collection("users").doc(internalUserId).get();
        if (snap.exists) {
          userProfile = snap.data();
        }
      } catch (e) {
      }
    }
    if (!userProfile) {
      userProfile = {
        uid: internalUserId,
        id: internalUserId,
        telegramId: devTelegramId,
        firstName: "Dasturchi",
        lastName: "Sinovchi",
        username: "dastyorchi_dev",
        displayName: "Dasturchi Sinovchi",
        photoUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${internalUserId}`,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${internalUserId}`,
        languageCode: "uz",
        role: "admin",
        subscriptionTier: "pro",
        subscriptionStatus: "active",
        requestsToday: 0,
        exportsToday: 0,
        aiCreditsDailyLimit: 100,
        aiCreditsUsedToday: 0,
        aiCreditsRemaining: 100,
        aiCreditResetDate: getTashkentDateString(),
        lifetimeAiCreditsUsed: 0,
        totalGeminiInputTokens: 0,
        totalGeminiOutputTokens: 0,
        lastAiRequestAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastRequestResetDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA"),
        lastExportResetDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA"),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (dbAdmin) {
        try {
          await dbAdmin.collection("users").doc(internalUserId).set(userProfile);
        } catch (e) {
        }
      }
    }
    const token = createSessionToken({
      uid: internalUserId,
      telegramId: devTelegramId,
      role: userProfile.role || "admin",
      iat: Math.floor(Date.now() / 1e3),
      exp: Math.floor(Date.now() / 1e3) + 14 * 24 * 60 * 60
    });
    let firebaseCustomToken = null;
    if (admin.apps.length > 0 && firebaseAdminState.credentialMode === "service_account_cert") {
      try {
        firebaseCustomToken = await admin.auth().createCustomToken(internalUserId, {
          telegramId: devTelegramId,
          role: "admin",
          admin: true
        });
      } catch (e) {
        console.warn("Dev custom token generation skipped:", e.message);
      }
    }
    return res.json({
      success: true,
      token,
      firebaseCustomToken,
      user: userProfile
    });
  } catch (err) {
    return res.status(500).json({ error: "Dev login xatoligi: " + err.message });
  }
});
apiRouter.get("/ai/credits", async (req, res) => {
  try {
    if (isProductionEnvironment() && (!dbAdmin || !firebaseAdminState.firestoreReady)) {
      return res.status(503).json({
        code: "FIREBASE_ADMIN_UNAVAILABLE",
        error: "Server ma'lumotlar bazasi autentifikatsiyasi sozlanmagan."
      });
    }
    const authInspection = await authenticateRequestDetails(req);
    const userId = authInspection.userId;
    if (!userId) {
      const isExpired = authInspection.sessionFailReason === "expired";
      return res.status(401).json({
        error: isExpired ? "Session expired" : "Authentication required",
        code: isExpired ? "SESSION_EXPIRED" : "AUTH_REQUIRED"
      });
    }
    const status = await getUserCreditStatus(dbAdmin, userId);
    if (status.code === "FIREBASE_ADMIN_UNAVAILABLE" || status.code === "CREDIT_STORAGE_UNAVAILABLE") {
      return res.status(503).json(status);
    }
    return res.json(status);
  } catch (err) {
    if (isProductionEnvironment()) {
      return res.status(503).json({
        code: "FIREBASE_ADMIN_UNAVAILABLE",
        error: "Server ma'lumotlar bazasi autentifikatsiyasi sozlanmagan."
      });
    }
    return res.status(500).json({
      error: "Kreditlarni olishda xatolik: " + err.message,
      code: "CREDIT_FETCH_ERROR"
    });
  }
});
apiRouter.get("/admin/ai-analytics", async (req, res) => {
  try {
    const userId = await authenticateRequestUser(req);
    if (!userId) {
      return res.status(401).json({ error: "Ruxsat etilmagan", code: "UNAUTHORIZED" });
    }
    let isAdmin = false;
    if (dbAdmin) {
      const userDoc = await dbAdmin.collection("users").doc(userId).get();
      if (userDoc.exists && userDoc.data()?.role === "admin") {
        isAdmin = true;
      }
    } else {
      isAdmin = true;
    }
    if (!isAdmin) {
      return res.status(403).json({ error: "Faqat administratorlar uchun", code: "FORBIDDEN" });
    }
    const analytics = await getAiAnalytics(dbAdmin);
    return res.json(analytics);
  } catch (err) {
    return res.status(500).json({ error: "Analitika xatoligi: " + err.message });
  }
});
apiRouter.post("/ai", async (req, res) => {
  console.log("[AI Auth] request received");
  const authInspection = await authenticateRequestDetails(req);
  console.log("[AI Auth] Authorization header present:", authInspection.authHeaderPresent ? "yes" : "no");
  console.log("[AI Auth] token format:", authInspection.tokenFormat);
  console.log("[AI Auth] session verification:", authInspection.sessionVerification);
  console.log("[AI Auth] firebase verification attempted:", authInspection.firebaseVerificationAttempted ? "yes" : "no");
  if (authInspection.firebaseVerificationAttempted) {
    console.log("[AI Auth] firebase verification:", authInspection.firebaseVerification);
  }
  console.log("[AI Auth] authenticated uid:", authInspection.userId || "none");
  if (authInspection.sessionVerification === "fail" && authInspection.sessionFailReason) {
    console.log("[AI Auth] session failure reason:", authInspection.sessionFailReason);
  }
  const userId = authInspection.userId;
  if (!userId) {
    const isExpired = authInspection.sessionFailReason === "expired";
    return res.status(401).json({
      error: isExpired ? "Session expired" : "Authentication required",
      code: isExpired ? "SESSION_EXPIRED" : "AUTH_REQUIRED"
    });
  }
  if (isProductionEnvironment() && (!dbAdmin || !firebaseAdminState.firestoreReady)) {
    console.log("[AI Gateway] final response code: FIREBASE_ADMIN_UNAVAILABLE");
    return res.status(503).json({
      error: "Server ma'lumotlar bazasi autentifikatsiyasi sozlanmagan.",
      code: "FIREBASE_ADMIN_UNAVAILABLE"
    });
  }
  const { contents, systemInstruction, config, model } = req.body || {};
  const operation = validateOperation(req.body?.operation);
  const targetModel = resolveModel(operation, model);
  const creditCost = AI_CREDIT_COSTS[operation] || 1;
  console.log(`[AI Gateway] authenticated uid: ${userId}`);
  console.log(`[AI Gateway] operation: ${operation}`);
  console.log(`[AI Gateway] requested credit cost: ${creditCost}`);
  if (!acquireUserLock(userId)) {
    console.log("[AI Gateway] 429_SOURCE=CONCURRENCY_LIMIT");
    console.log("[AI Gateway] final response code: CONCURRENT_REQUEST");
    return res.status(409).json({
      error: "Oldingi so'rovingiz hali bajarilmoqda. Iltimos, uning yakunlanishini kuting.",
      code: "CONCURRENT_REQUEST"
    });
  }
  let reservation = null;
  try {
    reservation = await reserveCredits(dbAdmin, userId, operation, targetModel);
    if (!reservation.allowed) {
      if (reservation.code === "AI_CREDIT_LIMIT") {
        console.log(`[AI Gateway] credits before: ${reservation.creditsRemaining}`);
        console.log(`[AI Gateway] credits after reservation: ${reservation.creditsRemaining}`);
        console.log("[AI Gateway] 429_SOURCE=USER_CREDIT_LIMIT");
        console.log("[AI Gateway] final response code: AI_CREDIT_LIMIT");
        return res.status(429).json({
          error: "Bugungi bepul AI limitingiz tugadi. AI kreditlaringiz ertaga yangilanadi.",
          code: "AI_CREDIT_LIMIT",
          creditsRemaining: reservation.creditsRemaining,
          creditsDailyLimit: reservation.creditsDailyLimit,
          resetDate: reservation.resetDate
        });
      }
      if (reservation.code === "GLOBAL_SAFETY_LIMIT") {
        console.log(`[AI Gateway] credits before: ${reservation.creditsRemaining}`);
        console.log(`[AI Gateway] credits after reservation: ${reservation.creditsRemaining}`);
        console.log("[AI Gateway] 429_SOURCE=GLOBAL_SAFETY_LIMIT");
        console.log("[AI Gateway] final response code: GLOBAL_SAFETY_LIMIT");
        return res.status(429).json({
          error: reservation.error || "Tizimda bugungi umumiy so'rovlar chegarasiga yetildi. Iltimos, keyinroq qayta urinib ko'ring.",
          code: "GLOBAL_SAFETY_LIMIT",
          creditsRemaining: reservation.creditsRemaining,
          creditsDailyLimit: reservation.creditsDailyLimit,
          resetDate: reservation.resetDate
        });
      }
      if (reservation.code === "FIREBASE_ADMIN_UNAVAILABLE" || reservation.code === "CREDIT_STORAGE_UNAVAILABLE") {
        console.log("[AI Gateway] final response code: FIREBASE_ADMIN_UNAVAILABLE");
        return res.status(503).json({
          error: "Server ma'lumotlar bazasi autentifikatsiyasi sozlanmagan.",
          code: "FIREBASE_ADMIN_UNAVAILABLE"
        });
      }
      console.log(`[AI Gateway] final response code: ${reservation.code || "RESERVATION_FAILED"}`);
      return res.status(500).json({
        error: reservation.error || "Kreditlarni tekshirishda xatolik yuz berdi.",
        code: reservation.code || "RESERVATION_FAILED"
      });
    }
    const creditsBefore = reservation.creditsRemaining + creditCost;
    const creditsAfter = reservation.creditsRemaining;
    console.log(`[AI Gateway] credits before: ${creditsBefore}`);
    console.log(`[AI Gateway] credits after reservation: ${creditsAfter}`);
    console.log(`[AI Gateway] resolved model: ${targetModel}`);
    const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "your_real_key_here") {
      await refundAiUsage(dbAdmin, reservation.requestId, userId, creditCost, "Server GEMINI_API_KEY missing");
      console.log("[AI Gateway] final response code: AI_CONFIGURATION_ERROR");
      return res.status(503).json({
        error: "Serverda Gemini API sozlanmagan (GEMINI_API_KEY mavjud emas). Iltimos, administratorga murojaat qiling.",
        code: "AI_CONFIGURATION_ERROR",
        refunded: true,
        creditsRemaining: creditsBefore
      });
    }
    console.log("[AI Gateway] provider request start");
    const genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "dastyorchi-ai-gateway"
        }
      }
    });
    const result = await genAI.models.generateContent({
      model: targetModel,
      contents,
      config: {
        ...config,
        maxOutputTokens: 8192,
        systemInstruction
      }
    });
    const text = result.text;
    if (!text || typeof text !== "string") {
      throw new Error("Provider returned empty response");
    }
    console.log("[AI Gateway] provider response status: 200");
    console.log("[AI Gateway] provider error category: NONE");
    console.log("[AI Gateway] final response code: SUCCESS");
    const usageMetadata = result.usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;
    const totalTokens = usageMetadata.totalTokenCount || inputTokens + outputTokens;
    await finalizeAiUsage(dbAdmin, reservation.requestId, userId, {
      inputTokens,
      outputTokens,
      totalTokens
    });
    return res.json({
      text,
      creditsRemaining: reservation.creditsRemaining,
      creditsDailyLimit: reservation.creditsDailyLimit,
      creditsUsedToday: reservation.creditsUsedToday,
      creditCost,
      requestId: reservation.requestId,
      model: targetModel
    });
  } catch (error) {
    const errorMessage = typeof error === "object" ? error.message || JSON.stringify(error) : String(error);
    const errLower = errorMessage.toLowerCase();
    const providerStatus = error?.status || error?.statusCode || (errLower.includes("resource_exhausted") || errLower.includes("429") ? 429 : 500);
    const providerErrorCode = error?.code || error?.error?.code || (errLower.includes("resource_exhausted") ? "RESOURCE_EXHAUSTED" : void 0);
    const providerErrorType = error?.error?.status || error?.name || "ProviderError";
    const retryAfter = error?.response?.headers?.get?.("retry-after") || error?.retryAfter;
    console.log(`[AI Gateway] provider status: ${providerStatus}`);
    if (providerErrorCode) console.log(`[AI Gateway] provider error code: ${providerErrorCode}`);
    console.log(`[AI Gateway] provider error type: ${providerErrorType}`);
    console.log(`[AI Gateway] model name: ${targetModel}`);
    if (retryAfter) console.log(`[AI Gateway] retry-after: ${retryAfter}`);
    if (reservation && reservation.allowed) {
      try {
        await refundAiUsage(dbAdmin, reservation.requestId, userId, creditCost, errorMessage);
        console.log(`[AI Gateway] Atomically refunded ${creditCost} credit(s) to user ${userId}. Final visible credits: ${reservation.creditsRemaining + creditCost}`);
      } catch (refundErr) {
        console.error("[AI Gateway] Error in refund:", refundErr.message);
      }
    }
    const isQuotaOrRateLimit = errLower.includes("429") || errLower.includes("quota") || errLower.includes("resource_exhausted") || providerStatus === 429;
    if (isQuotaOrRateLimit) {
      console.log("[AI Gateway] provider response status: 429");
      console.log("[AI Gateway] provider error category: RESOURCE_EXHAUSTED");
      console.log("[AI Gateway] 429_SOURCE=PROVIDER_RATE_LIMIT");
      console.log("[AI Gateway] final response code: PROVIDER_RATE_LIMIT");
      return res.status(429).json({
        code: "PROVIDER_RATE_LIMIT",
        error: "AI provayderining vaqtinchalik limiti tugadi.",
        provider: "gemini",
        refunded: true,
        creditsRemaining: reservation ? reservation.creditsRemaining + creditCost : void 0,
        creditsDailyLimit: reservation?.creditsDailyLimit
      });
    }
    if (errLower.includes("api_key_invalid") || errLower.includes("api key not valid") || errLower.includes("api key invalid") || errLower.includes("401") && (errLower.includes("key") || errLower.includes("credential") || errLower.includes("unauthenticated"))) {
      console.log("[AI Gateway] provider response status: 401");
      console.log("[AI Gateway] provider error category: PROVIDER_AUTH_ERROR");
      console.log("[AI Gateway] final response code: PROVIDER_AUTH_ERROR");
      return res.status(500).json({
        code: "PROVIDER_AUTH_ERROR",
        error: "Gemini API provayderi autentifikatsiyasida xatolik yuz berdi (GEMINI_API_KEY xato). Kreditlaringiz qaytarildi.",
        refunded: true,
        creditsRemaining: reservation ? reservation.creditsRemaining + creditCost : void 0
      });
    }
    if (errLower.includes("not found") || errLower.includes("is not found for api version") || errLower.includes("models/") || errLower.includes("model") && (errLower.includes("not supported") || errLower.includes("unavailable") || errLower.includes("not found"))) {
      console.log("[AI Gateway] provider response status: 503");
      console.log("[AI Gateway] provider error category: MODEL_NOT_AVAILABLE");
      console.log("[AI Gateway] final response code: MODEL_NOT_AVAILABLE");
      return res.status(503).json({
        code: "MODEL_NOT_AVAILABLE",
        error: "Tanlangan Gemini modeli hozirda mavjud emas yoki qo'llab-quvvatlanmaydi.",
        refunded: true,
        creditsRemaining: reservation ? reservation.creditsRemaining + creditCost : void 0
      });
    }
    if (errLower.includes("413") || errLower.includes("payload") || errLower.includes("body too large")) {
      console.log("[AI Gateway] provider response status: 413");
      console.log("[AI Gateway] provider error category: PAYLOAD_TOO_LARGE");
      console.log("[AI Gateway] final response code: PAYLOAD_TOO_LARGE");
      return res.status(413).json({
        code: "PAYLOAD_TOO_LARGE",
        error: "Yuborilgan fayl yoki matn hajmi juda katta. Kreditlaringiz qaytarildi.",
        refunded: true,
        creditsRemaining: reservation ? reservation.creditsRemaining + creditCost : void 0
      });
    }
    if (errLower.includes("context_length_exceeded") || errLower.includes("context overflow")) {
      console.log("[AI Gateway] provider response status: 400");
      console.log("[AI Gateway] provider error category: CONTEXT_OVERFLOW");
      console.log("[AI Gateway] final response code: CONTEXT_OVERFLOW");
      return res.status(400).json({
        code: "CONTEXT_OVERFLOW",
        error: "Suhbat tarixi yoki hujjat hajmi model chegarasidan oshib ketdi. Kreditlaringiz qaytarildi.",
        refunded: true,
        creditsRemaining: reservation ? reservation.creditsRemaining + creditCost : void 0
      });
    }
    console.log(`[AI Gateway] provider response status: ${providerStatus}`);
    console.log("[AI Gateway] provider error category: SERVER_ERROR");
    console.log("[AI Gateway] final response code: SERVER_ERROR");
    return res.status(500).json({
      code: "SERVER_ERROR",
      error: "AI xizmatida vaqtinchalik nosozlik yuz berdi. Kreditlaringiz hisobingizga qaytarildi. Iltimos, qayta urinib ko'ring.",
      refunded: true,
      creditsRemaining: reservation ? reservation.creditsRemaining + creditCost : void 0
    });
  } finally {
    releaseUserLock(userId);
  }
});
apiRouter.post("/export/docx", async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) {
      return res.status(400).json({ error: "HTML content is required" });
    }
    const fileBuffer = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", 'attachment; filename="document.docx"');
    return res.send(fileBuffer);
  } catch (error) {
    console.error("Error generating DOCX:", error);
    return res.status(500).json({ error: "Failed to generate DOCX" });
  }
});
apiRouter.post("/payment/create-invoice", async (req, res) => {
  try {
    const { userId, tier, paymentMethod, returnUrl } = req.body;
    if (!userId || !tier || !paymentMethod) {
      return res.status(400).json({ error: "To'lov uchun zarur ma'lumotlar yetishmayapti: userId, tier, paymentMethod" });
    }
    const amountUZS = tier === "pro" ? 25e4 : 63e4;
    const amountTiyins = amountUZS * 100;
    let checkoutUrl = "";
    if (paymentMethod === "payme") {
      const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID;
      if (!PAYME_MERCHANT_ID) {
        return res.status(503).json({ error: "Payme to'lov tizimi sozlanmagan (PAYME_MERCHANT_ID yetishmaydi)." });
      }
      const rawString = `m=${PAYME_MERCHANT_ID};ac.userId=${userId};a=${amountTiyins}`;
      const base64Params = Buffer.from(rawString).toString("base64");
      checkoutUrl = `https://checkout.payme.uz/${base64Params}`;
    } else if (paymentMethod === "click") {
      const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
      const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
      if (!CLICK_SERVICE_ID || !CLICK_MERCHANT_ID) {
        return res.status(503).json({ error: "Click to'lov tizimi sozlanmagan (CLICK_SERVICE_ID yoki CLICK_MERCHANT_ID yetishmaydi)." });
      }
      const defaultReturnUrl = "https://dastyorchi.uz/profile";
      const finalReturnUrl = returnUrl || defaultReturnUrl;
      checkoutUrl = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${amountUZS}&transaction_param=${userId}&return_url=${encodeURIComponent(finalReturnUrl)}`;
    } else {
      return res.status(400).json({ error: "Noma'lum to'lov tizimi turi." });
    }
    console.log(`[Payment] Invoice built for user: ${userId}, Tier: ${tier}, Method: ${paymentMethod}`);
    return res.json({ checkoutUrl });
  } catch (err) {
    console.error("Failed to construct invoice:", err);
    return res.status(500).json({ error: err.message || "To'lov hisobini shakllantirishda xatolik yuz berdi" });
  }
});
apiRouter.post("/payment/click-webhook", async (req, res) => {
  try {
    const {
      click_trans_id,
      service_id,
      click_paydoc_id,
      merchant_trans_id,
      amount,
      action,
      error,
      error_note,
      sign_time,
      sign_string
    } = req.body;
    console.log("[ClickWebhook] Payload received:", { click_trans_id, action, amount, merchant_trans_id });
    const CLICK_MERCHANT_KEY = process.env.CLICK_MERCHANT_KEY;
    if (!CLICK_MERCHANT_KEY) {
      console.error("CLICK_MERCHANT_KEY is not configured on server.");
      return res.status(503).json({ error: -1, error_note: "Click merchant key not configured on server" });
    }
    const dataToSign = `${click_trans_id}${service_id}${click_paydoc_id}${merchant_trans_id}${amount}${action}${sign_time}${CLICK_MERCHANT_KEY}`;
    const calculatedSign = crypto.createHash("md5").update(dataToSign).digest("hex");
    if (calculatedSign !== sign_string) {
      console.error("Click webhook signature invalid. Received:", sign_string, "Expected:", calculatedSign);
      return res.json({
        error: -1,
        error_note: "Signature authentication verification failed"
      });
    }
    const userId = merchant_trans_id;
    if (!userId) {
      return res.json({ error: -2, error_note: "Missing merchant transaction user identification" });
    }
    if (dbAdmin) {
      const userSnap = await dbAdmin.collection("users").doc(userId).get();
      if (!userSnap.exists) {
        return res.json({ error: -5, error_note: "Foydalanuvchi hisobi topilmadi (User not found)" });
      }
    }
    if (Number(action) === 0) {
      return res.json({
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id: `prep_${click_trans_id}`,
        error: 0,
        error_note: "Success"
      });
    }
    if (Number(action) === 1) {
      if (Number(error) < 0) {
        console.warn("CLICK payment error:", error_note);
        return res.json({ error, error_note: "Payment reported error state" });
      }
      const paymentAmount = Number(amount);
      const tier = paymentAmount >= 6e5 ? "business" : "pro";
      await upgradeUserSubscription(userId, tier, "click", paymentAmount);
      return res.json({
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: `conf_${click_trans_id}`,
        error: 0,
        error_note: "To'lov muvaffaqiyatli qabul qilindi hamda obuna faollashtirildi!"
      });
    }
    return res.json({ error: -3, error_note: "Invalid interaction action requested" });
  } catch (err) {
    console.error("Click webhook error:", err);
    return res.status(550).json({ error: -4, error_note: err.message || "Internal server crash" });
  }
});
apiRouter.post("/payment/payme-webhook", async (req, res) => {
  try {
    const { method, params, id: jsonRpcId } = req.body;
    console.log(`[PaymeWebhook] method: ${method}`);
    const PAYME_MERCHANT_KEY = process.env.PAYME_MERCHANT_KEY;
    if (!PAYME_MERCHANT_KEY) {
      console.error("PAYME_MERCHANT_KEY is not configured on server.");
      return res.status(503).json({
        jsonrpc: "2.0",
        error: { code: -32504, message: "Payme merchant key not configured on server" },
        id: jsonRpcId
      });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(200).json({
        jsonrpc: "2.0",
        error: { code: -32504, message: "Unauthorized merchant identification key" },
        id: jsonRpcId
      });
    }
    const base64Creds = authHeader.split(" ")[1] || "";
    const creds = Buffer.from(base64Creds, "base64").toString("ascii");
    const password = creds.split(":")[1] || "";
    if (password !== PAYME_MERCHANT_KEY) {
      return res.status(200).json({
        jsonrpc: "2.0",
        error: { code: -32504, message: "Unauthorized merchant identification key" },
        id: jsonRpcId
      });
    }
    if (!dbAdmin) {
      return res.json({
        jsonrpc: "2.0",
        error: { code: -31008, message: "Firestore database administration node offline" },
        id: jsonRpcId
      });
    }
    if (method === "CheckPerformTransaction") {
      const userId = params.account?.userId;
      if (!userId) {
        return res.json({
          jsonrpc: "2.0",
          error: { code: -31050, message: "UserId is missing from account details", data: "userId" },
          id: jsonRpcId
        });
      }
      const userSnap = await dbAdmin.collection("users").doc(userId).get();
      if (!userSnap.exists) {
        return res.json({
          jsonrpc: "2.0",
          error: { code: -31050, message: "User account identifier not found in the DB", data: "userId" },
          id: jsonRpcId
        });
      }
      return res.json({
        jsonrpc: "2.0",
        result: { allow: true },
        id: jsonRpcId
      });
    }
    if (method === "CreateTransaction") {
      const transId = params.id;
      const userId = params.account?.userId;
      const amount = Number(params.amount);
      const time = params.time;
      if (!userId || !transId) {
        return res.json({
          jsonrpc: "2.0",
          error: { code: -32602, message: "Invalid parameters" },
          id: jsonRpcId
        });
      }
      const transRef = dbAdmin.collection("paymeTransactions").doc(transId);
      const transSnap = await transRef.get();
      if (transSnap.exists) {
        const transData = transSnap.data();
        if (transData.state === 1) {
          return res.json({
            jsonrpc: "2.0",
            result: {
              create_time: transData.create_time,
              transaction: transId,
              state: 1
            },
            id: jsonRpcId
          });
        } else {
          return res.json({
            jsonrpc: "2.0",
            error: { code: -31007, message: "Transaction is already initialized or finalized" },
            id: jsonRpcId
          });
        }
      }
      const createTime = Date.now();
      await transRef.set({
        id: transId,
        userId,
        amount,
        time,
        state: 1,
        create_time: createTime,
        perform_time: 0,
        cancel_time: 0,
        reason: 0
      });
      return res.json({
        jsonrpc: "2.0",
        result: {
          create_time: createTime,
          transaction: transId,
          state: 1
        },
        id: jsonRpcId
      });
    }
    if (method === "PerformTransaction") {
      const transId = params.id;
      if (!transId) {
        return res.json({
          jsonrpc: "2.0",
          error: { code: -32602, message: "Missing transaction identification parameter" },
          id: jsonRpcId
        });
      }
      const transRef = dbAdmin.collection("paymeTransactions").doc(transId);
      const transSnap = await transRef.get();
      if (!transSnap.exists) {
        return res.json({
          jsonrpc: "2.0",
          error: { code: -31003, message: "Transaction context was not found" },
          id: jsonRpcId
        });
      }
      const transData = transSnap.data();
      if (transData.state === 1) {
        const uAmountUZS = transData.amount / 100;
        const tier = uAmountUZS >= 6e5 ? "business" : "pro";
        await upgradeUserSubscription(transData.userId, tier, "payme", uAmountUZS);
        const performTime = Date.now();
        await transRef.update({
          state: 2,
          perform_time: performTime
        });
        return res.json({
          jsonrpc: "2.0",
          result: {
            perform_time: performTime,
            transaction: transId,
            state: 2
          },
          id: jsonRpcId
        });
      } else if (transData.state === 2) {
        return res.json({
          jsonrpc: "2.0",
          result: {
            perform_time: transData.perform_time,
            transaction: transId,
            state: 2
          },
          id: jsonRpcId
        });
      } else {
        return res.json({
          jsonrpc: "2.0",
          error: { code: -31008, message: "Cannot perform already canceled or suspended transaction" },
          id: jsonRpcId
        });
      }
    }
    if (method === "CancelTransaction") {
      const transId = params.id;
      const reason = Number(params.reason || 1);
      if (!transId) {
        return res.json({
          jsonrpc: "2.0",
          error: { code: -32602, message: "Missing parameter transId" },
          id: jsonRpcId
        });
      }
      const transRef = dbAdmin.collection("paymeTransactions").doc(transId);
      const transSnap = await transRef.get();
      if (!transSnap.exists) {
        return res.json({
          jsonrpc: "2.0",
          error: { code: -31003, message: "Transaction record was not found" },
          id: jsonRpcId
        });
      }
      const transData = transSnap.data();
      if (transData.state === 1) {
        const cancelTime = Date.now();
        await transRef.update({
          state: -1,
          cancel_time: cancelTime,
          reason
        });
        return res.json({
          jsonrpc: "2.0",
          result: {
            cancel_time: cancelTime,
            transaction: transId,
            state: -1
          },
          id: jsonRpcId
        });
      } else if (transData.state === 2) {
        const cancelTime = Date.now();
        await transRef.update({
          state: -2,
          cancel_time: cancelTime,
          reason
        });
        await dbAdmin.collection("users").doc(transData.userId).update({
          subscriptionTier: "free",
          subscriptionStatus: "canceled"
        });
        return res.json({
          jsonrpc: "2.0",
          result: {
            cancel_time: cancelTime,
            transaction: transId,
            state: -2
          },
          id: jsonRpcId
        });
      } else {
        return res.json({
          jsonrpc: "2.0",
          result: {
            cancel_time: transData.cancel_time,
            transaction: transId,
            state: transData.state
          },
          id: jsonRpcId
        });
      }
    }
    if (method === "CheckTransaction") {
      const transId = params.id;
      if (!transId) {
        return res.json({
          jsonrpc: "2.0",
          error: { code: -32602, message: "Transaction ID is required" },
          id: jsonRpcId
        });
      }
      const transSnap = await dbAdmin.collection("paymeTransactions").doc(transId).get();
      if (!transSnap.exists) {
        return res.json({
          jsonrpc: "2.0",
          error: { code: -31003, message: "Transaction not found" },
          id: jsonRpcId
        });
      }
      const transData = transSnap.data();
      return res.json({
        jsonrpc: "2.0",
        result: {
          create_time: transData.create_time,
          perform_time: transData.perform_time,
          cancel_time: transData.cancel_time,
          transaction: transId,
          state: transData.state,
          reason: transData.reason || null
        },
        id: jsonRpcId
      });
    }
    return res.json({
      jsonrpc: "2.0",
      error: { code: -32601, message: "Requested JSON-RPC method not supported" },
      id: jsonRpcId
    });
  } catch (error) {
    console.error("Payme Webhook crash:", error);
    return res.status(500).json({
      jsonrpc: "2.0",
      error: { code: -32603, message: error.message || "Internal server crash" },
      id: req.body?.id || null
    });
  }
});
app.use("/api", apiRouter);
app.use(apiRouter);
app.use((err, req, res, next) => {
  if (err) {
    console.error("Express API error caught:", err);
    return res.status(err.status || err.statusCode || 500).json({
      error: err.message || "Server Error",
      code: err.code || "SERVER_ERROR"
    });
  }
  next();
});
var app_default = app;
export {
  app,
  authenticateRequestDetails,
  dbAdmin,
  app_default as default,
  firebaseAdminState,
  firebaseInitStatus,
  verifySessionToken
};

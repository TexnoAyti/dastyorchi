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
import {
  AIOperation,
  AI_CREDIT_COSTS,
  DEFAULT_TIER_LIMITS,
  getTashkentDateString,
  discoverAvailableModels,
  resolveModel,
  getFallbackModelChain,
  isModelUnavailableError,
  validateOperation,
  acquireAIRequestLock,
  releaseAIRequestLock,
  acquireUserLock,
  releaseUserLock,
  reserveCredits,
  finalizeAiUsage,
  refundAiUsage,
  getUserCreditStatus,
  getAiAnalytics,
  ReservationResult,
  isProductionEnvironment
} from "./aiGateway";

dotenv.config();

// ==========================================
// 1. FIREBASE ADMIN PRODUCTION INITIALIZATION
// ==========================================
export interface FirebaseAdminState {
  initialized: boolean;
  credentialMode: "service_account_cert" | "development_fallback" | "none";
  firestoreReady: boolean;
  projectId?: string;
  clientEmail?: string;
  error?: string;
}

export const firebaseAdminState: FirebaseAdminState = {
  initialized: false,
  credentialMode: "none",
  firestoreReady: false
};

let dbAdmin: FirebaseFirestore.Firestore | null = null;
let firebaseInitStatus = "not_initialized";

interface ParsedServiceAccount {
  valid: boolean;
  configured: boolean;
  parsed: boolean;
  data?: any;
  error?: string;
}

function parseAndValidateServiceAccount(rawEnv: string | undefined): ParsedServiceAccount {
  if (!rawEnv || !rawEnv.trim()) {
    return { valid: false, configured: false, parsed: false, error: "FIREBASE_SERVICE_ACCOUNT_KEY not set" };
  }

  let str = rawEnv.trim();
  // Strip outer quotes if mistakenly passed in env (e.g. from env files or Vercel UI)
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }

  let parsedObj: any = null;
  // Attempt 1: Raw JSON
  try {
    parsedObj = JSON.parse(str);
  } catch (e1) {
    // Attempt 2: Base64-encoded JSON
    try {
      const decoded = Buffer.from(str, "base64").toString("utf-8").trim();
      parsedObj = JSON.parse(decoded);
    } catch (e2: any) {
      return { valid: false, configured: true, parsed: false, error: "Failed to parse JSON (checked raw and base64)" };
    }
  }

  if (!parsedObj || typeof parsedObj !== "object") {
    return { valid: false, configured: true, parsed: false, error: "Service account is not a valid JSON object" };
  }

  // Validate required fields
  const { type, project_id, private_key, client_email } = parsedObj;
  const missing: string[] = [];
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

  // Normalize private key escaped newlines
  if (typeof private_key === "string") {
    parsedObj.private_key = private_key.replace(/\\n/g, "\n");
  }

  return { valid: true, configured: true, parsed: true, data: parsedObj };
}

// Read expected project ID from frontend config or explicit env
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let expectedFrontendProjectId: string | undefined = process.env.FIREBASE_PROJECT_ID?.trim();
let configuredDatabaseId: string | undefined = process.env.FIRESTORE_DATABASE_ID?.trim();

if (fs.existsSync(configPath)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (!expectedFrontendProjectId && cfg.projectId) {
      expectedFrontendProjectId = cfg.projectId.trim();
    }
    if (!configuredDatabaseId && cfg.firestoreDatabaseId) {
      configuredDatabaseId = cfg.firestoreDatabaseId.trim();
    }
  } catch (e) {}
}

try {
  const isProd = isProductionEnvironment();
  const rawKeyEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  const sa = parseAndValidateServiceAccount(rawKeyEnv);

  const isConfigured = sa.configured;
  const isParsed = sa.parsed;
  const saProjectId = sa.data?.project_id || "none";
  const isClientEmailConfigured = Boolean(sa.data?.client_email);

  // Diagnostic logging (Requirement 2):
  console.log(`[FirebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY configured: ${isConfigured ? "yes" : "no"}`);
  console.log(`[FirebaseAdmin] service account parsed: ${isParsed ? "yes" : "no"}`);
  console.log(`[FirebaseAdmin] project id: ${sa.valid ? saProjectId : (expectedFrontendProjectId || "none")}`);
  console.log(`[FirebaseAdmin] client email configured: ${isClientEmailConfigured ? "yes" : "no"}`);

  // Project ID Match check (Requirement 5):
  let projectMismatch = false;
  if (sa.valid && sa.data) {
    const candidateProjectId = sa.data.project_id;
    // Check against FIREBASE_PROJECT_ID if explicitly configured
    if (process.env.FIREBASE_PROJECT_ID?.trim() && process.env.FIREBASE_PROJECT_ID.trim() !== candidateProjectId) {
      console.error(`[FirebaseAdmin] PROJECT_ID_MISMATCH`);
      console.error(`[FirebaseAdmin] service account project_id (${candidateProjectId}) does not match FIREBASE_PROJECT_ID (${process.env.FIREBASE_PROJECT_ID.trim()})`);
      projectMismatch = true;
    }
    // Check against frontend project ID
    if (expectedFrontendProjectId && expectedFrontendProjectId !== candidateProjectId) {
      console.error(`[FirebaseAdmin] PROJECT_ID_MISMATCH`);
      console.error(`[FirebaseAdmin] service account project_id (${candidateProjectId}) does not match frontend project (${expectedFrontendProjectId})`);
      projectMismatch = true;
    }
  }

  let adminApp: admin.app.App | null = null;

  if (sa.valid && !projectMismatch) {
    try {
      if (admin.apps.length > 0) {
        adminApp = admin.apps[0]!;
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
    } catch (initErr: any) {
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
    // Service account invalid or missing or project mismatch
    if (isProd) {
      // In production (Vercel), NEVER attempt ADC or project-id-only initialization
      firebaseAdminState.initialized = false;
      firebaseAdminState.credentialMode = "none";
      firebaseAdminState.firestoreReady = false;
      firebaseAdminState.error = projectMismatch
        ? "PROJECT_ID_MISMATCH"
        : (sa.error || "FIREBASE_SERVICE_ACCOUNT_KEY missing or invalid");
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
      // Development-only fallback (e.g. AI Studio container with Cloud Run IAM credentials)
      const devProjectId = expectedFrontendProjectId || process.env.FIREBASE_PROJECT_ID?.trim() || "dastyorchi";
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
        } catch (devErr: any) {
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
} catch (fatalErr: any) {
  console.error("[FirebaseAdmin] Fatal startup error:", fatalErr.message);
  firebaseAdminState.initialized = false;
  firebaseAdminState.credentialMode = "none";
  firebaseAdminState.firestoreReady = false;
  firebaseAdminState.error = fatalErr.message;
  firebaseInitStatus = "fatal_error: " + fatalErr.message;
}

// ==========================================
// 2. TELEGRAM HMAC VERIFICATION & SESSIONS
// ==========================================

function verifyTelegramWebAppData(initData: string, botToken: string): { valid: boolean; user?: any; authDate?: number; error?: string } {
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

    // Sort parameters alphabetically
    const keys = Array.from(params.keys()).sort();
    const checkString = keys.map(key => `${key}=${params.get(key)}`).join("\n");

    // Compute secret key: HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();

    // Compute hash: HMAC-SHA256(secretKey, checkString)
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

    // Timing-safe comparison
    const hashBuf = Buffer.from(hash, "hex");
    const calcBuf = Buffer.from(calculatedHash, "hex");
    if (hashBuf.length !== calcBuf.length || !crypto.timingSafeEqual(hashBuf, calcBuf)) {
      return { valid: false, error: "Telegram imzosi (hash) mos kelmadi" };
    }

    const authDateStr = params.get("auth_date");
    const authDate = authDateStr ? parseInt(authDateStr, 10) : 0;
    const now = Math.floor(Date.now() / 1000);
    // Allow up to 48 hours for auth_date
    if (!authDate || (now - authDate) > 86400 * 2) {
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
  } catch (err: any) {
    return { valid: false, error: err.message || "Tasdiqlashda xatolik yuz berdi" };
  }
}

export type SessionFailReason = "missing_token" | "malformed_token" | "signature_mismatch" | "expired";

function getSessionSecret(): string {
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

function createSessionToken(payload: any): string {
  const secret = getSessionSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): {
  valid: boolean;
  payload?: any;
  reason?: SessionFailReason;
  error?: string;
} {
  try {
    if (!token) {
      return { valid: false, reason: "missing_token", error: "Token taqdim etilmagan" };
    }
    const cleanToken = token.trim();
    const parts = cleanToken.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { valid: false, reason: "malformed_token", error: "Yaroqsiz token formati" };
    }

    let secret: string;
    try {
      secret = getSessionSecret();
    } catch (err: any) {
      return { valid: false, reason: "malformed_token", error: err.message };
    }

    const [data, signature] = parts;
    let expectedSignature: string;
    try {
      expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    } catch (err: any) {
      return { valid: false, reason: "malformed_token", error: "Imzo hisoblashda xatolik" };
    }

    const sigBuf = Buffer.from(signature, "utf-8");
    const expBuf = Buffer.from(expectedSignature, "utf-8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: "signature_mismatch", error: "Token imzosi noto'g'ri" };
    }

    let payload: any;
    try {
      payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    } catch {
      return { valid: false, reason: "malformed_token", error: "Token ma'lumotini o'qib bo'lmadi" };
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: "expired", error: "Sessiya vaqti tugagan" };
    }

    if (!payload.uid) {
      return { valid: false, reason: "malformed_token", error: "Token foydalanuvchi ma'lumotiga ega emas" };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, reason: "malformed_token", error: err.message || "Tokenni tekshirishda xatolik" };
  }
}

async function upgradeUserSubscription(userId: string, tier: "pro" | "business", provider: string, amount: number) {
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
      updatedAt: new Date().toISOString()
    });
    console.log(`[SubscriptionUpgrade] Successfully upgraded user: ${userId} to ${tier} tier (${newLimit} credits/day) via ${provider}`);
  } catch (err: any) {
    console.error(`[SubscriptionUpgrade] Error updating user ${userId}:`, err.message);
  }
}

export interface RequestAuthDiagnosis {
  userId: string | null;
  authHeaderPresent: boolean;
  tokenFormat: "session" | "firebase" | "unknown";
  sessionVerification: "pass" | "fail";
  sessionFailReason?: SessionFailReason | null;
  firebaseVerificationAttempted: boolean;
  firebaseVerification: "pass" | "fail" | "skipped";
  firebaseFailReason?: "firebase_invalid" | null;
  errorCode?: "AUTH_REQUIRED" | "SESSION_EXPIRED";
  error?: string;
}

/**
 * Authoritative diagnostic request authenticator used uniformly by all protected routes.
 * Inspects Authorization header, verifies HMAC session or Firebase ID token, and enforces
 * strict error categorization without logging credentials or secrets.
 */
export async function authenticateRequestDetails(req: express.Request): Promise<RequestAuthDiagnosis> {
  const rawAuth = (req.headers.authorization || req.headers.Authorization || "") as string;
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
  let tokenFormat: "session" | "firebase" | "unknown" = "unknown";
  if (dotCount === 1) {
    tokenFormat = "session";
  } else if (dotCount === 2) {
    tokenFormat = "firebase";
  }

  // 1. First priority: Dastyorchi HMAC session token verification
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

  // 2. Second priority: Firebase ID token verification if Firebase Admin is initialized
  let firebaseVerificationAttempted = false;
  let firebaseVerification: "pass" | "fail" | "skipped" = "skipped";
  let firebaseFailReason: "firebase_invalid" | null = null;

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

  // 3. Fallback for non-production development testing
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

  // Authentic verification failure
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

/**
 * Canonical authenticateRequestUser function used uniformly across all endpoints.
 */
async function authenticateRequestUser(req: express.Request): Promise<string | null> {
  const diagnosis = await authenticateRequestDetails(req);
  return diagnosis.userId;
}

/**
 * Authoritative check if user has admin privileges.
 * Validates against environment ADMIN_TELEGRAM_IDS, JWT claims, and Firestore.
 */
export async function isUserAdmin(userId: string, req?: express.Request): Promise<boolean> {
  if (!userId) return false;

  const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  let telegramIdStr = "";
  if (userId.startsWith("tg_")) {
    telegramIdStr = userId.replace("tg_", "");
  }
  if (telegramIdStr && adminIds.includes(telegramIdStr)) {
    return true;
  }

  if (req) {
    const rawAuth = (req.headers.authorization || req.headers.Authorization || "") as string;
    const token = rawAuth.replace(/^Bearer\s+/i, "").trim();
    if (token) {
      const sessionResult = verifySessionToken(token);
      if (sessionResult.valid && sessionResult.payload?.role === "admin") {
        return true;
      }
      if (sessionResult.valid && sessionResult.payload?.telegramId && adminIds.includes(String(sessionResult.payload.telegramId))) {
        return true;
      }
      if (admin.apps.length > 0 && firebaseAdminState.credentialMode === "service_account_cert") {
        try {
          const decoded = await admin.auth().verifyIdToken(token);
          if (decoded?.role === "admin" || decoded?.admin === true) {
            return true;
          }
          if (decoded?.email && (decoded.email === "arslonovazamat11@gmail.com" || decoded.email === "admin@dastyorchi.uz")) {
            return true;
          }
        } catch {}
      }
    }
  }

  if (dbAdmin) {
    try {
      const snap = await dbAdmin.collection("users").doc(userId).get();
      if (snap.exists) {
        const data = snap.data();
        if (data?.role === "admin") return true;
        if (data?.telegramId && adminIds.includes(String(data.telegramId))) return true;
        if (data?.email && (data.email === "arslonovazamat11@gmail.com" || data.email === "admin@dastyorchi.uz")) return true;
      }
    } catch (err) {
      console.error("[AdminCheck] Firestore check error:", err);
    }
  } else if (!isProductionEnvironment()) {
    return true;
  }

  return false;
}

// ==========================================
// 3. EXPRESS APPLICATION & ROUTER
// ==========================================
export const app = express();

console.log("[Vercel API] Express app loaded");
console.log("[Vercel API] Runtime initialized");

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const apiRouter = express.Router();

// ------------------------------------------
// GET /health or /api/health
// ------------------------------------------
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

// ------------------------------------------
// POST /auth/telegram
// ------------------------------------------
apiRouter.post("/auth/telegram", async (req, res) => {
  try {
    console.log("[TelegramAuth] request received");
    const { initData, devBypass } = req.body || {};
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

    // Diagnostic logging according to safety guidelines
    console.log("[TelegramAuth] initData present:", Boolean(initData) ? "yes" : "no");
    console.log("[TelegramAuth] initData length:", initData ? initData.length : 0);
    console.log("[TelegramAuth] TELEGRAM_BOT_TOKEN configured:", Boolean(botToken) ? "yes" : "no");

    let telegramUser: any = null;
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
      const now = Math.floor(Date.now() / 1000);
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

    // Admin privileges check via trusted environment variable
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const isEnvAdmin = adminIds.includes(String(telegramId));

    let userProfile: any = null;
    let firestoreStatus = "skipped (no dbAdmin)";

    // Privileged server-side Firestore operations via Firebase Admin SDK
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
      } catch (e: any) {
        console.error("[TelegramAuth] Firestore read error:", e.message);
        firestoreStatus = "read error: " + e.message;
      }
    }

    if (!userProfile) {
      // New user creation
      const role = isEnvAdmin ? "admin" : "user";
      const displayName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ") ||
                          telegramUser.username ||
                          `Foydalanuvchi #${telegramId}`;
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
        lastAiRequestAt: new Date().toISOString(),
        lastRequestResetDate: new Date().toLocaleDateString("en-CA"),
        lastExportResetDate: new Date().toLocaleDateString("en-CA"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (dbAdmin) {
        try {
          await dbAdmin.collection("users").doc(internalUserId).set(userProfile);
          firestoreStatus = "write: new user created";
        } catch (e: any) {
          console.error("[TelegramAuth] Firestore create error:", e.message);
          firestoreStatus = "write error: " + e.message;
        }
      }
    } else {
      // Update basic telegram metadata
      const updatedFields: any = {
        firstName: telegramUser.first_name || userProfile.firstName || "",
        lastName: telegramUser.last_name || userProfile.lastName || "",
        username: telegramUser.username || userProfile.username || "",
        updatedAt: new Date().toISOString()
      };
      if (telegramUser.photo_url) {
        updatedFields.photoUrl = telegramUser.photo_url;
        updatedFields.avatarUrl = telegramUser.photo_url;
      }
      if (isEnvAdmin && userProfile.role !== "admin") {
        updatedFields.role = "admin";
        userProfile.role = "admin";
      }

      // Auto-migrate AI credits if missing
      if (userProfile.aiCreditsDailyLimit === undefined) {
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
        } catch (e: any) {
          console.error("[TelegramAuth] Firestore update error:", e.message);
          firestoreStatus = "update error: " + e.message;
        }
      }
    }

    console.log("[TelegramAuth] Firestore read/write result:", firestoreStatus);

    // Create session token
    const token = createSessionToken({
      uid: internalUserId,
      telegramId,
      role: userProfile.role || "user",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60)
    });

    console.log("[TelegramAuth] session token created: yes");

    // Generate Firebase Custom Token
    let firebaseCustomToken: string | null = null;
    if (admin.apps.length > 0 && firebaseAdminState.credentialMode === "service_account_cert") {
      try {
        const customClaims: Record<string, any> = {
          telegramId,
          role: userProfile.role || "user"
        };
        if (isEnvAdmin || userProfile.role === "admin") {
          customClaims.role = "admin";
          customClaims.admin = true;
        }
        firebaseCustomToken = await admin.auth().createCustomToken(internalUserId, customClaims);
        console.log("[TelegramAuth] Firebase custom token: success");
      } catch (tokenErr: any) {
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
  } catch (err: any) {
    console.error("[TelegramAuth] Unexpected server error:", err);
    return res.status(500).json({ error: "Avtorizatsiyada server xatoligi yuz berdi: " + (err.message || "") });
  }
});

// ------------------------------------------
// GET & POST /telegram/webhook
// ------------------------------------------
apiRouter.get("/telegram/webhook", (req, res) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const webAppUrl = process.env.TELEGRAM_WEBAPP_URL?.trim() || "https://dastyorchi.vercel.app";

  return res.json({
    status: "online",
    service: "Dastyorchi Telegram Bot Webhook Gateway",
    botConfigured: Boolean(botToken),
    webhookSecretConfigured: Boolean(webhookSecret),
    webAppUrl: webAppUrl
  });
});

apiRouter.post("/telegram/webhook", async (req, res) => {
  try {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
    if (webhookSecret) {
      const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
      if (incomingSecret !== webhookSecret) {
        console.warn("[Telegram Webhook] Unauthorized request: secret token mismatch");
        return res.status(403).json({ error: "Unauthorized webhook secret" });
      }
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!botToken) {
      console.warn("[Telegram Webhook] Received update but TELEGRAM_BOT_TOKEN is not configured");
      return res.status(200).json({ ok: true, message: "Bot token not configured on server" });
    }

    const update = req.body || {};
    const message = update.message || update.edited_message;

    // Gracefully ignore unsupported updates (channel posts, reactions, etc.)
    if (!message || !message.chat?.id) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const chatId = message.chat.id;
    const text = (message.text || "").trim();
    const firstName = message.from?.first_name || "";
    const webAppUrl = process.env.TELEGRAM_WEBAPP_URL?.trim() || "https://dastyorchi.vercel.app";

    console.log(`[Telegram Webhook] Update from chatId=${chatId}, text="${text.slice(0, 30)}"`);

    const isStart = text.startsWith("/start");

    const welcomeText = `Assalomu alaykum${firstName ? `, ${firstName}` : ""}! 👋

Dastyorchi — huquqiy masalalarni tushunish, hujjatlar tayyorlash va AI yordamida huquqiy tahlil olish uchun yaratilgan aqlli yordamchi.

⚖️ Huquqiy savollarga javob
📄 Ariza va hujjatlar tayyorlash
🔎 Hujjatlarni tahlil qilish
📁 Ish va hujjatlarni boshqarish

Boshlash uchun quyidagi tugmani bosing.`;

    const generalReply = `Assalomu alaykum! Dastyorchi yuridik yordamchisidan to'liq foydalanish uchun quyidagi tugma orqali ilovani oching:`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "Dastyorchini ochish 🚀",
            web_app: {
              url: webAppUrl
            }
          }
        ]
      ]
    };

    // Non-blocking fetch with defensive timeout so webhook returns quickly to Telegram
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: isStart ? welcomeText : generalReply,
        reply_markup: replyMarkup
      }),
      signal: controller.signal
    }).catch((err) => {
      console.error("[Telegram Webhook] Failed to send Telegram message:", err?.message || err);
    }).finally(() => {
      clearTimeout(timeout);
    });

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("[Telegram Webhook] Error processing update:", error);
    return res.status(200).json({ ok: true, error: error?.message || "Handler error" });
  }
});

// ------------------------------------------
// GET /auth/session
// ------------------------------------------
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
      } catch (e: any) {
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
  } catch (err: any) {
    return res.status(500).json({ error: "Sessiyani tekshirishda xatolik yuz berdi" });
  }
});

// ------------------------------------------
// POST /auth/dev-login (Disabled in production)
// ------------------------------------------
apiRouter.post("/auth/dev-login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Dev login is strictly forbidden in production" });
  }

  try {
    const devTelegramId = 999999999;
    const internalUserId = `tg_${devTelegramId}`;

    let userProfile: any = null;
    if (dbAdmin) {
      try {
        const snap = await dbAdmin.collection("users").doc(internalUserId).get();
        if (snap.exists) {
          userProfile = snap.data();
        }
      } catch (e) {}
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
        lastAiRequestAt: new Date().toISOString(),
        lastRequestResetDate: new Date().toLocaleDateString("en-CA"),
        lastExportResetDate: new Date().toLocaleDateString("en-CA"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (dbAdmin) {
        try {
          await dbAdmin.collection("users").doc(internalUserId).set(userProfile);
        } catch (e) {}
      }
    }

    const token = createSessionToken({
      uid: internalUserId,
      telegramId: devTelegramId,
      role: userProfile.role || "admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60)
    });

    let firebaseCustomToken: string | null = null;
    if (admin.apps.length > 0 && firebaseAdminState.credentialMode === "service_account_cert") {
      try {
        firebaseCustomToken = await admin.auth().createCustomToken(internalUserId, {
          telegramId: devTelegramId,
          role: "admin",
          admin: true
        });
      } catch (e: any) {
        console.warn("Dev custom token generation skipped:", e.message);
      }
    }

    return res.json({
      success: true,
      token,
      firebaseCustomToken,
      user: userProfile
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Dev login xatoligi: " + err.message });
  }
});

// ------------------------------------------
// GET /ai/credits
// ------------------------------------------
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
  } catch (err: any) {
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

// ------------------------------------------
// GET /admin/ai-analytics
// ------------------------------------------
apiRouter.get("/admin/ai-analytics", async (req, res) => {
  try {
    const userId = await authenticateRequestUser(req);
    if (!userId || !(await isUserAdmin(userId, req))) {
      return res.status(403).json({ error: "Faqat administratorlar uchun", code: "FORBIDDEN" });
    }

    const analytics = await getAiAnalytics(dbAdmin);
    return res.json(analytics);
  } catch (err: any) {
    return res.status(500).json({ error: "Analitika xatoligi: " + err.message });
  }
});

// ------------------------------------------
// POST /admin/subscription
// ------------------------------------------
apiRouter.post("/admin/subscription", async (req, res) => {
  try {
    const adminUserId = await authenticateRequestUser(req);
    if (!adminUserId || !(await isUserAdmin(adminUserId, req))) {
      return res.status(403).json({ error: "Faqat administratorlar uchun", code: "FORBIDDEN" });
    }

    const { targetUserId, subscriptionTier, subscriptionStatus } = req.body || {};
    if (!targetUserId || !subscriptionTier) {
      return res.status(400).json({ error: "targetUserId va subscriptionTier talab qilinadi" });
    }

    const validTiers = ["free", "pro", "business"];
    if (!validTiers.includes(subscriptionTier)) {
      return res.status(400).json({ error: "Noto'g'ri subscriptionTier" });
    }

    const newLimit = DEFAULT_TIER_LIMITS[subscriptionTier as keyof typeof DEFAULT_TIER_LIMITS] || 10;
    const nowIso = new Date().toISOString();

    if (dbAdmin) {
      const userRef = dbAdmin.collection("users").doc(targetUserId);
      const snap = await userRef.get();
      if (!snap.exists) {
        return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
      }

      await userRef.update({
        subscriptionTier,
        subscriptionStatus: subscriptionStatus || "active",
        aiCreditsDailyLimit: newLimit,
        aiCreditsRemaining: newLimit,
        aiCreditsUsedToday: 0,
        requestsToday: 0,
        exportsToday: 0,
        updatedAt: nowIso
      });
    }

    return res.json({
      success: true,
      targetUserId,
      subscriptionTier,
      subscriptionStatus: subscriptionStatus || "active",
      dailyLimit: newLimit
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Obunani yangilashda xatolik: " + err.message });
  }
});

// ------------------------------------------
// POST /admin/user-action
// ------------------------------------------
apiRouter.post("/admin/user-action", async (req, res) => {
  try {
    const adminUserId = await authenticateRequestUser(req);
    if (!adminUserId || !(await isUserAdmin(adminUserId, req))) {
      return res.status(403).json({ error: "Faqat administratorlar uchun", code: "FORBIDDEN" });
    }

    const { targetUserId, action, updates } = req.body || {};
    if (!targetUserId || !action) {
      return res.status(400).json({ error: "targetUserId va action talab qilinadi" });
    }

    if (!dbAdmin) {
      return res.status(503).json({ error: "Database admin unavailable" });
    }

    const userRef = dbAdmin.collection("users").doc(targetUserId);
    const snap = await userRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    }

    const nowIso = new Date().toISOString();

    if (action === "block") {
      await userRef.update({ blocked: true, updatedAt: nowIso });
    } else if (action === "unblock") {
      await userRef.update({ blocked: false, updatedAt: nowIso });
    } else if (action === "reset_limits") {
      const userData = snap.data() || {};
      const limit = userData.aiCreditsDailyLimit || 10;
      await userRef.update({
        requestsToday: 0,
        exportsToday: 0,
        aiCreditsUsedToday: 0,
        aiCreditsRemaining: limit,
        updatedAt: nowIso
      });
    } else if (action === "update" && updates) {
      const allowedKeys = ["role", "subscriptionTier", "subscriptionStatus", "displayName", "blocked"];
      const filteredUpdates: Record<string, any> = {};
      for (const key of allowedKeys) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }
      filteredUpdates.updatedAt = nowIso;
      await userRef.update(filteredUpdates);
    } else {
      return res.status(400).json({ error: "Noma'lum action" });
    }

    return res.json({ success: true, targetUserId, action });
  } catch (err: any) {
    return res.status(500).json({ error: "Amalni bajarishda xatolik: " + err.message });
  }
});

// ------------------------------------------
// POST /admin/payment-action
// ------------------------------------------
apiRouter.post("/admin/payment-action", async (req, res) => {
  try {
    const adminUserId = await authenticateRequestUser(req);
    if (!adminUserId || !(await isUserAdmin(adminUserId, req))) {
      return res.status(403).json({ error: "Faqat administratorlar uchun", code: "FORBIDDEN" });
    }

    const { paymentId, action } = req.body || {};
    if (!paymentId || !action) {
      return res.status(400).json({ error: "paymentId va action talab qilinadi" });
    }

    if (!dbAdmin) {
      return res.status(503).json({ error: "Database admin unavailable" });
    }

    const pRef = dbAdmin.collection("paymentRequests").doc(paymentId);
    const pSnap = await pRef.get();
    if (!pSnap.exists) {
      return res.status(404).json({ error: "To'lov so'rovi topilmadi" });
    }

    const payData = pSnap.data() || {};
    const nowIso = new Date().toISOString();

    if (action === "approve") {
      const targetUid = payData.uid || payData.userId;
      const tier: "pro" | "business" = (payData.tier === "business") ? "business" : "pro";
      const amount = Number(payData.amount) || (tier === "business" ? 49.99 : 19.99);

      if (targetUid) {
        await upgradeUserSubscription(targetUid, tier, payData.provider || "manual", amount);
      }

      await pRef.update({
        status: "approved",
        approvedAt: nowIso,
        approvedBy: adminUserId
      });

      return res.json({ success: true, status: "approved" });
    } else if (action === "decline") {
      await pRef.update({
        status: "declined",
        declinedAt: nowIso,
        declinedBy: adminUserId
      });
      return res.json({ success: true, status: "declined" });
    } else {
      return res.status(400).json({ error: "Noma'lum action" });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "To'lov amalida xatolik: " + err.message });
  }
});

// ------------------------------------------
// POST /ai - Centralized Production AI Gateway
// ------------------------------------------
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

  const { contents, systemInstruction, config, model, clientRequestId } = req.body || {};
  if (!contents || (Array.isArray(contents) && contents.length === 0)) {
    return res.status(400).json({
      error: "So'rov matni (contents) kiritilmadi yoki noto'g'ri.",
      code: "INVALID_CONTENTS"
    });
  }

  // Idempotency: Return cached response if this clientRequestId was already completed for this user
  if (clientRequestId && typeof clientRequestId === "string" && dbAdmin) {
    try {
      const existingReq = await dbAdmin.collection("ai_requests").doc(clientRequestId).get();
      if (existingReq.exists) {
        const reqData = existingReq.data() || {};
        if (reqData.userId === userId && reqData.status === "completed" && reqData.response) {
          console.log(`[AI Gateway] Idempotent cache hit for clientRequestId=${clientRequestId}`);
          return res.json(reqData.response);
        }
      }
    } catch (e: any) {
      console.warn("[AI Gateway] ai_requests lookup error:", e.message);
    }
  }

  // Dynamic model discovery with cache
  const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
  const availableModels = apiKey ? await discoverAvailableModels(apiKey) : [];

  const operation: AIOperation = validateOperation(req.body?.operation);
  const targetModel = resolveModel(operation, model, availableModels);
  const creditCost = AI_CREDIT_COSTS[operation] || 1;

  // Safe logging format mandated by prompt:
  // [AI Model] operation=<operation> requested=<safe model> resolved=<safe model>
  // Never log API keys or legal content.
  const safeRequestedModel = model ? String(model).replace(/[^a-zA-Z0-9._-]/g, "") : "default";
  console.log(`[AI Model] operation=${operation} requested=${safeRequestedModel} resolved=${targetModel}`);

  // Requirement 1 logging stages:
  console.log(`[AI Gateway] authenticated uid: ${userId}`);
  console.log(`[AI Gateway] operation: ${operation}`);
  console.log(`[AI Gateway] requested credit cost: ${creditCost}`);

  // Concurrency lock with user scoping, request ownership, and stale TTL recovery (HTTP 409, code CONCURRENT_REQUEST)
  const lock = acquireAIRequestLock(userId);
  if (!lock.acquired) {
    console.log("[AI Gateway] 429_SOURCE=CONCURRENCY_LIMIT");
    console.log("[AI Gateway] final response code: CONCURRENT_REQUEST");
    return res.status(409).json({
      error: "Oldingi AI so‘rovingiz hali yakunlanmoqda. Bir oz kutib, qayta urinib ko‘ring.",
      code: "CONCURRENT_REQUEST"
    });
  }

  const lockRequestId = lock.requestId!;
  let creditsReserved = false;
  let creditsFinalized = false;
  let creditsRefunded = false;
  let reservation: ReservationResult | null = null;
  let creditsBefore = 0;

  const performRefund = async (reason: string) => {
    if (creditsReserved && !creditsFinalized && !creditsRefunded && reservation?.requestId) {
      creditsRefunded = true;
      try {
        await refundAiUsage(dbAdmin, reservation.requestId, userId, creditCost, reason);
        console.log(`[AI Gateway] Atomically refunded ${creditCost} credit(s) to user ${userId}. Final visible credits: ${creditsBefore}`);
      } catch (refundErr: any) {
        console.error("[AI Gateway] Error in refund:", refundErr.message);
      }
    }
  };

  const PROVIDER_TIMEOUT_MS = 75_000; // 75 seconds (between 60-90s)
  const abortController = new AbortController();
  let isTimedOut = false;
  let isClientDisconnected = false;

  const onClientDisconnect = () => {
    if (!res.writableEnded) {
      isClientDisconnected = true;
      console.log("[AI Gateway] client disconnected");
      abortController.abort(new Error("CLIENT_DISCONNECTED"));
    }
  };

  req.on("aborted", onClientDisconnect);
  res.on("close", onClientDisconnect);

  let timeoutTimer: NodeJS.Timeout | null = setTimeout(() => {
    isTimedOut = true;
    console.log("[AI Gateway] provider timeout");
    abortController.abort(new Error("PROVIDER_TIMEOUT"));
  }, PROVIDER_TIMEOUT_MS);

  try {
    // 1. Atomically reserve credits
    reservation = await reserveCredits(dbAdmin, userId, operation, targetModel);

    // If reservation was not allowed:
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

    // Reservation succeeded:
    creditsReserved = true;
    creditsBefore = reservation.creditsRemaining + creditCost;
    const creditsAfter = reservation.creditsRemaining;
    console.log(`[AI Gateway] credits before: ${creditsBefore}`);
    console.log(`[AI Gateway] credits after reservation: ${creditsAfter}`);
    console.log(`[AI Gateway] resolved model: ${targetModel}`);

    // Check if client disconnected while we reserved credits
    if (isClientDisconnected || res.writableEnded) {
      await performRefund("Client disconnected during reservation");
      return;
    }

    // 2. Server-side authoritative GEMINI_API_KEY check
    const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "your_real_key_here") {
      await performRefund("Server GEMINI_API_KEY missing");
      console.log("[AI Gateway] final response code: AI_CONFIGURATION_ERROR");
      return res.status(503).json({
        error: "Serverda Gemini API sozlanmagan (GEMINI_API_KEY mavjud emas). Iltimos, administratorga murojaat qiling.",
        code: "AI_CONFIGURATION_ERROR",
        refunded: true,
        creditsRemaining: creditsBefore
      });
    }

    // 3. Call Gemini API with fallback chain and authoritative timeout via abortController
    console.log("[AI Gateway] provider request start");
    const genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "dastyorchi-ai-gateway"
        }
      }
    });

    const modelChain = getFallbackModelChain(targetModel, operation, availableModels);
    let successfulModel = targetModel;
    let result: any = null;
    let lastModelError: any = null;

    for (let i = 0; i < modelChain.length; i++) {
      const currentModelCandidate = modelChain[i];
      if (isClientDisconnected || isTimedOut || res.writableEnded) break;

      try {
        console.log(`[AI Gateway] Attempting model: ${currentModelCandidate} (try ${i + 1}/${modelChain.length})`);
        
        result = await genAI.models.generateContent({
          model: currentModelCandidate,
          contents,
          config: {
            ...config,
            maxOutputTokens: 8192,
            systemInstruction,
            abortSignal: abortController.signal
          } as any
        });

        successfulModel = currentModelCandidate;
        lastModelError = null;
        break; // Success, exit fallback chain
      } catch (candidateErr: any) {
        lastModelError = candidateErr;
        const isModelUnavail = isModelUnavailableError(candidateErr);

        if (isModelUnavail && i < modelChain.length - 1 && !isClientDisconnected && !isTimedOut) {
          console.log("[AI Model] primary unavailable, attempting fallback");
          console.warn(`[AI Gateway] Model candidate '${currentModelCandidate}' unavailable. Advancing to fallback model...`);
          continue;
        } else {
          // If error is not genuine model availability (e.g. rate limit, quota, auth, timeout) or chain exhausted, rethrow
          throw candidateErr;
        }
      }
    }

    if (!result && lastModelError) {
      throw lastModelError;
    }

    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }

    // Check if client disconnected before we finish
    if (isClientDisconnected || res.writableEnded) {
      console.log("[AI Gateway] Client disconnected before response was finalized");
      await performRefund("Client disconnected before response was sent");
      return;
    }

    const text = result.text;
    if (!text || typeof text !== "string") {
      throw new Error("Provider returned empty response");
    }

    console.log("[AI Gateway] provider response status: 200");
    console.log("[AI Gateway] provider error category: NONE");
    console.log(`[AI Gateway] final response code: SUCCESS (model: ${successfulModel})`);

    // 4. Token accounting from response usageMetadata
    const usageMetadata = (result as any).usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;
    const totalTokens = usageMetadata.totalTokenCount || (inputTokens + outputTokens);

    // 5. Finalize usage in ledger & increment user token counters
    await finalizeAiUsage(dbAdmin, reservation.requestId, userId, {
      inputTokens,
      outputTokens,
      totalTokens
    });
    creditsFinalized = true;

    const responsePayload = {
      text,
      creditsRemaining: reservation.creditsRemaining,
      creditsDailyLimit: reservation.creditsDailyLimit,
      creditsUsedToday: reservation.creditsUsedToday,
      creditCost,
      requestId: reservation.requestId,
      model: successfulModel
    };

    if (clientRequestId && typeof clientRequestId === "string" && dbAdmin) {
      try {
        await dbAdmin.collection("ai_requests").doc(clientRequestId).set({
          clientRequestId,
          userId,
          operation,
          status: "completed",
          response: responsePayload,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (cacheErr: any) {
        console.warn("[AI Gateway] Error caching ai_requests:", cacheErr.message);
      }
    }

    if (!res.writableEnded) {
      return res.json(responsePayload);
    }
  } catch (error: any) {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }

    const errorMessage = typeof error === "object" ? (error.message || JSON.stringify(error)) : String(error);
    const errLower = errorMessage.toLowerCase();

    // Provider status diagnostics
    const providerStatus = error?.status || error?.statusCode || (errLower.includes("resource_exhausted") || errLower.includes("429") ? 429 : 500);
    const providerErrorCode = error?.code || error?.error?.code || (errLower.includes("resource_exhausted") ? "RESOURCE_EXHAUSTED" : undefined);
    const providerErrorType = error?.error?.status || error?.name || "ProviderError";
    const retryAfter = error?.response?.headers?.get?.("retry-after") || error?.retryAfter;

    // Requirements 3 & 8: Atomically refund credits on failure (idempotent, safe)
    await performRefund(errorMessage);

    // Client disconnected handler
    if (isClientDisconnected || error?.message === "CLIENT_DISCONNECTED") {
      console.log("[AI Gateway] Request terminated due to client disconnect, cleanup complete");
      return;
    }

    // Provider timeout handler (HTTP 504)
    if (
      isTimedOut ||
      error?.code === "PROVIDER_TIMEOUT" ||
      error?.message === "PROVIDER_TIMEOUT" ||
      errLower.includes("timeout") ||
      errLower.includes("deadline exceeded")
    ) {
      console.log("[AI Gateway] provider response status: 504");
      console.log("[AI Gateway] provider error category: PROVIDER_TIMEOUT");
      console.log("[AI Gateway] final response code: PROVIDER_TIMEOUT");
      if (!res.writableEnded) {
        return res.status(504).json({
          code: "PROVIDER_TIMEOUT",
          error: "AI javobi belgilangan vaqtda kelmadi. Qayta urinib ko‘ring.",
          refunded: true,
          creditsRemaining: creditsBefore
        });
      }
      return;
    }

    // Requirement 7: Log only safe Gemini provider diagnostics (never GEMINI_API_KEY)
    console.log(`[AI Gateway] provider status: ${providerStatus}`);
    if (providerErrorCode) console.log(`[AI Gateway] provider error code: ${providerErrorCode}`);
    console.log(`[AI Gateway] provider error type: ${providerErrorType}`);
    console.log(`[AI Gateway] model name: ${targetModel}`);
    if (retryAfter) console.log(`[AI Gateway] retry-after: ${retryAfter}`);

    const isQuotaOrRateLimit =
      errLower.includes("429") ||
      errLower.includes("quota") ||
      errLower.includes("resource_exhausted") ||
      providerStatus === 429;

    if (isQuotaOrRateLimit) {
      console.log("[AI Gateway] provider response status: 429");
      console.log("[AI Gateway] provider error category: RESOURCE_EXHAUSTED");
      console.log("[AI Gateway] 429_SOURCE=PROVIDER_RATE_LIMIT");
      console.log("[AI Gateway] final response code: PROVIDER_RATE_LIMIT");
      if (!res.writableEnded) {
        return res.status(429).json({
          code: "PROVIDER_RATE_LIMIT",
          error: "AI provayderining vaqtinchalik limiti tugadi.",
          provider: "gemini",
          refunded: true,
          creditsRemaining: creditsBefore,
          creditsDailyLimit: reservation?.creditsDailyLimit
        });
      }
      return;
    }

    if (
      errLower.includes("api_key_invalid") ||
      errLower.includes("api key not valid") ||
      errLower.includes("api key invalid") ||
      (errLower.includes("401") && (errLower.includes("key") || errLower.includes("credential") || errLower.includes("unauthenticated")))
    ) {
      console.log("[AI Gateway] provider response status: 401");
      console.log("[AI Gateway] provider error category: PROVIDER_AUTH_ERROR");
      console.log("[AI Gateway] final response code: PROVIDER_AUTH_ERROR");
      if (!res.writableEnded) {
        return res.status(500).json({
          code: "PROVIDER_AUTH_ERROR",
          error: "Gemini API provayderi autentifikatsiyasida xatolik yuz berdi (GEMINI_API_KEY xato). Kreditlaringiz qaytarildi.",
          refunded: true,
          creditsRemaining: creditsBefore
        });
      }
      return;
    }

    if (isModelUnavailableError(error)) {
      console.log("[AI Gateway] provider response status: 503");
      console.log("[AI Gateway] provider error category: MODEL_NOT_AVAILABLE");
      console.log("[AI Gateway] final response code: MODEL_NOT_AVAILABLE");
      if (!res.writableEnded) {
        return res.status(503).json({
          code: "MODEL_NOT_AVAILABLE",
          error: "Tanlangan Gemini modeli hozirda mavjud emas yoki qo'llab-quvvatlanmaydi.",
          refunded: true,
          creditsRemaining: creditsBefore
        });
      }
      return;
    }

    if (errLower.includes("413") || errLower.includes("payload") || errLower.includes("body too large")) {
      console.log("[AI Gateway] provider response status: 413");
      console.log("[AI Gateway] provider error category: PAYLOAD_TOO_LARGE");
      console.log("[AI Gateway] final response code: PAYLOAD_TOO_LARGE");
      if (!res.writableEnded) {
        return res.status(413).json({
          code: "PAYLOAD_TOO_LARGE",
          error: "Yuborilgan fayl yoki matn hajmi juda katta. Kreditlaringiz qaytarildi.",
          refunded: true,
          creditsRemaining: creditsBefore
        });
      }
      return;
    }

    if (errLower.includes("context_length_exceeded") || errLower.includes("context overflow")) {
      console.log("[AI Gateway] provider response status: 400");
      console.log("[AI Gateway] provider error category: CONTEXT_OVERFLOW");
      console.log("[AI Gateway] final response code: CONTEXT_OVERFLOW");
      if (!res.writableEnded) {
        return res.status(400).json({
          code: "CONTEXT_OVERFLOW",
          error: "Suhbat tarixi yoki hujjat hajmi model chegarasidan oshib ketdi. Kreditlaringiz qaytarildi.",
          refunded: true,
          creditsRemaining: creditsBefore
        });
      }
      return;
    }

    console.log(`[AI Gateway] provider response status: ${providerStatus}`);
    console.log("[AI Gateway] provider error category: SERVER_ERROR");
    console.log("[AI Gateway] final response code: SERVER_ERROR");
    if (!res.writableEnded) {
      return res.status(500).json({
        code: "SERVER_ERROR",
        error: "AI xizmatida vaqtinchalik nosozlik yuz berdi. Kreditlaringiz hisobingizga qaytarildi. Iltimos, qayta urinib ko'ring.",
        refunded: true,
        creditsRemaining: creditsBefore
      });
    }
  } finally {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
    req.off("aborted", onClientDisconnect);
    res.off("close", onClientDisconnect);
    // Requirement 3 & 4: Lock must ALWAYS be released with ownership in finally
    releaseAIRequestLock(userId, lockRequestId);
  }
});

// ------------------------------------------
// POST /export/check-and-consume
// ------------------------------------------
apiRouter.post("/export/check-and-consume", async (req, res) => {
  try {
    const authInspection = await authenticateRequestDetails(req);
    const userId = authInspection.userId;
    if (!userId) {
      const isExpired = authInspection.sessionFailReason === "expired";
      return res.status(401).json({
        error: isExpired ? "Session expired" : "Authentication required",
        code: isExpired ? "SESSION_EXPIRED" : "AUTH_REQUIRED"
      });
    }

    const todayStr = getTashkentDateString();

    if (!dbAdmin) {
      return res.json({ allowed: true, exportsToday: 1, limit: 3, remaining: 2 });
    }

    const userRef = dbAdmin.collection("users").doc(userId);
    const snap = await userRef.get();

    if (!snap.exists) {
      return res.json({ allowed: true, exportsToday: 1, limit: 3, remaining: 2 });
    }

    const userData = snap.data() || {};
    const tier = (userData.subscriptionTier === "pro" || userData.subscriptionTier === "business")
      ? userData.subscriptionTier
      : "free";

    // Pro and business have unlimited exports
    if (tier === "pro" || tier === "business") {
      return res.json({ allowed: true, tier, unlimited: true, exportsToday: userData.exportsToday || 0 });
    }

    // Free tier: 3 exports per day
    let exportsToday = Number(userData.exportsToday) || 0;
    const lastReset = userData.lastExportResetDate || "";

    if (lastReset !== todayStr) {
      exportsToday = 0;
    }

    const FREE_LIMIT = 3;

    if (exportsToday >= FREE_LIMIT) {
      return res.status(429).json({
        allowed: false,
        error: "Bugungi bepul eksport limitingiz (3 ta) tugadi. Cheksiz eksport qilish uchun Pro tarifiga o'ting.",
        code: "EXPORT_LIMIT_REACHED",
        exportsToday,
        limit: FREE_LIMIT,
        remaining: 0
      });
    }

    const newExports = exportsToday + 1;
    await userRef.update({
      exportsToday: newExports,
      lastExportResetDate: todayStr,
      updatedAt: new Date().toISOString()
    });

    return res.json({
      allowed: true,
      exportsToday: newExports,
      limit: FREE_LIMIT,
      remaining: Math.max(0, FREE_LIMIT - newExports)
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Eksportni tekshirishda xatolik: " + err.message });
  }
});

// ------------------------------------------
// POST /export/docx
// ------------------------------------------
apiRouter.post("/export/docx", async (req, res) => {
  try {
    const authUserId = await authenticateRequestUser(req);
    if (!authUserId) {
      return res.status(401).json({ error: "Avtorizatsiyadan o'tilmagan (Authentication required)", code: "UNAUTHORIZED" });
    }

    const { html } = req.body;
    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "HTML content is required" });
    }

    // Limit HTML length to 500KB to prevent memory exhaustion and buffer overflows
    if (html.length > 500 * 1024) {
      return res.status(400).json({ error: "Hujjat hajmi juda katta (maksimum 500KB ruxsat etilgan)" });
    }

    // Check & atomic increment export quota
    if (dbAdmin) {
      const userRef = dbAdmin.collection("users").doc(authUserId);
      const userSnap = await userRef.get();
      const userData = userSnap.data() || {};
      const tier = (userData.subscriptionTier as "free" | "pro" | "business") || "free";
      const maxExports = tier === "business" ? 100 : tier === "pro" ? 15 : 1;

      const todayStr = new Date().toISOString().slice(0, 10);
      const lastExportDate = userData.lastExportResetDate || "";
      const exportsToday = (lastExportDate === todayStr) ? (userData.exportsToday || 0) : 0;

      if (exportsToday >= maxExports) {
        return res.status(403).json({
          error: `Kunlik hujjat yuklab olish limiti (${maxExports}) tugadi. Tarifingizni oshiring.`,
          code: "QUOTA_EXCEEDED",
          tier,
          maxExports,
          exportsToday
        });
      }

      await userRef.set({
        exportsToday: exportsToday + 1,
        lastExportResetDate: todayStr,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // Server-side HTML sanitization: Strip scripts, iframes, objects, embeds, and event handlers
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "");

    const fileBuffer = await HTMLtoDOCX(cleanHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=\"document.docx\"");
    return res.send(fileBuffer);
  } catch (error: any) {
    console.error("Error generating DOCX:", error);
    return res.status(500).json({ error: "Failed to generate DOCX: " + (error?.message || String(error)) });
  }
});

// ------------------------------------------
// POST /payment/create-invoice
// ------------------------------------------
apiRouter.post("/payment/create-invoice", async (req, res) => {
  try {
    const authUserId = await authenticateRequestUser(req);
    if (!authUserId) {
      return res.status(401).json({ error: "Avtorizatsiyadan o'tilmagan (Authentication required)", code: "UNAUTHORIZED" });
    }

    const { tier, paymentMethod, returnUrl } = req.body;

    if (!tier || !paymentMethod) {
      return res.status(400).json({ error: "To'lov uchun zarur ma'lumotlar yetishmayapti: tier, paymentMethod" });
    }

    if (tier !== "pro" && tier !== "business") {
      return res.status(400).json({ error: "Noto'g'ri tarif tanlangan (faqat 'pro' yoki 'business')" });
    }

    if (paymentMethod !== "payme" && paymentMethod !== "click") {
      return res.status(400).json({ error: "Noto'g'ri to'lov tizimi (faqat 'payme' yoki 'click')" });
    }

    const amountUZS = tier === "pro" ? 250000 : 630000;
    const amountTiyins = amountUZS * 100;

    // Validate returnUrl against allowed origins to prevent open redirect
    let finalReturnUrl = "https://dastyorchi.uz/profile";
    if (returnUrl && typeof returnUrl === "string") {
      try {
        const parsed = new URL(returnUrl, "https://dastyorchi.uz");
        const allowedHosts = ["dastyorchi.uz", "localhost", "127.0.0.1", "web.telegram.org"];
        if (allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h))) {
          finalReturnUrl = returnUrl;
        }
      } catch (e) {
        // Fallback to safe default
      }
    }

    // Create server-authoritative pending payment order record
    const orderId = `order_${authUserId}_${Date.now()}`;
    if (dbAdmin) {
      await dbAdmin.collection("payment_orders").doc(orderId).set({
        orderId,
        userId: authUserId,
        tier,
        amount: amountUZS,
        paymentMethod,
        status: "pending",
        createdAt: new Date().toISOString(),
        returnUrl: finalReturnUrl
      });
    }

    let checkoutUrl = "";

    if (paymentMethod === "payme") {
      const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID;
      if (!PAYME_MERCHANT_ID) {
        return res.status(503).json({ error: "Payme to'lov tizimi sozlanmagan (PAYME_MERCHANT_ID yetishmaydi)." });
      }
      const rawString = `m=${PAYME_MERCHANT_ID};ac.orderId=${orderId};ac.userId=${authUserId};a=${amountTiyins}`;
      const base64Params = Buffer.from(rawString).toString("base64");
      checkoutUrl = `https://checkout.payme.uz/${base64Params}`;
    } else if (paymentMethod === "click") {
      const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
      const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
      if (!CLICK_SERVICE_ID || !CLICK_MERCHANT_ID) {
        return res.status(503).json({ error: "Click to'lov tizimi sozlanmagan (CLICK_SERVICE_ID yoki CLICK_MERCHANT_ID yetishmaydi)." });
      }
      checkoutUrl = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${amountUZS}&transaction_param=${orderId}&return_url=${encodeURIComponent(finalReturnUrl)}`;
    }

    console.log(`[Payment] Authoritative invoice built for user: ${authUserId}, Tier: ${tier}, Method: ${paymentMethod}, OrderId: ${orderId}`);
    return res.json({ checkoutUrl, orderId });
  } catch (err: any) {
    console.error("Failed to construct invoice:", err);
    return res.status(500).json({ error: err.message || "To'lov hisobini shakllantirishda xatolik yuz berdi" });
  }
});

// ------------------------------------------
// POST /payment/click-webhook
// ------------------------------------------
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

    // Idempotency: Check if this click_trans_id has already been completed
    if (dbAdmin && click_trans_id) {
      const existingTxn = await dbAdmin.collection("clickTransactions").doc(String(click_trans_id)).get();
      if (existingTxn.exists && existingTxn.data()?.status === "completed") {
        return res.json({
          click_trans_id,
          merchant_trans_id,
          merchant_confirm_id: `conf_${click_trans_id}`,
          error: 0,
          error_note: "Already processed"
        });
      }
    }

    // Resolve userId and tier: merchant_trans_id could be an orderId or direct userId
    let resolvedUserId = merchant_trans_id;
    let resolvedTier: "pro" | "business" = Number(amount) >= 600000 ? "business" : "pro";

    if (dbAdmin && merchant_trans_id) {
      // Check if merchant_trans_id is an order in payment_orders
      const orderDoc = await dbAdmin.collection("payment_orders").doc(merchant_trans_id).get();
      if (orderDoc.exists) {
        const orderData = orderDoc.data() || {};
        resolvedUserId = orderData.userId || resolvedUserId;
        if (orderData.tier === "business" || orderData.tier === "pro") {
          resolvedTier = orderData.tier;
        }
      }

      const userSnap = await dbAdmin.collection("users").doc(resolvedUserId).get();
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

      await upgradeUserSubscription(resolvedUserId, resolvedTier, "click", paymentAmount);

      // Record transaction idempotently in clickTransactions
      if (dbAdmin && click_trans_id) {
        await dbAdmin.collection("clickTransactions").doc(String(click_trans_id)).set({
          click_trans_id,
          merchant_trans_id,
          userId: resolvedUserId,
          amount: paymentAmount,
          tier: resolvedTier,
          status: "completed",
          completedAt: new Date().toISOString()
        }, { merge: true });

        // Also update order status if orderId was used
        if (merchant_trans_id.startsWith("order_")) {
          await dbAdmin.collection("payment_orders").doc(merchant_trans_id).set({
            status: "completed",
            click_trans_id,
            completedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      return res.json({
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: `conf_${click_trans_id}`,
        error: 0,
        error_note: "To'lov muvaffaqiyatli qabul qilindi hamda obuna faollashtirildi!"
      });
    }

    return res.json({ error: -3, error_note: "Invalid interaction action requested" });
  } catch (err: any) {
    console.error("Click webhook error:", err);
    return res.status(550).json({ error: -4, error_note: err.message || "Internal server crash" });
  }
});

// ------------------------------------------
// POST /payment/payme-webhook
// ------------------------------------------
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
        const tier: "pro" | "business" = uAmountUZS >= 600000 ? "business" : "pro";

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
  } catch (error: any) {
    console.error("Payme Webhook crash:", error);
    return res.status(500).json({
      jsonrpc: "2.0",
      error: { code: -32603, message: error.message || "Internal server crash" },
      id: req.body?.id || null
    });
  }
});

// Mount the apiRouter at both "/api" and "/" for versatile routing compatibility
app.use("/api", apiRouter);
app.use(apiRouter);

// Express API error handler middleware
app.use((err: any, req: any, res: any, next: any) => {
  if (err) {
    console.error("Express API error caught:", err);
    return res.status(err.status || err.statusCode || 500).json({ 
      error: err.message || "Server Error",
      code: err.code || "SERVER_ERROR"
    });
  }
  next();
});

export { dbAdmin, firebaseInitStatus };
export default app;

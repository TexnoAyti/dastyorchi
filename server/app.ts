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
  resolveModel,
  validateOperation,
  acquireUserLock,
  releaseUserLock,
  reserveCredits,
  finalizeAiUsage,
  refundAiUsage,
  getUserCreditStatus,
  getAiAnalytics,
  ReservationResult
} from "./aiGateway";

dotenv.config();

// ==========================================
// 1. FIREBASE ADMIN PRODUCTION INITIALIZATION
// ==========================================
let dbAdmin: FirebaseFirestore.Firestore | null = null;
let firebaseInitStatus = "not_initialized";

try {
  let adminApp: admin.app.App | null = null;

  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    firebaseInitStatus = "reused_existing_app";
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      // Handle base64 encoded JSON string if provided
      if (!rawKey.startsWith("{") && !rawKey.startsWith('"')) {
        try {
          const decoded = Buffer.from(rawKey, "base64").toString("utf-8");
          if (decoded.startsWith("{")) {
            rawKey = decoded;
          }
        } catch (e) {}
      }

      const serviceAccount = JSON.parse(rawKey);
      if (serviceAccount.private_key) {
        // Handle escaped newlines in private key string
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }

      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
      });
      firebaseInitStatus = "service_account_cert";
      console.log("[FirebaseAdmin] Successfully initialized with FIREBASE_SERVICE_ACCOUNT_KEY");
    } catch (parseErr: any) {
      console.error("[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", parseErr.message);
    }
  }

  // Fallback if service account key is not provided (e.g. local environment or AI Studio Cloud Run)
  if (!adminApp && admin.apps.length === 0) {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    let projectId = process.env.FIREBASE_PROJECT_ID;

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        projectId = projectId || config.projectId;
      } catch (e) {}
    }

    if (projectId) {
      try {
        adminApp = admin.initializeApp({ projectId });
        firebaseInitStatus = "project_id_fallback";
        console.log(`[FirebaseAdmin] Initialized fallback with projectId: ${projectId}`);
      } catch (e: any) {
        console.warn("[FirebaseAdmin] Fallback init warning:", e.message);
      }
    }
  }

  // Connect Firestore instance
  if (admin.apps.length > 0) {
    const currentApp = admin.apps[0]!;
    let databaseId = process.env.FIRESTORE_DATABASE_ID;

    if (!databaseId) {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        try {
          const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
          databaseId = cfg.firestoreDatabaseId;
        } catch (e) {}
      }
    }

    if (databaseId && databaseId !== "(default)") {
      dbAdmin = getFirestore(currentApp, databaseId);
    } else {
      dbAdmin = getFirestore(currentApp);
    }
    console.log("[FirebaseAdmin] Firestore ready. Target database:", databaseId || "(default)");
  }
} catch (err: any) {
  console.error("[FirebaseAdmin] Initialization fatal error:", err.message);
  firebaseInitStatus = "error: " + err.message;
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

  if (admin.apps.length > 0) {
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
    runtime: "vercel"
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
    if (admin.apps.length > 0) {
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
    if (admin.apps.length > 0) {
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
    return res.json(status);
  } catch (err: any) {
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
      isAdmin = true; // Dev fallback
    }

    if (!isAdmin) {
      return res.status(403).json({ error: "Faqat administratorlar uchun", code: "FORBIDDEN" });
    }

    const analytics = await getAiAnalytics(dbAdmin);
    return res.json(analytics);
  } catch (err: any) {
    return res.status(500).json({ error: "Analitika xatoligi: " + err.message });
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

  // Check concurrency lock
  if (!acquireUserLock(userId)) {
    return res.status(429).json({
      error: "Oldingi so'rovingiz hali bajarilmoqda. Iltimos, uning yakunlanishini kuting.",
      code: "CONCURRENT_REQUEST"
    });
  }

  const { contents, systemInstruction, config, model } = req.body || {};
  const operation: AIOperation = validateOperation(req.body?.operation);
  const targetModel = resolveModel(operation, model);
  const creditCost = AI_CREDIT_COSTS[operation] || 1;

  let reservation: ReservationResult | null = null;

  try {
    // 1. Atomically reserve credits via Firestore transaction (or memory fallback)
    reservation = await reserveCredits(dbAdmin, userId, operation, targetModel);
    if (!reservation.allowed) {
      return res.status(429).json({
        error: reservation.error || "Bugungi bepul AI limitingiz tugadi. AI kreditlaringiz ertaga yangilanadi.",
        code: reservation.code || "AI_CREDIT_LIMIT",
        creditsRemaining: reservation.creditsRemaining,
        creditsDailyLimit: reservation.creditsDailyLimit,
        resetDate: reservation.resetDate
      });
    }

    // 2. Server-side authoritative GEMINI_API_KEY check
    const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "your_real_key_here") {
      await refundAiUsage(dbAdmin, reservation.requestId, userId, creditCost, "Server GEMINI_API_KEY missing");
      return res.status(503).json({
        error: "Serverda Gemini API sozlanmagan (GEMINI_API_KEY mavjud emas). Iltimos, administratorga murojaat qiling.",
        code: "AI_CONFIGURATION_ERROR",
        refunded: true
      });
    }

    // 3. Call Gemini API
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

    return res.json({
      text,
      creditsRemaining: reservation.creditsRemaining,
      creditsDailyLimit: reservation.creditsDailyLimit,
      creditsUsedToday: reservation.creditsUsedToday,
      creditCost,
      requestId: reservation.requestId,
      model: targetModel
    });
  } catch (error: any) {
    console.error(`[AI Gateway] Error processing request for user ${userId}:`, error.message || error);

    // Idempotent refund on failure
    if (reservation && reservation.allowed) {
      try {
        await refundAiUsage(dbAdmin, reservation.requestId, userId, creditCost, error.message || String(error));
      } catch (refundErr: any) {
        console.error("[AI Gateway] Error in refund:", refundErr.message);
      }
    }

    const errorMessage = typeof error === "object" ? (error.message || JSON.stringify(error)) : String(error);
    const errLower = errorMessage.toLowerCase();

    let status = 500;
    let errorCode = "SERVER_ERROR";
    let friendlyMessage = "AI xizmatida vaqtinchalik nosozlik yuz berdi. Kreditlaringiz hisobingizga qaytarildi. Iltimos, qayta urinib ko'ring.";

    if (
      errLower.includes("api_key_invalid") ||
      errLower.includes("api key not valid") ||
      errLower.includes("api key invalid") ||
      (errLower.includes("401") && (errLower.includes("key") || errLower.includes("credential") || errLower.includes("unauthenticated")))
    ) {
      status = 500;
      errorCode = "PROVIDER_AUTH_ERROR";
      friendlyMessage = "Gemini API provayderi autentifikatsiyasida xatolik yuz berdi (GEMINI_API_KEY xato). Kreditlaringiz qaytarildi.";
    } else if (
      errLower.includes("not found") ||
      errLower.includes("is not found for api version") ||
      errLower.includes("models/") ||
      (errLower.includes("model") && (errLower.includes("not supported") || errLower.includes("unavailable") || errLower.includes("not found")))
    ) {
      status = 503;
      errorCode = "MODEL_NOT_AVAILABLE";
      friendlyMessage = "Configured Gemini model is unavailable.";
    } else if (errLower.includes("429") || errLower.includes("quota") || errLower.includes("resource_exhausted")) {
      status = 429;
      errorCode = "PROVIDER_RATE_LIMIT";
      friendlyMessage = "Google AI serverlarida vaqtinchalik yuqori yuklama (Rate Limit). Kreditlaringiz qaytarildi, iltimos birozdan so'ng qayta urinib ko'ring.";
    } else if (errLower.includes("413") || errLower.includes("payload") || errLower.includes("body too large")) {
      status = 413;
      errorCode = "PAYLOAD_TOO_LARGE";
      friendlyMessage = "Yuborilgan fayl yoki matn hajmi juda katta. Kreditlaringiz qaytarildi.";
    } else if (errLower.includes("context_length_exceeded") || errLower.includes("context overflow")) {
      status = 400;
      errorCode = "CONTEXT_OVERFLOW";
      friendlyMessage = "Suhbat tarixi yoki hujjat hajmi model chegarasidan oshib ketdi. Kreditlaringiz qaytarildi.";
    } else if (errLower.includes("firestore") || errLower.includes("database")) {
      status = 500;
      errorCode = "FIRESTORE_ERROR";
      friendlyMessage = "Ma'lumotlar bazasi bilan aloqada xatolik yuz berdi. Kreditlaringiz qaytarildi.";
    }

    return res.status(status).json({
      error: friendlyMessage,
      code: errorCode,
      refunded: true,
      creditsRemaining: reservation ? (reservation.creditsRemaining + creditCost) : undefined,
      creditsDailyLimit: reservation?.creditsDailyLimit
    });
  } finally {
    releaseUserLock(userId);
  }
});

// ------------------------------------------
// POST /export/docx
// ------------------------------------------
apiRouter.post("/export/docx", async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) {
      return res.status(400).json({ error: "HTML content is required" });
    }

    const fileBuffer = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=\"document.docx\"");
    return res.send(fileBuffer);
  } catch (error) {
    console.error("Error generating DOCX:", error);
    return res.status(500).json({ error: "Failed to generate DOCX" });
  }
});

// ------------------------------------------
// POST /payment/create-invoice
// ------------------------------------------
apiRouter.post("/payment/create-invoice", async (req, res) => {
  try {
    const { userId, tier, paymentMethod, returnUrl } = req.body;

    if (!userId || !tier || !paymentMethod) {
      return res.status(400).json({ error: "To'lov uchun zarur ma'lumotlar yetishmayapti: userId, tier, paymentMethod" });
    }

    const amountUZS = tier === "pro" ? 250000 : 630000;
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
      const tier: "pro" | "business" = paymentAmount >= 600000 ? "business" : "pro";

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

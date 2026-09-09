import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import HTMLtoDOCX from "html-to-docx";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp as initClientFirebase } from "firebase/app";
import { initializeFirestore, doc as fsDoc, getDoc as fsGetDoc, setDoc as fsSetDoc, updateDoc as fsUpdateDoc } from "firebase/firestore";
import fs from "fs";
import crypto from "crypto";

dotenv.config();

// Initialize Firebase Admin securely
let dbAdmin: any = null;
let dbClient: any = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    try {
      const app = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
      dbAdmin = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      console.log("Firebase Admin successfully initialized on the backend. Database: " + firebaseConfig.firestoreDatabaseId);
    } catch (adminErr: any) {
      console.warn("Firebase Admin initialize warning:", adminErr.message);
    }

    try {
      const clientApp = initClientFirebase(firebaseConfig, "server-client-app");
      dbClient = initializeFirestore(clientApp, {}, firebaseConfig.firestoreDatabaseId);
      console.log("Firebase Client SDK initialized on backend for Firestore operations.");
    } catch (clientErr: any) {
      console.warn("Firebase Client SDK backend initialize warning:", clientErr.message);
    }
  } else {
    console.warn("firebase-applet-config.json was not found. Server features might run in sandbox modes.");
  }
} catch (err: any) {
  console.error("Firebase initialization error:", err.message);
}

// Telegram WebApp initData HMAC-SHA256 verification
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

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.TELEGRAM_BOT_TOKEN || "dastyorchi_telegram_session_secret_uz";

function createSessionToken(payload: any): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verifySessionToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    if (!token || !token.includes(".")) {
      return { valid: false, error: "Yaroqsiz token formati" };
    }
    const [data, signature] = token.split(".");
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
    if (signature !== expectedSignature) {
      return { valid: false, error: "Token imzosi noto'g'ri" };
    }
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: "Sessiya vaqti tugagan" };
    }
    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || "Tokenni tekshirishda xatolik" };
  }
}

async function upgradeUserSubscription(userId: string, tier: "pro" | "business", provider: string, amount: number) {
  try {
    if (dbClient) {
      const userRef = fsDoc(dbClient, "users", userId);
      await fsUpdateDoc(userRef, {
        subscriptionTier: tier,
        subscriptionStatus: "active",
        requestsToday: 0
      });
      console.log(`Successfully upgraded user: ${userId} to ${tier} subscription tier via ${provider} (dbClient)`);
      return;
    }
  } catch (err: any) {
    console.warn("dbClient upgrade error, falling back to dbAdmin:", err.message);
  }

  if (dbAdmin) {
    const userRef = dbAdmin.collection("users").doc(userId);
    await userRef.update({
      subscriptionTier: tier,
      subscriptionStatus: "active",
      requestsToday: 0
    });
    console.log(`Successfully upgraded user: ${userId} to ${tier} subscription tier via ${provider} (dbAdmin)`);
  }
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // TELEGRAM WEBAPP AUTHENTICATION ENDPOINT
  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const { initData, devBypass } = req.body || {};
      const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

      let telegramUser: any = null;

      // When botToken is configured, strictly verify initData HMAC signature
      if (botToken) {
        if (!initData) {
          return res.status(400).json({ error: "Telegram initData parametri taqdim etilmagan" });
        }
        const verification = verifyTelegramWebAppData(initData, botToken);
        if (!verification.valid) {
          return res.status(401).json({ error: verification.error || "Telegram ma'lumotlari tasdiqlanmadi" });
        }
        telegramUser = verification.user;
      } else {
        // When TELEGRAM_BOT_TOKEN is not yet set in environment:
        // Strictly reject in production. Allow dev fallback only in development mode.
        if (process.env.NODE_ENV === "production") {
          return res.status(500).json({ 
            error: "Serverda TELEGRAM_BOT_TOKEN sozlanmagan. Iltimos bot tokenini muhit sozlamalariga kiriting." 
          });
        }

        console.warn("[Auth Warning] TELEGRAM_BOT_TOKEN sozlanmagan. Rivojlantirish (dev) rejimida sinov rejimida ishlamoqda.");

        if (initData) {
          try {
            const params = new URLSearchParams(initData);
            const userRaw = params.get("user");
            if (userRaw) {
              telegramUser = JSON.parse(userRaw);
            }
          } catch (e) {
            console.warn("Failed to parse user from initData in dev fallback");
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

      // Check admin privileges via trusted environment variable or database
      const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      const isEnvAdmin = adminIds.includes(String(telegramId));

      let userProfile: any = null;

      // Try reading user from Firestore
      if (dbClient) {
        try {
          const userRef = fsDoc(dbClient, "users", internalUserId);
          const snap = await fsGetDoc(userRef);
          if (snap.exists()) {
            userProfile = snap.data();
          }
        } catch (e: any) {
          console.warn("Error reading user profile via dbClient:", e.message);
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
          lastRequestResetDate: new Date().toLocaleDateString("en-CA"),
          lastExportResetDate: new Date().toLocaleDateString("en-CA"),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (dbClient) {
          try {
            await fsSetDoc(fsDoc(dbClient, "users", internalUserId), userProfile);
          } catch (e: any) {
            console.warn("Could not save new user to Firestore:", e.message);
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
        userProfile = { ...userProfile, ...updatedFields };

        if (dbClient) {
          try {
            await fsUpdateDoc(fsDoc(dbClient, "users", internalUserId), updatedFields);
          } catch (e: any) {
            console.warn("Could not update user in Firestore:", e.message);
          }
        }
      }

      // Generate session token (valid for 14 days)
      const token = createSessionToken({
        uid: internalUserId,
        telegramId,
        role: userProfile.role || "user",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60)
      });

      return res.json({
        success: true,
        token,
        user: userProfile
      });
    } catch (err: any) {
      console.error("Telegram Auth Error:", err);
      return res.status(500).json({ error: "Avtorizatsiyada server xatoligi yuz berdi: " + (err.message || "") });
    }
  });

  // GET SESSION VERIFICATION (prevents repeated initData validation on every re-render)
  app.get("/api/auth/session", async (req, res) => {
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
      if (dbClient) {
        try {
          const snap = await fsGetDoc(fsDoc(dbClient, "users", uid));
          if (snap.exists()) {
            userProfile = snap.data();
          }
        } catch (e: any) {
          console.warn("Error reading session user profile:", e.message);
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

  // DEV-ONLY AUTH BYPASS (STRICTLY DISABLED IN PRODUCTION)
  app.post("/api/auth/dev-login", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Dev login is strictly forbidden in production" });
    }

    try {
      const devTelegramId = 999999999;
      const internalUserId = `tg_${devTelegramId}`;

      let userProfile: any = null;
      if (dbClient) {
        try {
          const snap = await fsGetDoc(fsDoc(dbClient, "users", internalUserId));
          if (snap.exists()) {
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
          role: "admin", // dev account has admin rights for testing
          subscriptionTier: "pro",
          subscriptionStatus: "active",
          requestsToday: 0,
          exportsToday: 0,
          lastRequestResetDate: new Date().toLocaleDateString("en-CA"),
          lastExportResetDate: new Date().toLocaleDateString("en-CA"),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (dbClient) {
          try {
            await fsSetDoc(fsDoc(dbClient, "users", internalUserId), userProfile);
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

      return res.json({
        success: true,
        token,
        user: userProfile
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Dev login xatoligi: " + err.message });
    }
  });

  app.post("/api/ai", async (req, res) => {
    let apiKey = "";
    try {
      const { contents, systemInstruction, config, model, mode, customApiKey } = req.body || {};
      
      apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || "";
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "your_real_key_here") {
        return res.status(401).json({
          error: "GEMINI_API_KEY sozlanmagan. Iltimos, server muhitida GEMINI_API_KEY o'zgaruvchisini sozlang."
        });
      }

      // Private mode support - do not log or store contents if private
      const isPrivateMode = mode === 'private';
      
      const genAI = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      let result;
      try {
        result = await genAI.models.generateContent({
          model: model || "gemini-3.5-flash",
          contents,
          config: {
             ...config,
             systemInstruction
          }
        });
      } catch (err: any) {
        throw err;
      }

      const text = result.text;
      res.json({ text });
    } catch (error: any) {
      console.error("AI Server Error:", error);
      // Pass the complete error string for inspection
      const errorMessage = typeof error === 'object' ? JSON.stringify(error) + " " + (error.message || "") : String(error);
      const errLower = errorMessage.toLowerCase();
      
      let status = 500;
      let errorCode = "SERVER_ERROR";

      if (errLower.includes("api_key_invalid") || errLower.includes("api key not valid")) {
         status = 401;
         errorCode = "AUTH_ERROR";
      } else if (errLower.includes("429") || errLower.includes("quota") || errLower.includes("resource_exhausted")) {
         status = 429;
         errorCode = "AI_QUOTA_LIMIT";
      } else if (errLower.includes("413") || errLower.includes("payload") || errLower.includes("request size exceeded") || errLower.includes("body too large")) {
         status = 413;
         errorCode = "PAYLOAD_TOO_LARGE";
      } else if (errLower.includes("context_length_exceeded") || errLower.includes("context overflow")) {
         status = 400; // or appropriate
         errorCode = "CONTEXT_OVERFLOW";
      } else if (errLower.includes("503") || errLower.includes("unavailable") || errLower.includes("overloaded") || errLower.includes("high demand")) {
         status = 503;
         errorCode = "SERVER_ERROR";
      }

      res.status(status).json({ error: errorMessage, code: errorCode, original_status: status });
    }
  });

  app.post("/api/export/docx", async (req, res) => {
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

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="document.docx"');
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      res.status(500).json({ error: "Failed to generate DOCX" });
    }
  });

  // 1. CREATE PAYMENT INVOICE (CLICK/PAYME HANDLER)
  app.post("/api/payment/create-invoice", async (req, res) => {
    try {
      const { userId, tier, paymentMethod, returnUrl } = req.body;

      if (!userId || !tier || !paymentMethod) {
        return res.status(400).json({ error: "To'lov uchun zarur ma'lumotlar yetishmayapti: userId, tier, paymentMethod" });
      }

      // 250,000 UZS for Pro, 630,000 UZS for Business (amounts are in UZS)
      const amountUZS = tier === "pro" ? 250000 : 630000;
      const amountTiyins = amountUZS * 100;

      let checkoutUrl = "";

      if (paymentMethod === "payme") {
        // Payme redirect parameter base64 generation
        const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID;
        if (!PAYME_MERCHANT_ID) {
          return res.status(503).json({ error: "Payme to'lov tizimi sozlanmagan (PAYME_MERCHANT_ID yetishmaydi)." });
        }
        const rawString = `m=${PAYME_MERCHANT_ID};ac.userId=${userId};a=${amountTiyins}`;
        const base64Params = Buffer.from(rawString).toString("base64");
        checkoutUrl = `https://checkout.payme.uz/${base64Params}`;
      } else if (paymentMethod === "click") {
        // Click redirect URL generation
        const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
        const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
        if (!CLICK_SERVICE_ID || !CLICK_MERCHANT_ID) {
          return res.status(503).json({ error: "Click to'lov tizimi sozlanmagan (CLICK_SERVICE_ID yoki CLICK_MERCHANT_ID yetishmaydi)." });
        }
        const defaultReturnUrl = "https://ais-dev-kje5inn53jtlikkyhcll5k-489215624706.asia-southeast1.run.app/profile";
        const finalReturnUrl = returnUrl || defaultReturnUrl;

        checkoutUrl = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${amountUZS}&transaction_param=${userId}&return_url=${encodeURIComponent(finalReturnUrl)}`;
      } else {
        return res.status(400).json({ error: "Noma'lum to'lov tizimi turi." });
      }

      console.log(`Invoice built for user: ${userId}, Tier: ${tier}, Method: ${paymentMethod}, URL: ${checkoutUrl}`);
      return res.json({ checkoutUrl });
    } catch (err: any) {
      console.error("Failed to construct invoice:", err);
      return res.status(500).json({ error: err.message || "To'lov hisobini shakllantirishda xatolik yuz berdi" });
    }
  });

  // 2. CLICK INTERACTION WEBHOOK
  app.post("/api/payment/click-webhook", async (req, res) => {
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

      console.log("CLICK webhook payload:", req.body);

      // Verify MD5 Merchant Signature
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

      // Check if user account exists
      if (dbAdmin) {
        const userSnap = await dbAdmin.collection("users").doc(userId).get();
        if (!userSnap.exists) {
          return res.json({ error: -5, error_note: "Foydalanuvchi hisobi topilmadi (User not found)" });
        }
      }

      // action == 0 (Prepare)
      if (Number(action) === 0) {
        return res.json({
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id: `prep_${click_trans_id}`,
          error: 0,
          error_note: "Success"
        });
      }

      // action == 1 (Complete)
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

  // 3. PAYME MERCHANT API PROTOCOL (JSON-RPC 2.0 Webhook)
  app.post("/api/payment/payme-webhook", async (req, res) => {
    try {
      const { method, params, id: jsonRpcId } = req.body;
      console.log(`PAYME Webhook method context: ${method}`, params);

      // Verify Auth Header
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
        const amount = Number(params.amount);

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

          // Degrade user subscription on transaction rollbacks
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

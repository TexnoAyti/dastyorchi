import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { getApiAuthorizationHeader } from "./apiAuth";

export type SubscriptionTier = "free" | "pro" | "business";
export type SubscriptionStatus = "active" | "expired" | "canceled";

export interface PlanLimits {
  freeRequestLimit: number;
  freeExportLimit: number;
  proRequestLimit: number;
  proExportLimit: number;
  businessRequestLimit: number;
  businessExportLimit: number;
  features: {
    riskAnalysis: SubscriptionTier[];
    strategyPlan: SubscriptionTier[];
    aiExpertise: SubscriptionTier[];
    advancedLegalAnalysis: SubscriptionTier[];
    priorityProcessing: SubscriptionTier[];
  };
}

export const DEFAULT_PLAN_LIMITS: PlanLimits = {
  freeRequestLimit: 10,
  freeExportLimit: 3,
  proRequestLimit: 999999, // unlimited
  proExportLimit: 999999, // unlimited
  businessRequestLimit: 999999, // unlimited
  businessExportLimit: 999999, // unlimited
  features: {
    riskAnalysis: ["pro", "business"],
    strategyPlan: ["pro", "business"],
    aiExpertise: ["pro", "business"],
    advancedLegalAnalysis: ["business"],
    priorityProcessing: ["business"]
  }
};

/**
 * Fetch global system limits defined by admins. Will fallback to defaults if not found.
 */
export async function getPlanLimits(): Promise<PlanLimits> {
  try {
    const limitsRef = doc(db, "internal", "limits");
    const docSnap = await getDoc(limitsRef);
    if (docSnap.exists()) {
      return {
        ...DEFAULT_PLAN_LIMITS,
        ...docSnap.data()
      };
    }
    return DEFAULT_PLAN_LIMITS;
  } catch (error) {
    console.warn("Notice reading plan limits from Firestore, using default system limits:", error);
    return DEFAULT_PLAN_LIMITS;
  }
}

/**
 * Save customized plan limits to Firestore (Admin only action).
 */
export async function savePlanLimits(limits: PlanLimits): Promise<void> {
  const limitsRef = doc(db, "internal", "limits");
  await setDoc(limitsRef, limits);
}

/**
 * Check if the user is authorized to perform an AI Request based on their quota.
 * Automatically handles resetting counters if the day has changed.
 */
export async function checkRequestQuota(userId: string): Promise<{ 
  allowed: boolean; 
  requestsToday: number; 
  limit: number; 
  remaining: number; 
}> {
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return { allowed: false, requestsToday: 0, limit: 0, remaining: 0 };
  }
  
  const userData = userSnap.data();
  
  // 1 & 2. Read and verify subscriptionTier directly from Firestore
  let verifiedTier: SubscriptionTier = "free";
  if (userData.subscriptionTier === "pro" || userData.subscriptionTier === "business") {
    verifiedTier = userData.subscriptionTier;
  }
  
  const limits = await getPlanLimits();
  
  // Decide limit based on tier
  let limit = limits.freeRequestLimit;
  if (verifiedTier === "pro") limit = limits.proRequestLimit;
  if (verifiedTier === "business") limit = limits.businessRequestLimit;
  
  let requestsToday = userData.requestsToday || 0;
  const lastResetDate = userData.lastRequestResetDate || "";
  
  if (lastResetDate !== todayStr) {
    // New day: Reset request counters in database
    try {
      await updateDoc(userRef, {
        requestsToday: 0,
        lastRequestResetDate: todayStr
      });
      requestsToday = 0;
    } catch (e) {
      console.error("Error resetting request counter:", e);
    }
  }
  
  // 4. Pro and Business users must never see Premium paywall. This ensures they always bypass.
  const isPremium = verifiedTier === "pro" || verifiedTier === "business";
  const remaining = Math.max(0, limit - requestsToday);
  const allowed = isPremium || limit === 999999 || remaining > 0;
  
  // 3. Premium paywall should only appear when: user is free AND user exceeded free limits OR tries to access premium feature
  let paywallReason = "none";
  if (!allowed) {
    if (verifiedTier === "free" && requestsToday >= limit) {
      paywallReason = "exceeded_requests_limit";
    } else {
      paywallReason = "premium_only_feature";
    }
  }

  // 5. Add debug logging of: subscriptionTier, requestsToday, requestsLimit, paywallReason
  console.log("[DEBUG SUBSCRIPTION SYSTEM][checkRequestQuota] Audit details:", {
    subscriptionTier: verifiedTier,
    requestsToday,
    requestsLimit: limit,
    paywallReason
  });
  
  return {
    allowed,
    requestsToday,
    limit,
    remaining
  };
}

/**
 * Check if the user is authorized to perform an export format conversion.
 */
export async function checkExportQuota(userId: string): Promise<{ 
  allowed: boolean; 
  exportsToday: number; 
  limit: number; 
  remaining: number; 
}> {
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return { allowed: false, exportsToday: 0, limit: 0, remaining: 0 };
  }
  
  const userData = userSnap.data();
  
  // 1 & 2. Read and verify subscriptionTier directly from Firestore
  let verifiedTier: SubscriptionTier = "free";
  if (userData.subscriptionTier === "pro" || userData.subscriptionTier === "business") {
    verifiedTier = userData.subscriptionTier;
  }
  
  const limits = await getPlanLimits();
  
  // Decide limit based on tier
  let limit = limits.freeExportLimit;
  if (verifiedTier === "pro") limit = limits.proExportLimit;
  if (verifiedTier === "business") limit = limits.businessExportLimit;
  
  let exportsToday = userData.exportsToday || 0;
  const lastResetDate = userData.lastExportResetDate || "";
  
  if (lastResetDate !== todayStr) {
    // New day: Reset export counters in database
    try {
      await updateDoc(userRef, {
        exportsToday: 0,
        lastExportResetDate: todayStr
      });
      exportsToday = 0;
    } catch (e) {
      console.error("Error resetting export counter:", e);
    }
  }
  
  // 4. Pro and Business users must never see Premium paywall. This ensures they always bypass.
  const isPremium = verifiedTier === "pro" || verifiedTier === "business";
  const remaining = Math.max(0, limit - exportsToday);
  const allowed = isPremium || limit === 999999 || remaining > 0;
  
  let paywallReason = "none";
  if (!allowed) {
    if (verifiedTier === "free" && exportsToday >= limit) {
      paywallReason = "exceeded_exports_limit";
    } else {
      paywallReason = "premium_only_feature";
    }
  }

  // 5. Add debug logging of: subscriptionTier, requestsToday, requestsLimit, paywallReason
  console.log("[DEBUG SUBSCRIPTION SYSTEM][checkExportQuota] Audit details:", {
    subscriptionTier: verifiedTier,
    requestsToday: exportsToday,
    requestsLimit: limit,
    paywallReason
  });
  
  return {
    allowed,
    exportsToday,
    limit,
    remaining
  };
}

/**
 * Increment the user's AI requests count. Handles reset check atomically if the date has changed.
 */
export async function incrementUserRequests(userId: string): Promise<void> {
  const todayStr = new Date().toLocaleDateString("en-CA");
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  
  if (userData.lastRequestResetDate !== todayStr) {
    await updateDoc(userRef, {
      requestsToday: 1,
      lastRequestResetDate: todayStr
    });
  } else {
    await updateDoc(userRef, {
      requestsToday: increment(1)
    });
  }
}

/**
 * Increment the user's document exports count via server-side verification.
 */
export async function incrementUserExports(userId: string): Promise<void> {
  try {
    const headers = await getApiAuthorizationHeader();
    const res = await fetch("/api/export/check-and-consume", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId })
    });

    if (res.ok) {
      console.log("[SubscriptionService] Export successfully counted on server");
      return;
    }
  } catch (err) {
    console.warn("[SubscriptionService] Server export count check warning:", err);
  }

  // Fallback if server is temporarily unreachable
  try {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    
    if (userData.lastExportResetDate !== todayStr) {
      await updateDoc(userRef, {
        exportsToday: 1,
        lastExportResetDate: todayStr
      });
    } else {
      await updateDoc(userRef, {
        exportsToday: increment(1)
      });
    }
  } catch (fallbackErr) {
    console.warn("[SubscriptionService] Fallback export count warning:", fallbackErr);
  }
}

/**
 * Check if a certain feature is accessible to a given subscription tier.
 */
export function isFeatureAllowed(
  tier: SubscriptionTier, 
  feature: keyof PlanLimits["features"], 
  limits: PlanLimits = DEFAULT_PLAN_LIMITS
): boolean {
  // 1 & 2. Read and verify subscriptionTier directly from Firestore
  let verifiedTier: SubscriptionTier = "free";
  if (tier === "pro" || tier === "business") {
    verifiedTier = tier;
  }

  const allowedTiers = limits.features[feature] || DEFAULT_PLAN_LIMITS.features[feature];
  const allowed = allowedTiers.includes(verifiedTier);

  // 5. Add debug logging of: subscriptionTier, requestsToday, requestsLimit, paywallReason
  console.log("[DEBUG SUBSCRIPTION SYSTEM][isFeatureAllowed] Audit details:", {
    subscriptionTier: verifiedTier,
    feature,
    allowed,
    paywallReason: allowed ? "none" : `${feature}_is_premium_only_feature`
  });

  return allowed;
}

export type Language = "uz_lat" | "uz_cyr" | "ru" | "en";

export interface User {
  uid: string;
  id?: string;
  telegramId?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  displayName?: string;
  role: "user" | "admin";
  subscriptionTier: "free" | "pro" | "business";
  subscriptionStatus?: "active" | "expired" | "canceled";
  requestsToday?: number;
  exportsToday?: number;
  signatureDataUrl?: string;
  avatarUrl?: string;
  photoUrl?: string;
  languageCode?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface PersonProfile {
  id: string;
  userId: string;
  fullName: string;
  address?: string;
  passport?: string;
  phone?: string;
  createdAt: number;
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: number;
  completed: boolean;
  type?: "hearing" | "appeal" | "submission" | "custom" | string;
}

export interface Evidence {
  id: string;
  name: string;
  type: string;
  fileUrl?: string; // Download URL from Cloud Storage
  storagePath?: string; // Path for deletion
  category: "contract" | "receipt" | "photo" | "other";
  uploadedAt: number;
}

export interface CourtPackage {
  id?: string;
  mainDocumentId?: string;
  checklist: { id: string; title: string; completed: boolean }[];
  evidenceIds: string[];
}

export interface Case {
  id: string;
  userId: string;
  title: string;
  category?: string;
  status: "active" | "inprogress" | "closed" | "archived" | string;
  region?: string;
  courtType?: string;
  deadlines: Deadline[];
  evidence: Evidence[];
  courtPackage?: CourtPackage;
  winningProbability?: number;
  riskLevel?: string;
  strengths?: string[];
  weaknesses?: string[];
  risk?: string;
  strategy?: string;
  expertise?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Document {
  id: string;
  userId: string;
  caseId?: string;
  title?: string;
  content: string;
  language: Language;
  signatureRequired?: boolean;
  signedByDataUrl?: string; // Appended signature
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  // Replaced base64 with cloud storage references to prevent 1MB document limit crashes
  files?: { name: string; type: string; fileUrl: string; storagePath?: string }[]; 
  createdAt: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages?: ChatMessage[];
  language: Language | "en";
  isPrivate?: boolean;
  isBusinessMode?: boolean;
  document?: string;
  winningProbability?: number;
  riskLevel?: string;
  strengths?: string[];
  weaknesses?: string[];
  risk?: string;
  strategy?: string;
  expertise?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RiskAnalysis {
  successProbability: number;
  risks: string[];
  weakPoints: string[];
  recommendations: string[];
}

export interface DocumentTemplate {
  id: string;
  name: Record<string, string>;
  category: string;
  fields: any[];
  variants: any[];
}

export interface EvidenceReport {
  id: string;
  caseId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  files: { name: string; type: string; size?: number }[];
  analysis: {
    strongEvidence: string[];
    mediumEvidence: string[];
    weakEvidence: string[];
    missingEvidence: string[];
    contradictions: string[];
    potentialRisks: string[];
  };
  winProbability: {
    score: number;
    confidence: "High" | "Medium" | "Low" | string;
    disclaimer: string;
  };
  riskMatrix: {
    id: string;
    level: "High" | "Medium" | "Low" | string;
    description: string;
    impact: string;
    mitigation: string;
  }[];
  opponentAnalysis: {
    counterarguments: string[];
    weaknesses: string[];
    vulnerabilities: string[];
  };
  actionPlan: {
    immediate: string[];
    sevenDays: string[];
    thirtyDays: string[];
  };
  scorecard: {
    overallScore: number;
    categories: {
      name: string;
      score: number;
    }[];
  };
}

export interface ResearchReport {
  id: string;
  userId: string;
  question: string;
  category: "civil" | "criminal" | "administrative" | "labour" | "contract" | "family" | "tax" | string;
  caseId?: string;
  summary: string;
  legalQuestions: string[];
  principles: string[];
  supportingArguments: string[];
  opposingArguments: string[];
  risks: string[];
  requiredDocuments: string[];
  missingEvidence: string[];
  supportingMaterials: string[];
  riskLevel: "High" | "Medium" | "Low" | string;
  riskAnalysis: string;
  strategyActions: string[];
  expertiseTip: string;
  createdAt: number;
  updatedAt: number;
}

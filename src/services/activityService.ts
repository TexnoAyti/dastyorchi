import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function logActivity(
  type: 
    | "case_create" 
    | "case_archive" 
    | "case_delete" 
    | "case_status" 
    | "document_create" 
    | "document_export" 
    | "document_archive" 
    | "risk_generate" 
    | "strategy_generate" 
    | "expertise_generate" 
    | "note_update" 
    | "evidence_add"
    | "deadline_create"
    | "deadline_update"
    | "deadline_delete"
    | "deadline_toggle"
    | "research_generate"
    | "research_delete"
    | "research_link",
  title: string,
  description: string,
  caseId?: string | null,
  caseTitle?: string | null
) {
  if (!auth.currentUser) return;
  try {
    await addDoc(collection(db, "activities"), {
      userId: auth.currentUser.uid,
      type,
      title,
      description,
      caseId: caseId || null,
      caseTitle: caseTitle || null,
      timestamp: Date.now()
    });
  } catch (err) {
    console.warn("Activity logging failed (non-blocking):", err);
  }
}

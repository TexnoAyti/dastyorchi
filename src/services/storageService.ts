import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

// Reduce retry time to fail fast (2 seconds) if Firebase Storage is uninitialized or blocking
storage.maxUploadRetryTime = 2000; 
storage.maxOperationRetryTime = 2000;

export async function uploadChatFile(userId: string, chatId: string, fileName: string, base64Data: string) {
  const fileId = Date.now().toString() + "-" + fileName;
  const storagePath = `users/${userId}/chats/${chatId}/${fileId}`;
  const fileRef = ref(storage, storagePath);

  try {
    // We expect basic base64 data URLs here
    await uploadString(fileRef, base64Data, 'data_url');
    const fileUrl = await getDownloadURL(fileRef);
    return { fileUrl, storagePath };
  } catch (error: any) {
    // Only warn, don't show full red error stack trace
    console.warn("Firebase Storage is not configured or blocked. File will not be persisted in DB.");
    throw new Error("Storage_Not_Configured");
  }
}

export async function uploadEvidence(userId: string, caseId: string, fileName: string, base64Data: string) {
  const fileId = Date.now().toString() + "-" + fileName;
  const storagePath = `users/${userId}/cases/${caseId}/evidence/${fileId}`;
  const fileRef = ref(storage, storagePath);

  try {
    await uploadString(fileRef, base64Data, 'data_url');
    const fileUrl = await getDownloadURL(fileRef);
    return { fileUrl, storagePath };
  } catch (error: any) {
    console.warn("Storage not configured for uploadEvidence: ", error.message);
    throw new Error("Storage_Not_Configured");
  }
}

export async function deleteStorageFile(storagePath: string) {
  const fileRef = ref(storage, storagePath);
  try {
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error("Storage delete error:", error);
    // Suppress error if file doesn't exist
    return false;
  }
}

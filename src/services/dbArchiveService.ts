import { db } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  doc, 
  limit, 
  writeBatch
} from "firebase/firestore";

/**
 * Checks and archives old chats if the user exceeds the maximum limit of 50 active chats.
 * Moves the oldest chats and all their messages to the archive collections.
 */
export async function archiveOldChats(userId: string): Promise<void> {
  if (!userId) return;
  try {
    // Query active chats ordered by updatedAt descending
    const chatsQuery = query(
      collection(db, "chats"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(chatsQuery);
    
    // Only archive if count exceeds 50
    if (snapshot.size <= 50) return;

    const docs = snapshot.docs;
    const toArchive = docs.slice(50); // Get all chats beyond the 50 limit

    for (const chatDoc of toArchive) {
      const chatId = chatDoc.id;
      const chatData = chatDoc.data();

      // Write chat document to archived_chats collection
      await setDoc(doc(db, "archived_chats", chatId), {
        ...chatData,
        archivedAt: new Date()
      });

      // Get all messages for this chat
      const messagesQuery = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "asc")
      );
      const msgSnapshot = await getDocs(messagesQuery);

      const batch = writeBatch(db);
      for (const msgDoc of msgSnapshot.docs) {
        const msgId = msgDoc.id;
        const msgData = msgDoc.data();

        // Save messages in archived_messages
        const archiveMsgRef = doc(db, "archived_messages", msgId);
        batch.set(archiveMsgRef, {
          ...msgData,
          chatId,
          userId,
          archivedAt: new Date()
        });

        // Also save messages under the archived chat's messages subcollection
        const subMsgRef = doc(db, "archived_chats", chatId, "messages", msgId);
        batch.set(subMsgRef, msgData);

        // Delete active message from subcollection
        batch.delete(msgDoc.ref);
      }

      // Execute message archival and deletion
      await batch.commit();

      // Delete active chat document
      await deleteDoc(chatDoc.ref);
      console.log(`Successfully archived chat ${chatId} and its associated messages.`);
    }
  } catch (error) {
    console.error("Error archiving old chats:", error);
  }
}

/**
 * Checks and archives old messages in a specific chat if they exceed the 100 limit.
 * Moves the oldest messages in the active chat to the global archived_messages collection.
 */
export async function archiveOldMessages(chatId: string, userId: string): Promise<void> {
  if (!chatId || !userId) return;
  try {
    // Query messages in the chat, newest first, to identify which exceed the 100 message limit
    const messagesQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(messagesQuery);
    
    if (snapshot.size <= 100) return;

    const docs = snapshot.docs;
    const toArchive = docs.slice(100); // Get message docs beyond the first 100 newest

    const batch = writeBatch(db);
    for (const msgDoc of toArchive) {
      const msgId = msgDoc.id;
      const msgData = msgDoc.data();

      // Write to global archive of messages
      const archiveMsgRef = doc(db, "archived_messages", msgId);
      batch.set(archiveMsgRef, {
        ...msgData,
        chatId,
        userId,
        archivedAt: new Date()
      });

      // Delete from active message subcollection
      batch.delete(msgDoc.ref);
    }

    await batch.commit();
    console.log(`Successfully archived ${toArchive.length} messages for active chat ${chatId}.`);
  } catch (error) {
    console.error("Error archiving old messages:", error);
  }
}

/**
 * Checks and archives old documents if the user has more than 30 documents.
 * Moves the oldest documents to the archived_documents collection.
 */
export async function archiveOldDocuments(userId: string): Promise<void> {
  if (!userId) return;
  try {
    // Query active documents for the user sorted by createdAt descending
    const documentsQuery = query(
      collection(db, "documents"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(documentsQuery);
    
    if (snapshot.size <= 30) return; // Keep at most 30 documents active

    const docs = snapshot.docs;
    const toArchive = docs.slice(30);

    const batch = writeBatch(db);
    for (const docItem of toArchive) {
      const docId = docItem.id;
      const docData = docItem.data();

      // Write to archived_documents
      const archiveDocRef = doc(db, "archived_documents", docId);
      batch.set(archiveDocRef, {
        ...docData,
        archivedAt: new Date()
      });

      // Delete from active documents
      batch.delete(docItem.ref);
    }

    await batch.commit();
    console.log(`Successfully archived ${toArchive.length} documents for user ${userId}.`);
  } catch (error) {
    console.error("Error archiving old documents:", error);
  }
}

import { db } from "../firebase";
import { 
  collection, doc, getDocs, getDoc, setDoc, writeBatch, serverTimestamp 
} from "firebase/firestore";
import { LegalArticle, LEGAL_CODES, LEGAL_LIBRARY } from "../data/legalLibrary";
import { LegalIndexedDB } from "./legalIndexedDB";

export interface LegalMetadata {
  counts: Record<string, number>;
  lastUpdatedAt: number;
}

export class LegalService {
  private static cachedArticles: LegalArticle[] = [];
  private static isInitialized = false;
  private static subscribers: (() => void)[] = [];

  /**
   * Subscribe to database updates
   */
  public static subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private static notifySubscribers() {
    for (const callback of this.subscribers) {
      try {
        callback();
      } catch (e) {
        console.error("Subscriber notification error", e);
      }
    }
  }

  /**
   * Get in-memory cached articles synchronously for instant search matching (AI chat query integration)
   */
  public static getCachedArticles(): LegalArticle[] {
    if (this.cachedArticles.length === 0 && !this.isInitialized) {
      // Return seed static library as quick fallback on very early load
      return LEGAL_LIBRARY;
    }
    return this.cachedArticles;
  }

  /**
   * Initialize Legal Service, synchronize IndexedDB and load memory caches
   */
  public static async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 1. Initialize IndexedDB
      await LegalIndexedDB.init();

      // 2. Load cached articles from local IndexedDB
      let localArticles = await LegalIndexedDB.getAllArticles();

      // 3. Preload standard static legal library if IndexedDB is empty
      if (localArticles.length === 0) {
        console.log("Seeding local legal IndexedDB with default catalog...");
        await LegalIndexedDB.putArticles(LEGAL_LIBRARY);
        localArticles = [...LEGAL_LIBRARY];
      }

      this.cachedArticles = localArticles;
      this.isInitialized = true;

      // 4. Try syncing with Firestore in the background
      this.syncWithFirestore().catch(err => {
        console.warn("Background Firestore database sync skipped (working offline):", err);
      });

    } catch (error) {
      console.error("LegalService initialization error:", error);
      // Fallback
      this.cachedArticles = [...LEGAL_LIBRARY];
      this.isInitialized = true;
    }
    this.notifySubscribers();
  }

  /**
   * Syncs IndexedDB with Firestore to bring any freshly imported datasets
   */
  public static async syncWithFirestore(): Promise<void> {
    try {
      // Check Firestore legal metadata configuration
      const metaRef = doc(db, "internal", "legal_metadata");
      const metaSnap = await getDoc(metaRef);

      if (!metaSnap.exists()) {
        // If Firestore metadata doesn't exist, we seed Firestore on first connection by an admin or user with access
        console.log("Firestore metadata empty. Uploading default seed database...");
        await this.uploadDefaultSeedToFirestore();
        return;
      }

      const metaData = metaSnap.data() as LegalMetadata;
      
      // Fetch articles from Firestore to synchronize
      const querySnap = await getDocs(collection(db, "legal_articles"));
      if (querySnap.empty) return;

      const firestoreArticles: LegalArticle[] = [];
      querySnap.forEach((docSnap) => {
        firestoreArticles.push(docSnap.data() as LegalArticle);
      });

      if (firestoreArticles.length > 0) {
        // Put all fetched elements into IndexedDB
        await LegalIndexedDB.clearAll();
        await LegalIndexedDB.putArticles(firestoreArticles);
        this.cachedArticles = firestoreArticles;
        console.log(`Synced ${firestoreArticles.length} articles from Firestore.`);
        this.notifySubscribers();
      }
    } catch (e) {
      console.warn("Firestore sync failed, keeping local IndexedDB", e);
    }
  }

  /**
   * Seed Firestore with the initial legal library dataset
   */
  private static async uploadDefaultSeedToFirestore(): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Add each article
      for (const article of LEGAL_LIBRARY) {
        const docRef = doc(db, "legal_articles", article.id);
        batch.set(docRef, {
          ...article,
          createdAt: serverTimestamp()
        });
      }

      // Generate counts
      const counts: Record<string, number> = {};
      for (const code of LEGAL_CODES) {
        counts[code.id] = LEGAL_LIBRARY.filter(a => a.codeId === code.id).length;
      }

      const metaRef = doc(db, "internal", "legal_metadata");
      batch.set(metaRef, {
        counts,
        lastUpdatedAt: Date.now()
      });

      await batch.commit();
      console.log("Successfully backfilled Firestore with original 15 articles.");
    } catch (error) {
      console.warn("Could not backfill Firestore with default seed (permission issue or offline):", error);
    }
  }

  /**
   * Search engine filtering across available articles with IndexedDB backend
   */
  public static async search(queryText: string, codeId: string = "all"): Promise<LegalArticle[]> {
    await this.init();
    return LegalIndexedDB.searchArticles(queryText, codeId);
  }

  /**
   * Calculate article count dynamically by grouping the in-memory/cache database
   */
  public static getArticleCounts(): Record<string, number> {
    const list = this.getCachedArticles();
    const counts: Record<string, number> = {};
    
    // Initialize standard categories
    for (const code of LEGAL_CODES) {
      counts[code.id] = 0;
    }

    // Count dynamically
    for (const article of list) {
      if (!counts[article.codeId]) {
        counts[article.codeId] = 0;
      }
      counts[article.codeId]++;
    }

    return counts;
  }

  /**
   * Clears the active legal database (both Firestore and IndexedDB) and uploads a freshly imported dataset
   */
  public static async importDataset(newArticles: Omit<LegalArticle, "id">[]): Promise<{ count: number }> {
    try {
      const formatted: LegalArticle[] = newArticles.map((art, index) => {
        const id = `${art.codeId}_imported_${Date.now()}_${index}`;
        return {
          ...art,
          id,
          keywords: art.keywords || []
        } as LegalArticle;
      });

      // 1. Save to IndexedDB locally for instantaneous updates
      await LegalIndexedDB.clearAll();
      await LegalIndexedDB.putArticles(formatted);
      this.cachedArticles = formatted;

      // 2. Clear out older legal documents in Firestore and upload newly imported dataset using batch writes
      try {
        const batch = writeBatch(db);

        // First read existing from Firestore to delete them if any
        const existingDocs = await getDocs(collection(db, "legal_articles"));
        existingDocs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // Set the new articles
        for (const art of formatted) {
          const docRef = doc(db, "legal_articles", art.id);
          batch.set(docRef, { ...art, createdAt: serverTimestamp() });
        }

        // Update counts metadata
        const counts: Record<string, number> = {};
        for (const code of LEGAL_CODES) {
          counts[code.id] = formatted.filter(a => a.codeId === code.id).length;
        }

        // Handle dynamically added custom codes
        for (const art of formatted) {
          if (!counts[art.codeId]) {
            counts[art.codeId] = 0;
          }
          counts[art.codeId] = formatted.filter(a => a.codeId === art.codeId).length;
        }

        const metaRef = doc(db, "internal", "legal_metadata");
        batch.set(metaRef, {
          counts,
          lastUpdatedAt: Date.now()
        });

        await batch.commit();
        console.log("Committed import batch cleanly to cloud database.");
      } catch (dbErr) {
        console.warn("Firestore Cloud import skipped or failed (will run strictly client-side/offline):", dbErr);
      }

      this.notifySubscribers();
      return { count: formatted.length };

    } catch (error: any) {
      console.error("Legal dataset import error:", error);
      throw new Error(error.message || "Huquqiy hujjatlar bazasini import qilishda xatolik yuz berdi.");
    }
  }

  /**
   * Restore database back to default seed templates
   */
  public static async resetToDefault(): Promise<void> {
    await LegalIndexedDB.clearAll();
    await LegalIndexedDB.putArticles(LEGAL_LIBRARY);
    this.cachedArticles = [...LEGAL_LIBRARY];
    
    try {
      await this.uploadDefaultSeedToFirestore();
    } catch (e) {
      console.warn("Could not sync default reset to Firestore:", e);
    }

    this.notifySubscribers();
  }
}

/**
 * High-performance, lightweight in-browser IndexedDB service for storing and full-text searching
 * thousands of legal articles. Avoiding heavy dependencies to prevent library resolution issues.
 */

import { LegalArticle } from "../data/legalLibrary";

const DB_NAME = "legal_database";
const DB_VERSION = 1;
const STORE_NAME = "articles";

export class LegalIndexedDB {
  private static db: IDBDatabase | null = null;

  public static async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("codeId", "codeId", { unique: false });
          store.createIndex("articleNumber", "articleNumber", { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        console.error("IndexedDB opening failed:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  public static async putArticles(articles: LegalArticle[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = (e: any) => reject(e.target.error);

      for (const article of articles) {
        store.put(article);
      }
    });
  }

  public static async deleteArticles(articleIds: string[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = (e: any) => reject(e.target.error);

      for (const id of articleIds) {
        store.delete(id);
      }
    });
  }

  public static async clearAll(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (e: any) => reject(e.target.error);
    });
  }

  public static async getAllArticles(): Promise<LegalArticle[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e: any) => reject(e.target.error);
    });
  }

  public static async getArticlesByCode(codeId: string): Promise<LegalArticle[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("codeId");
      const request = index.getAll(IDBKeyRange.only(codeId));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e: any) => reject(e.target.error);
    });
  }

  public static async searchArticles(
    queryText: string,
    codeId: string = "all"
  ): Promise<LegalArticle[]> {
    const all = await this.getAllArticles();
    const query = queryText.toLowerCase().trim();

    // Filtering logic
    return all.filter((article) => {
      const matchesCode = codeId === "all" || article.codeId === codeId;
      if (!matchesCode) return false;
      if (!query) return true;

      return (
        article.articleNumber.toLowerCase().includes(query) ||
        article.articleTitle.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        (article.keywords && article.keywords.some((kw) => kw.toLowerCase().includes(query))) ||
        article.codeName.toLowerCase().includes(query)
      );
    });
  }
}

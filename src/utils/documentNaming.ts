/**
 * Document Naming Utility
 * Provides consistent, meaningful and content-based filenames for legal documents,
 * reports, analysis files, and exports.
 */

import { DOCUMENT_TEMPLATES } from "../constants";

interface NamingOptions {
  content?: string;
  title?: string;
  userRequest?: string;
  templateId?: string;
  type?: "document" | "risk" | "strategy" | "expertise" | "analysis";
  extension?: "pdf" | "docx" | "doc";
}

/**
 * Checks if a name or segment is generic (e.g. Hujjat, Hujjat 2, Untitled, null, etc.)
 * so we can skip it in the priority resolution chain.
 */
export function isGenericName(name: string | undefined): boolean {
  if (!name) return true;
  const n = name.trim().toLowerCase();
  
  const genericWords = [
    "hujjat", "hujjatlar", "untitled", "document", "documents", "generic", "anonymous", "null", "undefined", "none",
    "yangi suhbat", "yangi-suhbat", "yangi_suhbat", "yangi", "chat", "suhbat", "new conversation", "new chat"
  ];
  
  if (genericWords.includes(n)) {
    return true;
  }

  // Check matching patterns like "hujjat 1", "hujjat 2", "hujjat 3"
  if (/^(hujjat|document|untitled|yangi suhbat|suhbat|chat)\s*\d*$/i.test(n)) {
    return true;
  }
  if (/^untitled\s*document\s*\d*$/i.test(n)) {
    return true;
  }
  
  return false;
}

/**
 * Extracts first 3-4 non-stop words from text to form a beautiful dynamic descriptor.
 */
export function extractDynamicFallback(content: string): string {
  if (!content) return "";
  
  // Strip HTML and normalize
  const plainText = content.replace(/<[^>]*>/g, " ");
  
  const words = plainText
    .split(/[\s_+\-.,!?;:()""'’‘`“”\/]+/)
    .map(w => w.trim())
    .filter(w => {
      if (w.length < 3) return false;
      const lower = w.toLowerCase();
      const stopWords = [
        "va", "da", "ning", "uchun", "bilan", "ham", "shu", "ushbu", "orqali", "barcha", "ammo", "lekin", "vaqtda", "ular", "men", "biz", "sen", "siz",
        "hujjat", "hujjatlar", "untitled", "document", "documents", "generic", "any", "null", "undefined",
        "yangi", "suhbat", "chat", "asosiy", "davlat", "shartnoma", "ariza", "shikoyat"
      ];
      return !stopWords.includes(lower);
    });
    
  if (words.length > 0) {
    return words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("_");
  }
  
  return "";
}

/**
 * Transliterates and cleans up characters to make safe filenames
 * with nice casing and format.
 */
export function cleanFilenameSegment(str: string): string {
  if (!str) return "";
  
  let cleaned = str
    .replace(/o['’‘`“”]/gi, "o")
    .replace(/g['’‘`“”]/gi, "g")
    .replace(/o‘/gi, "o")
    .replace(/g‘/gi, "g")
    .replace(/sh/gi, "sh")
    .replace(/ch/gi, "ch")
    .replace(/ñ/gi, "n")
    .replace(/ğ/gi, "g")
    .replace(/ı/gi, "i")
    .replace(/ə/gi, "e")
    .replace(/ö/gi, "o")
    .replace(/ü/gi, "u")
    .replace(/ç/gi, "c")
    .replace(/ş/gi, "s");

  // Keep alphanumeric characters, underscores, dashes, spaces, and Uzbek apostrophes
  cleaned = cleaned.replace(/[^a-zA-Z0-9_\-\s'’]/g, "");
  
  // Replace multiple spaces/underscores with a single underscore and capitalize words
  cleaned = cleaned
    .trim()
    .split(/[\s_]+/)
    .map(word => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .filter(Boolean)
    .join("_");
    
  return cleaned;
}

/**
 * Smartly extracts a topic or subject segment from document content by scanning headings.
 */
export function extractFirstHeading(content: string): string {
  if (!content) return "";

  // Try finding HTML H1 headings
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    const text = h1Match[1].replace(/<[^>]*>/g, "").trim();
    if (text && !isGenericName(text)) {
      return text;
    }
  }

  // Try finding HTML H2 headings
  const h2Match = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2Match && h2Match[1]) {
    const text = h2Match[1].replace(/<[^>]*>/g, "").trim();
    if (text && !isGenericName(text)) {
      return text;
    }
  }

  // Try Markdown headings
  const mdMatch = content.match(/^(?:#|##|###)\s+(.+)$/m);
  if (mdMatch && mdMatch[1]) {
    const text = mdMatch[1].replace(/[*_`]/g, "").trim();
    if (text && !isGenericName(text)) {
      return text;
    }
  }

  // Fallback: search first short meaningful lines
  const lines = content.split(/[\r\n]+/);
  for (const line of lines) {
    const cleanLine = line.replace(/<[^>]*>/g, "").trim();
    if (cleanLine.length > 5 && cleanLine.length < 80 && !isGenericName(cleanLine)) {
      return cleanLine;
    }
  }

  return "";
}

/**
 * Robustly matches strings to find primary legal concepts locally.
 */
export function extractLegalKeywords(text: string): string {
  if (!text) return "";
  const lower = text.toLowerCase();

  // Strict mappings matching the requirements
  if (lower.includes("apellyatsiya shikoyati") || lower.includes("apellyatsiya_shikoyati")) {
    return "Apellyatsiya_Shikoyati";
  }
  if (lower.includes("mehnat shartnomasini bekor qilish arizasi") || lower.includes("mehnat_shartnomasi_bekor_qilish_arizasi")) {
    return "Mehnat_Shartnomasi_Bekor_Qilish_Arizasi";
  }
  if (lower.includes("ijara shartnomasi ekspertizasi") || lower.includes("ijara_shartnomasi_ekspertizasi")) {
    return "Ijara_Shartnomasi_Ekspertizasi";
  }
  if (lower.includes("risk tahlili") || lower.includes("risk_tahlili")) {
    return "Risk_Tahlili";
  }

  // Common related mappings
  if (lower.includes("apellyatsiya") || lower.includes("apelyatsiya") || lower.includes("apell")) {
    return "Apellyatsiya_Shikoyati";
  }
  if (lower.includes("mehnat shartnomasini bekor") || lower.includes("mehnat shartnomasini bekor qilish") || lower.includes("mehnat shartnomasi bekor")) {
    return "Mehnat_Shartnomasi_Bekor_Qilish_Arizasi";
  }
  if (lower.includes("mehnat shartnomasi") || lower.includes("mehnat_shartnomasi")) {
    return "Mehnat_Shartnomasi";
  }
  if (lower.includes("mehnat nizosi") || lower.includes("mehnat_nizosi") || lower.includes("mehnat nizo")) {
    return "Mehnat_Nizosi";
  }
  if (lower.includes("ijara shartnomasi") || lower.includes("ijara_shartnomasi")) {
    if (lower.includes("ekspertiza") || lower.includes("ekspertizasi")) {
      return "Ijara_Shartnomasi_Ekspertizasi";
    }
    return "Ijara_Shartnomasi";
  }
  if (lower.includes("aliment") || lower.includes("aliment undirish")) {
    return "Aliment_Undirish_Arizasi";
  }
  if (lower.includes("nikohdan ajratish") || lower.includes("ajrashish") || lower.includes("nikoh bekor")) {
    return "Nikohdan_Ajratish_Arizasi";
  }
  if (lower.includes("qarz undirish") || lower.includes("qarzni qaytarish")) {
    return "Qarz_Undirish";
  }
  if (lower.includes("zararni qoplash") || lower.includes("zarar undirish") || lower.includes("tazminat")) {
    return "Zararni_Qoplash";
  }

  // General clean-up fallback if no predefined legal concept was caught
  return cleanFilenameSegment(text);
}

/**
 * Sanitizes the filename by replacing spaces with underscores and removing invalid chars.
 */
export function sanitizeFilename(str: string, maxLength: number = 80): string {
  if (!str) return "";

  // Perform basic translit representation to keep letters simple and clean
  let cleaned = str
    .replace(/o['’‘`“”]/gi, "o")
    .replace(/g['’‘`“”]/gi, "g")
    .replace(/o‘/gi, "o")
    .replace(/g‘/gi, "g")
    .replace(/sh/gi, "sh")
    .replace(/ch/gi, "ch")
    .replace(/ñ/gi, "n")
    .replace(/ğ/gi, "g")
    .replace(/ı/gi, "i")
    .replace(/ə/gi, "e")
    .replace(/ö/gi, "o")
    .replace(/ü/gi, "u")
    .replace(/ç/gi, "c")
    .replace(/ş/gi, "s");

  // Keep alphanumeric, dash, underscore, space, and Uzbek apostrophes
  cleaned = cleaned.replace(/[^a-zA-Z0-9_\-\s'’]/g, "");

  // Convert multiple spaces/dashes/underscores to a single underscore
  cleaned = cleaned.trim().replace(/[\s\-_]+/g, "_");

  // Capitalize word beginnings beautifully, but preserve ALL CAPS words
  cleaned = cleaned
    .split("_")
    .map(w => {
      if (w === w.toUpperCase() && w.length > 1) {
        return w; // Keep fully uppercase words intact (like JINOIY, FUQAROLIK, etc.)
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .filter(Boolean)
    .join("_");

  // Enforce strictly max length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
    cleaned = cleaned.replace(/_+$/, ""); // prune trailing underscores
  }

  return cleaned || "Hujjat";
}

/**
 * Generate a safe file-friendly date string YYYY-MM-DD
 */
export function getSafeTimestamp(): string {
  const d = new Date();
  const pad = (num: number) => String(num).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Analyzes document context, title, and user requests to categorize the legal topic
 * and generate a highly distinct legal category and document type.
 */
export function detectLegalCategoryAndDocType(
  content: string = "",
  title: string = "",
  userRequest: string = "",
  templateId?: string,
  type?: string
): { category: string; docType: string } {
  const combined = `${title || ""} ${userRequest || ""} ${content || ""}`.toLowerCase();

  let category = "";
  let docType = "";

  // 1. Resolve template-level metadata if available
  let templateCategory = "";
  let isTemplateDavo = false;
  
  if (templateId) {
    const template = DOCUMENT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      templateCategory = template.category;
      if (template.fields) {
        const fieldIds = template.fields.map(f => String(f.id).toLowerCase());
        if (fieldIds.some(id => id.includes("da_vogar") || id.includes("da'vogar") || id.includes("javobgar") || id.includes("da’vogar"))) {
          isTemplateDavo = true;
        }
      }
    }
  } else if (title) {
    // Search by template name matching
    const template = DOCUMENT_TEMPLATES.find(t => {
      const nameUz = t.name.uz_lat?.toLowerCase();
      const nameRu = t.name.ru?.toLowerCase();
      const titleLower = title.toLowerCase();
      return (nameUz && titleLower.includes(nameUz)) || (nameRu && titleLower.includes(nameRu));
    });
    if (template) {
      templateCategory = template.category;
      if (template.fields) {
        const fieldIds = template.fields.map(f => String(f.id).toLowerCase());
        if (fieldIds.some(id => id.includes("da_vogar") || id.includes("da'vogar") || id.includes("javobgar") || id.includes("da’vogar"))) {
          isTemplateDavo = true;
        }
      }
    }
  }

  // 2. Legal Category detection from context
  if (
    combined.includes("jinoiy") || 
    combined.includes("jinoyat") || 
    combined.includes("tergov") || 
    combined.includes("qamoq") || 
    combined.includes("prokuror") || 
    combined.includes("ayblanuvchi") || 
    combined.includes("sudlanuvchi") ||
    combined.includes("jinoyat kodeksi") ||
    combined.includes("jk ") ||
    combined.includes("militsiya")
  ) {
    category = "JINOIY";
  } else if (
    combined.includes("ma'muriy") || 
    combined.includes("mamuriy") || 
    combined.includes("ma’muriy") || 
    combined.includes("jarima") || 
    combined.includes("bayonnoma") || 
    combined.includes("yhxb") || 
    combined.includes("ypx") || 
    combined.includes("mjtk") || 
    combined.includes("huquqbuzarlik")
  ) {
    category = "MAMURIY";
  } else if (
    combined.includes("mehnat") || 
    combined.includes("ish beruvchi") || 
    combined.includes("xodim") || 
    combined.includes("ish haqi") || 
    combined.includes("mehnat kodeksi") || 
    combined.includes("oylik") ||
    combined.includes("mk ")
  ) {
    category = "MEHNAT";
  } else if (
    combined.includes("shartnoma") || 
    combined.includes("shartnomasi") || 
    combined.includes("ijara") || 
    combined.includes("oldi-sotdi") || 
    combined.includes("oldi sotdi") || 
    combined.includes("pudrat") || 
    combined.includes("kontrakt") ||
    combined.includes("lizing") ||
    combined.includes("bitim")
  ) {
    if (combined.includes("mehnat")) {
      category = "MEHNAT";
    } else {
      category = "SHARTNOMA";
    }
  } else if (
    combined.includes("fuqarolik") || 
    combined.includes("aliment") || 
    combined.includes("nikoh") || 
    combined.includes("ajrashish") || 
    combined.includes("er-xotin") || 
    combined.includes("da'vo") || 
    combined.includes("davo") || 
    combined.includes("da’vo") || 
    combined.includes("zarar") || 
    combined.includes("qarz") || 
    combined.includes("sud") ||
    combined.includes("vasiylik") ||
    combined.includes("meros") ||
    combined.includes("fk ")
  ) {
    category = "FUQAROLIK";
  }

  // Fallback category using templateCategory if not resolved from text
  if (!category && templateCategory) {
    const catLower = templateCategory.toLowerCase();
    if (catLower === "mehnat") {
      category = "MEHNAT";
    } else if (catLower === "ma'muriy" || catLower === "mamuriy") {
      category = "MAMURIY";
    } else if (catLower === "shartnoma") {
      category = "SHARTNOMA";
    } else if (["fuqarolik", "oila", "uy-joy", "bank", "meros"].includes(catLower)) {
      category = "FUQAROLIK";
    }
  }

  // Final category fallback to FUQAROLIK
  if (!category) {
    category = "FUQAROLIK";
  }

  // 3. Document Type detection
  // A. Check type option parameter maps first (from Consultation reports)
  if (type === "risk") {
    docType = "RISK_TAHLILI";
  } else if (type === "strategy") {
    docType = "STRATEGIYA";
  } else if (type === "expertise") {
    docType = "EKSPERTIZA";
  }

  // B. Scan text for explicitly matched terms if not resolved yet
  if (!docType) {
    const isAppeal = combined.includes("apellyatsiya") || combined.includes("apelyatsiya") || combined.includes("apell") || combined.includes("apellyasiya");
    const isShikoyat = combined.includes("shikoyat") || combined.includes("shikoyati") || combined.includes("shikoyatnomasi");
    const isDavo = isTemplateDavo || 
                   combined.includes("da'vo") || 
                   combined.includes("davo") || 
                   combined.includes("da’vo") || 
                   combined.includes("davo arizasi") || 
                   combined.includes("da'vo arizasi") || 
                   combined.includes("da’vo arizasi") ||
                   combined.includes("da’vogar") ||
                   combined.includes("da'vogar") ||
                   combined.includes("davo_gari") ||
                   combined.includes("javobgar");
    const isEkspertiza = combined.includes("ekspertiza") || combined.includes("ekspertizasi") || combined.includes("ekspert") || combined.includes("xulosa");
    const isRisk = combined.includes("risk") || combined.includes("riski") || combined.includes("xavf") || combined.includes("risklar") || combined.includes("risk tahlili") || combined.includes("risk_tahlili");
    const isTahlil = combined.includes("tahlil") || combined.includes("tahlili") || combined.includes("analiz");
    const isStrategiya = combined.includes("strategiya") || combined.includes("strategiyasi") || combined.includes("reja") || combined.includes("reja-jadval") || combined.includes("plani");
    const isAriza = combined.includes("ariza") || combined.includes("arizasi") || combined.includes("murojaat") || combined.includes("murojaati") || combined.includes("iltimosnomasi");
    const isNizo = combined.includes("nizo") || combined.includes("nizosi") || combined.includes("nizolar");

    if (isAppeal && isShikoyat) {
      docType = "APELLYATSIYA_SHIKOYATI";
    } else if (isShikoyat) {
      if (isAppeal) {
        docType = "APELLYATSIYA_SHIKOYATI";
      } else {
        docType = "SHIKOYAT";
      }
    } else if (isDavo) {
      docType = "DAVO_ARIZASI";
    } else if (category === "MEHNAT" && (isNizo || isAriza)) {
      docType = "NIZOSI_ARIZASI";
    } else if (isNizo && isAriza) {
      docType = "NIZOSI_ARIZASI";
    } else if (isAriza) {
      docType = "ARIZA";
    } else if (isEkspertiza) {
      docType = "EKSPERTIZA";
    } else if (isRisk || (isTahlil && !isEkspertiza)) {
      docType = "RISK_TAHLILI";
    } else if (isStrategiya) {
      docType = "STRATEGIYA";
    } else if (isAppeal) {
      docType = "APELLYATSIYA_SHIKOYATI";
    }
  }

  // C. Fallback checking from templateId if docType remains blank
  if (!docType && templateId) {
    if (templateId.includes("shikoyat")) {
      if (templateId.includes("apellyatsiya") || templateId.includes("apelyatsiya") || templateId.includes("apell")) {
        docType = "APELLYATSIYA_SHIKOYATI";
      } else {
        docType = "SHIKOYAT";
      }
    } else if (templateId.includes("davo")) {
      docType = "DAVO_ARIZASI";
    } else if (templateId.includes("nizo")) {
      docType = "NIZOSI_ARIZASI";
    } else if (templateId.includes("ariza") || templateId.includes("arixa")) {
      if (category === "MEHNAT") {
        docType = "NIZOSI_ARIZASI";
      } else {
        docType = "ARIZA";
      }
    } else if (templateId.includes("tahlil") || templateId.includes("risk")) {
      docType = "RISK_TAHLILI";
    } else if (templateId.includes("ekspertiza")) {
      docType = "EKSPERTIZA";
    } else if (templateId.includes("strategiya")) {
      docType = "STRATEGIYA";
    }
  }

  // D. General fallback rules for templated/builder outputs based on category to prevent blank docType
  if (!docType && templateId) {
    if (category === "MEHNAT") {
      docType = "NIZOSI_ARIZASI";
    } else if (category === "MAMURIY") {
      docType = "SHIKOYAT";
    } else if (category === "FUQAROLIK") {
      docType = "DAVO_ARIZASI";
    } else if (category === "SHARTNOMA") {
      docType = "ARIZA";
    }
  }

  return { category, docType };
}

/**
 * Generates highly descriptive, content-based filenames locally.
 * Precludes any generic titles (Suhbat_Hujjati, Hujjat, etc.) and instead
 * analyzes the document content before export to structure the name.
 */
export function generateMeaningfulFilename(options: NamingOptions): string {
  const { content = "", title = "", userRequest = "", templateId = "", type = "document", extension = "docx" } = options;

  // Analyze document context meticulously before export
  const { category, docType } = detectLegalCategoryAndDocType(content, title, userRequest, templateId, type);

  let baseName = "";

  if (category && docType) {
    // Both legal category and document type detected successfully!
    const currentDate = getSafeTimestamp();
    const extensionLenWithDot = extension.length + 1;
    const dateSuffix = `_${currentDate}`;
    
    // Max allowable base length constraints (80 total characters limit)
    const maxBaseLength = 80 - extensionLenWithDot - dateSuffix.length;
    
    // UPPERCASE category and docType to match examples perfectly
    const upperCombinedPattern = `${category}_${docType}`.toUpperCase();
    
    const sanitizedCategoryAndType = sanitizeFilename(upperCombinedPattern, maxBaseLength).toUpperCase();
    baseName = `${sanitizedCategoryAndType}${dateSuffix}`;
  } else {
    // Fallback if type detection fails
    // "Only use: Fuqarolik.docx as fallback if type detection fails."
    baseName = "Fuqarolik";
  }

  const finalFilename = `${baseName}.${extension}`;

  console.log("Generated filename:");
  console.log(baseName);
  console.log("Export filename:");
  console.log(finalFilename);

  return finalFilename;
}

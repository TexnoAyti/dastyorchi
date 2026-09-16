/**
 * Safe, asynchronous, non-blocking string & base64 encoding/decoding utilities.
 * Handles UTF-8 byte streams properly via TextEncoder/TextDecoder and chunked binary strings,
 * completely avoiding UI thread freeze and URIError/atob issues on large documents.
 */

// Maximum chunk size to yield control back to the event loop
const YIELD_CHUNK_SIZE = 64 * 1024; // 64KB

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof setTimeout !== "undefined") {
      setTimeout(resolve, 0);
    } else {
      resolve();
    }
  });
}

/**
 * Converts a string to base64 asynchronously in non-blocking chunks.
 * Safely handles multi-byte UTF-8 characters (Cyrillic, Uzbek, emojis).
 */
export async function safeStringToBase64Async(str: string): Promise<string> {
  if (!str) return "";

  // Use TextEncoder to get raw UTF-8 bytes
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);

  // Convert bytes to binary string in chunks so we never exceed max call stack or freeze the thread
  const chunkSize = 16384;
  let binaryString = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binaryString += String.fromCharCode(...chunk);

    // Yield control if the text is large
    if (i > 0 && i % YIELD_CHUNK_SIZE === 0) {
      await yieldToEventLoop();
    }
  }

  return btoa(binaryString);
}

/**
 * Decodes a base64 string to a UTF-8 string asynchronously and safely.
 * Handles UTF-8 encoded text properly without unescape/encodeURIComponent corruption.
 */
export async function safeBase64ToStringAsync(base64: string): Promise<string> {
  if (!base64) return "";

  // Strip any whitespace or line breaks
  const cleanBase64 = base64.trim().replace(/\s+/g, "");

  try {
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
      if (i > 0 && i % YIELD_CHUNK_SIZE === 0) {
        await yieldToEventLoop();
      }
    }

    const decoder = new TextDecoder("utf-8", { fatal: false });
    return decoder.decode(bytes);
  } catch (err) {
    console.warn("[fileEncoding] Standard decode failed, falling back:", err);
    try {
      return decodeURIComponent(escape(atob(cleanBase64)));
    } catch {
      return atob(cleanBase64);
    }
  }
}

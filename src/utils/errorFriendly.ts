export function classifyError(error: any): { type: string; friendlyMessage: string; code: string } {
  const errMsg = error?.message || String(error || "");
  const errMsgLower = errMsg.toLowerCase();
  const status = error?.status || error?.statusCode || 0;

  // 1. INVALID_API_KEY
  if (
    status === 400 && (errMsgLower.includes("api_key") || errMsgLower.includes("api key") || errMsgLower.includes("invalid")) ||
    errMsgLower.includes("api_key_invalid") ||
    errMsgLower.includes("api key not valid") ||
    errMsgLower.includes("gemini api kaliti xato") ||
    errMsgLower.includes("invalid api")
  ) {
    return {
      type: "invalid api key",
      friendlyMessage: "Tizimdagi yoki kiritilgan yuridik Gemini API tahlil kaliti noto'g'ri (Invalid API Key). Iltimos, kalitingizni tekshiring.",
      code: "INVALID_API_KEY"
    };
  }

  // 2. CONTEXT_OVERFLOW
  if (
    errMsgLower.includes("context window") ||
    errMsgLower.includes("context_length_exceeded") ||
    errMsgLower.includes("context limit") ||
    errMsgLower.includes("context length") ||
    errMsgLower.includes("too many tokens") ||
    errMsgLower.includes("token limit") ||
    errMsgLower.includes("maximum context length")
  ) {
    return {
      type: "context length exceeded",
      friendlyMessage: "Hujjatlar matn hajmi AI modelining bir martalik maksimal chekkasidan oshib ketdi (Context Window Overflow). Matnni maydalash yoki kichiklashtirish talab etiladi.",
      code: "CONTEXT_EXCEEDED"
    };
  }

  // 3. PAYLOAD_TOO_LARGE
  if (
    status === 413 ||
    errMsgLower.includes("413") ||
    errMsgLower.includes("payload too large") ||
    errMsgLower.includes("request too large") ||
    errMsgLower.includes("request payload size exceeds") ||
    errMsgLower.includes("body size limit") ||
    errMsgLower.includes("size exceeded") ||
    errMsgLower.includes("10485760 bytes") ||
    errMsgLower.includes("entity too large")
  ) {
    return {
      type: "request too large",
      friendlyMessage: "Yuborilgan fayllar yoki so'rovning umumiy hajmi ruxsat etilgan limitdan katta (Payload Too Large - 413). Iltimos, kichikroq hajmli yoki kamroq fayl yuklang.",
      code: "REQUEST_TOO_LARGE"
    };
  }

  // 4. AI_QUOTA_LIMIT (AI Quota limits / Rate limit / Too Many Requests)
  if (
    status === 429 ||
    errMsgLower.includes("429") ||
    errMsgLower.includes("quota_exceeded") ||
    errMsgLower.includes("resource_exhausted") ||
    errMsgLower.includes("resource exhausted") ||
    errMsgLower.includes("quota exceeded") ||
    (errMsgLower.includes("limit") && (errMsgLower.includes("quota") || errMsgLower.includes("rate") || errMsgLower.includes("request") || errMsgLower.includes("exhausted")))
  ) {
    return {
      type: "quota exceeded",
      friendlyMessage: "Kunlik yoki oylik bepul so'rovlar limiti yoki vaqtinchalik tezlik (rate) limiti tugagan (Gemini Quota Exceeded - 429).",
      code: "QUOTA_EXCEEDED"
    };
  }

  // 5. NETWORK_ERROR
  if (
    errMsgLower.includes("fetch failed") ||
    errMsgLower.includes("network error") ||
    errMsgLower.includes("failed to fetch") ||
    errMsgLower.includes("offline") ||
    errMsgLower.includes("dns") ||
    errMsgLower.includes("connreset") ||
    errMsgLower.includes("econnrefused")
  ) {
    return {
      type: "network error",
      friendlyMessage: "Tarmoq ulanish xatoligi yoki internet tarmoqqa bog'lana olmadi (Network Error).",
      code: "NETWORK_ERROR"
    };
  }

  // 6. SERVER_ERROR
  if (
    status >= 500 ||
    errMsgLower.includes("500") ||
    errMsgLower.includes("502") ||
    errMsgLower.includes("503") ||
    errMsgLower.includes("504") ||
    errMsgLower.includes("internal error") ||
    errMsgLower.includes("server error") ||
    errMsgLower.includes("unavailable") ||
    errMsgLower.includes("overloaded") ||
    errMsgLower.includes("high demand")
  ) {
    return {
      type: "server error",
      friendlyMessage: "Google Gemini serverlarida vaqtinchalik xatolik yoki yuqori yuklama mavjud (Internal Server Error - 503/500).",
      code: "SERVER_ERROR"
    };
  }

  return {
    type: "unknown error",
    friendlyMessage: error?.message || "Kutilmagan xatolik yuz berdi. Iltimos tahlilni boshqatdan urining.",
    code: "UNKNOWN"
  };
}

export function getFriendlyErrorMessage(error: any, lang: string = "uz_lat"): string {
  if (!error) return "Tizimda kutilmagan xatolik yuz berdi.";
  
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  
  const isNetwork = msg.includes("network") || msg.includes("fetch") || msg.includes("offline") || msg.includes("failed to fetch") || msg.includes("internet");
  const isAuth = msg.includes("auth") || msg.includes("unauthenticated") || msg.includes("permission-denied") || msg.includes("insufficient permissions") || msg.includes("expired") || msg.includes("login") || msg.includes("sign-in");
  const isAi = msg.includes("overloaded") || msg.includes("api_key") || msg.includes("quota") || msg.includes("limit") || msg.includes("gemini") || msg.includes("ai") || msg.includes("exhausted") || msg.includes("resource_exhausted") || msg.includes("context") || msg.includes("payload") || msg.includes("size");
  const isExport = msg.includes("pdf") || msg.includes("docx") || msg.includes("zip") || msg.includes("export");

  if (isAi) {
    const classified = classifyError(error);
    if (lang === "ru") {
      if (classified.code === "QUOTA_EXCEEDED") return "Превышена квота или лимит запросов ИИ (Quota Exceeded - 429). Попробуйте позже.";
      if (classified.code === "CONTEXT_EXCEEDED") return "Превышен размер контекстного окна ИИ (Context Window Overflow). Сократите текст.";
      if (classified.code === "REQUEST_TOO_LARGE") return "Запрос слишком большой по объёму (Payload Too Large - 413).";
      if (classified.code === "INVALID_API_KEY") return "Неверный ИИ API ключ (Invalid API Key).";
      return `Ошибка сервиса ИИ (${classified.type}): ${classified.friendlyMessage}`;
    }
    if (lang === "en") {
      if (classified.code === "QUOTA_EXCEEDED") return "AI limit or quota exceeded (429 Quota Exceeded). Please try again later.";
      if (classified.code === "CONTEXT_EXCEEDED") return "Context window exceeded too many tokens. Trim your text.";
      if (classified.code === "REQUEST_TOO_LARGE") return "Request payload size is too large (413 Payload Too Large).";
      if (classified.code === "INVALID_API_KEY") return "AI API key is invalid.";
      return `AI Service error (${classified.type}): ${classified.friendlyMessage}`;
    }
    // Default uzbek
    return classified.friendlyMessage;
  }

  if (lang === "ru") {
    if (isNetwork) return "Ошибка сети. Пожалуйста, проверьте ваше интернет-подключение.";
    if (isAuth) return "Срок действия сессии истек. Пожалуйста, войдите в систему заново.";
    if (isExport) return "Ошибка экспорта документа. Пожалуйста, попробуйте еще раз.";
    return "Произошла непредвиденная ошибка. Мы уже работаем над её устранением.";
  }
  
  if (lang === "en") {
    if (isNetwork) return "Network connection lost. Please check your internet connection.";
    if (isAuth) return "Authentication expired or session is invalid. Please sign in again.";
    if (isExport) return "Document export failed. Please try again.";
    return "An unexpected error occurred. Our team has been notified.";
  }

  // default uz_lat
  if (isNetwork) return "Tarmoq ulanishi yo'q yoki internet uzildi. Iltimos, aloqani tekshiring.";
  if (isAuth) return "Sessiyangiz muddati tugadi yoki profilga kirish muvaffaqiyatsiz bo'ldi. Iltimos, qayta kiring.";
  if (isExport) return "Hujjatni eksport qilish muvaffaqiyatsiz bo'ldi. Iltimos, qaytadan urinib ko'ring.";
  return "Kutilmagan texnik xatolik yuz berdi. Tizim jurnali yangilandi va mutaxassis ogohlantirildi.";
}

export function classifyError(error: any): { type: string; friendlyMessage: string; code: string } {
  const code = error?.code || error?.errorData?.code || error?.originalError?.code;
  const errMsg = error?.message || String(error || "");
  const errMsgLower = errMsg.toLowerCase();
  const status = error?.status || error?.statusCode || 0;

  // 1. Explicit backend error codes
  if (code === "SESSION_EXPIRED") {
    return {
      type: "session expired",
      friendlyMessage: "Sessiyangiz muddati tugagan. Iltimos, tizimga qayta kiring.",
      code: "SESSION_EXPIRED"
    };
  }

  if (code === "AUTH_REQUIRED") {
    return {
      type: "auth required",
      friendlyMessage: "Xizmatdan foydalanish uchun avtorizatsiya talab etiladi. Iltimos, tizimga kiring.",
      code: "AUTH_REQUIRED"
    };
  }

  if (code === "AI_CONFIGURATION_ERROR") {
    return {
      type: "ai configuration error",
      friendlyMessage: "Serverda AI konfiguratsiyasi sozlanmagan (GEMINI_API_KEY mavjud emas). Administratorga murojaat qiling.",
      code: "AI_CONFIGURATION_ERROR"
    };
  }

  if (code === "MODEL_NOT_AVAILABLE") {
    return {
      type: "model unavailable",
      friendlyMessage: "Tanlangan Gemini AI modeli hozirda mavjud emas yoki qo'llab-quvvatlanmaydi.",
      code: "MODEL_NOT_AVAILABLE"
    };
  }

  if (code === "PROVIDER_AUTH_ERROR" || errMsgLower.includes("gemini api kaliti xato") || errMsgLower.includes("api_key_invalid") || errMsgLower.includes("api key not valid")) {
    return {
      type: "provider auth error",
      friendlyMessage: "AI provayderi autentifikatsiyasida xatolik yuz berdi (GEMINI_API_KEY noto'g'ri). Kreditlaringiz qaytarildi.",
      code: "PROVIDER_AUTH_ERROR"
    };
  }

  if (code === "AI_CREDIT_LIMIT") {
    return {
      type: "credit limit",
      friendlyMessage: "Bugungi bepul AI limitingiz tugadi. AI kreditlaringiz ertaga yangilanadi.",
      code: "AI_CREDIT_LIMIT"
    };
  }

  if (code === "PROVIDER_RATE_LIMIT" || status === 429) {
    return {
      type: "rate limit",
      friendlyMessage: "AI serverlarida vaqtinchalik yuqori yuklama (Rate Limit). Kreditlaringiz qaytarildi, birozdan so'ng qayta urinib ko'ring.",
      code: "PROVIDER_RATE_LIMIT"
    };
  }

  if (code === "FIRESTORE_ERROR") {
    return {
      type: "database error",
      friendlyMessage: "Ma'lumotlar bazasi bilan aloqada xatolik yuz berdi. Kreditlaringiz qaytarildi.",
      code: "FIRESTORE_ERROR"
    };
  }

  // 2. CONTEXT_OVERFLOW
  if (
    code === "CONTEXT_OVERFLOW" ||
    code === "CONTEXT_EXCEEDED" ||
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
      friendlyMessage: "Hujjatlar yoki suhbat hajmi AI modelining bir martalik chegarasidan oshib ketdi. Yangi suhbat boshlash tavsiya etiladi.",
      code: "CONTEXT_OVERFLOW"
    };
  }

  // 3. PAYLOAD_TOO_LARGE
  if (
    code === "PAYLOAD_TOO_LARGE" ||
    code === "REQUEST_TOO_LARGE" ||
    status === 413 ||
    errMsgLower.includes("payload too large") ||
    errMsgLower.includes("request too large") ||
    errMsgLower.includes("request payload size exceeds") ||
    errMsgLower.includes("body size limit") ||
    errMsgLower.includes("size exceeded") ||
    errMsgLower.includes("entity too large")
  ) {
    return {
      type: "request too large",
      friendlyMessage: "Yuborilgan fayllar yoki so'rov hajmi ruxsat etilgan limitdan katta (Payload Too Large - 413). Kichikroq fayl yuklang.",
      code: "PAYLOAD_TOO_LARGE"
    };
  }

  // 4. NETWORK_ERROR
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
      friendlyMessage: "Tarmoq ulanishida uzilish bo'ldi. Iltimos, internet aloqasini tekshiring.",
      code: "NETWORK_ERROR"
    };
  }

  // 5. SERVER_ERROR
  if (
    code === "SERVER_ERROR" ||
    status >= 500 ||
    errMsgLower.includes("500") ||
    errMsgLower.includes("502") ||
    errMsgLower.includes("503") ||
    errMsgLower.includes("504") ||
    errMsgLower.includes("internal error") ||
    errMsgLower.includes("server error") ||
    errMsgLower.includes("unavailable") ||
    errMsgLower.includes("overloaded")
  ) {
    return {
      type: "server error",
      friendlyMessage: "AI serverida vaqtinchalik nosozlik yuz berdi. Kreditlaringiz hisobingizga qaytarildi.",
      code: "SERVER_ERROR"
    };
  }

  return {
    type: "unknown error",
    friendlyMessage: error?.message || "Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
    code: "UNKNOWN"
  };
}

export function getFriendlyErrorMessage(error: any, lang: string = "uz_lat"): string {
  if (!error) return "Tizimda kutilmagan xatolik yuz berdi.";
  
  const classified = classifyError(error);
  const code = classified.code;

  if (lang === "ru") {
    switch (code) {
      case "SESSION_EXPIRED":
        return "Срок действия вашей сессии истек. Пожалуйста, войдите снова.";
      case "AUTH_REQUIRED":
        return "Для использования сервиса требуется авторизация. Пожалуйста, войдите.";
      case "AI_CONFIGURATION_ERROR":
        return "На сервере не настроена конфигурация ИИ (отсутствует GEMINI_API_KEY). Обратитесь к администратору.";
      case "MODEL_NOT_AVAILABLE":
        return "Выбранная модель Gemini в настоящее время недоступна.";
      case "PROVIDER_AUTH_ERROR":
        return "Ошибка аутентификации у провайдера ИИ (неверный GEMINI_API_KEY). Ваши кредиты возвращены.";
      case "AI_CREDIT_LIMIT":
        return "Ваш дневной лимит ИИ кредитов исчерпан. Кредиты обновятся завтра.";
      case "PROVIDER_RATE_LIMIT":
        return "Временная перегрузка серверов ИИ (Rate Limit). Ваши кредиты возвращены, попробуйте чуть позже.";
      case "FIRESTORE_ERROR":
        return "Ошибка базы данных. Ваши кредиты возвращены.";
      case "CONTEXT_OVERFLOW":
        return "Превышен размер контекстного окна ИИ. Рекомендуется начать новый диалог.";
      case "PAYLOAD_TOO_LARGE":
        return "Запрос или файл слишком большой по объёму (Payload Too Large - 413).";
      case "NETWORK_ERROR":
        return "Ошибка сети. Пожалуйста, проверьте ваше интернет-подключение.";
      case "SERVER_ERROR":
        return "Временный сбой сервиса ИИ. Ваши кредиты возвращены на баланс.";
      default:
        return classified.friendlyMessage;
    }
  }

  if (lang === "en") {
    switch (code) {
      case "SESSION_EXPIRED":
        return "Your session has expired. Please sign in again.";
      case "AUTH_REQUIRED":
        return "Authentication required to use this service. Please sign in.";
      case "AI_CONFIGURATION_ERROR":
        return "Server AI configuration error (GEMINI_API_KEY is missing). Please contact administrator.";
      case "MODEL_NOT_AVAILABLE":
        return "The configured Gemini model is currently unavailable.";
      case "PROVIDER_AUTH_ERROR":
        return "AI provider authentication failed (invalid GEMINI_API_KEY). Credits refunded.";
      case "AI_CREDIT_LIMIT":
        return "Daily AI credit limit reached. Your credits will reset tomorrow.";
      case "PROVIDER_RATE_LIMIT":
        return "Temporary AI provider rate limit. Credits refunded, please try again shortly.";
      case "FIRESTORE_ERROR":
        return "Database persistence error occurred. Credits refunded.";
      case "CONTEXT_OVERFLOW":
        return "Context window limit exceeded. Starting a new chat is recommended.";
      case "PAYLOAD_TOO_LARGE":
        return "Request payload size is too large (413 Payload Too Large).";
      case "NETWORK_ERROR":
        return "Network connection lost. Please check your internet connection.";
      case "SERVER_ERROR":
        return "Temporary AI service error. Credits refunded to your account.";
      default:
        return classified.friendlyMessage;
    }
  }

  // Default uz_lat
  return classified.friendlyMessage;
}

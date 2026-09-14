import { useState, useEffect } from "react";
import { User as AuthUser } from "firebase/auth";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { User, Mail, CreditCard, Check, Loader2, Camera, Crown, Sparkles, Save, Globe, Zap, ShieldCheck, Cpu, AlertCircle, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import { getApiAuthorizationHeader } from "../services/apiAuth";

const AVATAR_PRESETS = [
  { id: "felix", name: "Felix", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" },
  { id: "aneka", name: "Aneka", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka" },
  { id: "jack", name: "Jack", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack" },
  { id: "liam", name: "Liam", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Liam" },
  { id: "sasha", name: "Sasha", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha" },
  { id: "sophia", name: "Sophia", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia" },
  { id: "milo", name: "Milo", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Milo" },
  { id: "zoe", name: "Zoe", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe" },
];

export function UserProfile({ user }: { user?: any }) {
  const { t, language, setLanguage } = useLanguage();
  const [currentUserData, setCurrentUserData] = useState<any>(user || null);
  const [loading, setLoading] = useState(!user);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || user?.photoUrl || "");
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro" | "business">(user?.subscriptionTier || "free");
  const [requestsToday, setRequestsToday] = useState(user?.requestsToday || 0);
  const [exportsToday, setExportsToday] = useState(user?.exportsToday || 0);
  const [aiCreditsRemaining, setAiCreditsRemaining] = useState<number>(user?.aiCreditsRemaining ?? 10);
  const [aiCreditsDailyLimit, setAiCreditsDailyLimit] = useState<number>(user?.aiCreditsDailyLimit ?? 10);
  const [aiCreditsUsedToday, setAiCreditsUsedToday] = useState<number>(user?.aiCreditsUsedToday ?? 0);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Clean up any legacy custom API key from localStorage automatically
  useEffect(() => {
    localStorage.removeItem("custom_gemini_api_key");
  }, []);

  // Real-time credit updates from custom event
  useEffect(() => {
    const handleCreditsUpdated = (e: any) => {
      if (e.detail) {
        if (typeof e.detail.creditsRemaining === "number") setAiCreditsRemaining(e.detail.creditsRemaining);
        if (typeof e.detail.creditsDailyLimit === "number") setAiCreditsDailyLimit(e.detail.creditsDailyLimit);
        if (typeof e.detail.creditsUsedToday === "number") setAiCreditsUsedToday(e.detail.creditsUsedToday);
      }
    };
    window.addEventListener("ai-credits-updated", handleCreditsUpdated);
    return () => window.removeEventListener("ai-credits-updated", handleCreditsUpdated);
  }, []);

  // Fetch credits status from server
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const headers = await getApiAuthorizationHeader();
        const res = await fetch("/api/ai/credits", { headers });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.creditsRemaining === "number") setAiCreditsRemaining(data.creditsRemaining);
          if (typeof data.creditsDailyLimit === "number") setAiCreditsDailyLimit(data.creditsDailyLimit);
          if (typeof data.creditsUsedToday === "number") setAiCreditsUsedToday(data.creditsUsedToday);
        }
      } catch (e) {}
    };
    fetchCredits();
  }, []);

  useEffect(() => {
    const targetUid = user?.uid || auth.currentUser?.uid;
    if (!targetUid) {
      setLoading(false);
      return;
    }
    const userDocRef = doc(db, "users", targetUid);
    console.log("[Firestore] listener attached: User Profile Page");
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCurrentUserData({ ...data, uid: targetUid });
        setDisplayName(data.displayName || "");
        setAvatarUrl(data.avatarUrl || data.photoUrl || "");
        setSubscriptionTier(data.subscriptionTier || "free");
        setRequestsToday(data.requestsToday || 0);
        setExportsToday(data.exportsToday || 0);
        if (typeof data.aiCreditsRemaining === "number") setAiCreditsRemaining(data.aiCreditsRemaining);
        if (typeof data.aiCreditsDailyLimit === "number") setAiCreditsDailyLimit(data.aiCreditsDailyLimit);
        if (typeof data.aiCreditsUsedToday === "number") setAiCreditsUsedToday(data.aiCreditsUsedToday);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error syncing user profile:", err);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      console.log("[Firestore] listener detached: User Profile Page");
    };
  }, [user?.uid, auth.currentUser?.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUid = user?.uid || currentUserData?.uid || auth.currentUser?.uid;
    if (!targetUid) return;

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const userDocRef = doc(db, "users", targetUid);
      await updateDoc(userDocRef, {
        displayName: displayName.trim(),
        avatarUrl,
        subscriptionTier,
        updatedAt: new Date().getTime()
      });

      setMessage({ type: "success", text: "Profil ma'lumotlari muvaffaqiyatli saqlandi!" });
    } catch (err: any) {
      console.error("Error updating user profile:", err);
      setMessage({ type: "error", text: "Xatolik yuz berdi: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">{t.profile.title}</h1>
            <p className="text-gray-500 dark:text-zinc-400 mt-1">{t.profile.subtitle}</p>
          </div>
        </div>

        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 mb-6 rounded-2xl border text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 dark:bg-emerald-950/20 border-green-200 dark:border-emerald-900/30 text-green-800 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-400"
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar side card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-6 w-full text-left">
              {language === 'uz_lat' ? 'Sizning Avataringiz' : language === 'uz_cyr' ? 'Сизнинг Аватарингиз' : language === 'ru' ? 'Ваш Аватар' : 'Your Avatar'}
            </h2>
            
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50/80 dark:border-zinc-800 bg-blue-50 dark:bg-zinc-800 flex items-center justify-center shadow-inner relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Current profile avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-16 h-16 text-blue-300" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="w-full mb-2">
              <p className="font-bold text-gray-900 dark:text-zinc-50 text-lg leading-snug">
                {displayName || (language === 'uz_lat' ? 'Foydalanuvchi' : language === 'uz_cyr' ? 'Фойдаланувчи' : language === 'ru' ? 'Пользователь' : 'User')}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <span>{currentUserData?.username ? `@${currentUserData.username}` : (currentUserData?.telegramId ? `Telegram ID: ${currentUserData.telegramId}` : (currentUserData?.email || "Telegram orqali tasdiqlangan"))}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 border border-blue-100 dark:border-zinc-700 rounded-full">
                {subscriptionTier === "business" ? (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-500 blue-500 shrink-0" />
                    <span className="text-xs font-bold bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                      {language === 'uz_lat' ? 'Business Obuna' : language === 'uz_cyr' ? 'Бизнес Обуна' : language === 'ru' ? 'Бизнес Подписка' : 'Business Subscription'}
                    </span>
                  </>
                ) : subscriptionTier === "pro" ? (
                  <>
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="text-xs font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      {language === 'uz_lat' ? 'Pro Obuna' : language === 'uz_cyr' ? 'Про Обуна' : language === 'ru' ? 'Про Подписка' : 'Pro Subscription'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                      {language === 'uz_lat' ? 'Bepul Obuna' : language === 'uz_cyr' ? 'Бепул Обуна' : language === 'ru' ? 'Бесплатная Подписка' : 'Free Subscription'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Settings main card */}
          <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-[24px] p-8 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50 border-b border-gray-100 dark:border-zinc-800 pb-3">
                {language === 'uz_lat' ? 'Profil Sozlamalari' : language === 'uz_cyr' ? 'Профил Созламалари' : language === 'ru' ? 'Настройки Профиля' : 'Profile Settings'}
              </h2>
              
              <div className="grid grid-cols-1 gap-6">
                {/* Full Name field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                    {language === 'uz_lat' ? 'Ism-sharifingiz' : language === 'uz_cyr' ? 'Исм-шарифингиз' : language === 'ru' ? 'Ваше имя' : 'Your Full name'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-zinc-500 text-sm font-medium field-focus-effect"
                      placeholder={language === 'uz_lat' ? 'Masalan: Eshmat Toshmatov' : language === 'uz_cyr' ? 'Масалан: Эшмат Тошматов' : language === 'ru' ? 'Например: Иван Иванов' : 'e.g. Eshmat Toshmatov'}
                    />
                  </div>
                </div>

                {/* Email Address - locked */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                    {language === 'uz_lat' ? 'Email manzilingiz' : language === 'uz_cyr' ? 'Email манзилингиз' : language === 'ru' ? 'Служебный Email' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      disabled
                      value={auth.currentUser?.email || ""}
                      className="w-full pl-11 pr-10 py-3 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 outline-none text-sm font-medium cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none" title={language === 'uz_lat' ? 'O\'zgartirib bo\'lmaydi' : language === 'uz_cyr' ? 'Ўзгартириб бўлмайди' : language === 'ru' ? 'Не подлежит изменению' : 'Locked email identity'}>
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Avatar selection grid */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                    {language === 'uz_lat' ? 'Avatar Tanlash' : language === 'uz_cyr' ? 'Аватар Танлаш' : language === 'ru' ? 'Выбор Аватара' : 'Choose Avatar Preset'}
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          className={`relative p-1 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 scale-105"
                              : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-10 h-10 object-contain rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white rounded-full p-0.5 border border-white">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Custom Avatar URL */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">
                      {language === 'uz_lat' ? 'Yoki profil rasmiga havola (URL)' : language === 'uz_cyr' ? 'Ёки профил расмига ҳавола (URL)' : language === 'ru' ? 'Или прямая ссылка на фото (URL)' : 'Or custom avatar web link (URL)'}
                    </label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Usage Statistics Telemetry */}
                <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                      {language === 'uz_lat' ? 'Bugungi Foydalanish Ko\'rsatkichlaringiz' : language === 'uz_cyr' ? 'Бугунги Фойдаланиш Кўрсаткичларингиз' : language === 'ru' ? 'Показатели использования за сегодня' : 'Your Usage Statistics Today'}
                    </h3>
                    <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
                      Toshkent vaqti (00:00 da yangilanadi)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
                          AI Kreditlar (Qoldiq)
                        </span>
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                      </div>
                      <span className="text-3xl font-black text-gray-900 dark:text-zinc-50">
                        {aiCreditsRemaining} <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">/ {aiCreditsDailyLimit} kredit</span>
                      </span>
                      <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${aiCreditsRemaining <= 2 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                          style={{ width: `${Math.min(100, Math.max(0, (aiCreditsRemaining / (aiCreditsDailyLimit || 10)) * 100))}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-2">
                        Bugun sarflangan: <span className="font-semibold text-gray-700 dark:text-zinc-300">{aiCreditsUsedToday} kredit</span>
                      </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
                          {language === 'uz_lat' ? 'Hujjat va Eksportlar (Bugun)' : language === 'uz_cyr' ? 'Ҳужжат ва Экспортлар (Бугун)' : language === 'ru' ? 'Документы и Экспорт (Сегодня)' : 'Documents & Exports (Today)'}
                        </span>
                        <Crown className="w-4 h-4 text-purple-500" />
                      </div>
                      <span className="text-3xl font-black text-gray-900 dark:text-zinc-50">
                        {exportsToday} <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">/ {subscriptionTier === "free" ? "3" : (language === 'uz_lat' ? 'Cheksiz' : language === 'uz_cyr' ? 'Чексиз' : language === 'ru' ? 'Безлимит' : 'Unlimited')}</span>
                      </span>
                      <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
                        <div 
                          className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${subscriptionTier === "free" ? Math.min(100, (exportsToday / 3) * 100) : 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-2">
                        Tarif: <span className="font-semibold uppercase text-blue-600 dark:text-blue-400">{subscriptionTier}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unified AI Gateway & Credit System Info Card (No API Key Required) */}
                <div className="p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="font-bold text-gray-900 dark:text-zinc-200 text-sm sm:text-base">
                        Markazlashgan Gemini AI Gateway
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full">
                      Faol & Bepul
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">
                    Dastyorchi barcha sun'iy intellekt so'rovlarini o'zining markazlashgan serverlari orqali amalga oshiradi. 
                    Foydalanuvchilardan shaxsiy Gemini API kalit kiritish yoki sozlash talab etilmaydi. 
                    Kreditlaringiz har kuni Toshkent vaqti bilan 00:00 da avtomatik tarzda to'ldiriladi.
                  </p>

                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                      Amallar bo'yicha kredit sarfi:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/60">
                        <span className="text-gray-700 dark:text-zinc-300">Yuridik maslahat</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">1 kr</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/60">
                        <span className="text-gray-700 dark:text-zinc-300">Mantiqiy xulosa</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">2 kr</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/60">
                        <span className="text-gray-700 dark:text-zinc-300">Hujjat yaratish</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">3 kr</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/60">
                        <span className="text-gray-700 dark:text-zinc-300">Fayl tahlili (PDF/Word)</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">4 kr</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/60">
                        <span className="text-gray-700 dark:text-zinc-300">Chuqur ekspertiza</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">5 kr</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/60">
                        <span className="text-gray-700 dark:text-zinc-300">Muvaffaqiyatsiz so'rov</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">Qaytariladi</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System/Interface Language Selector Setting */}
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-gray-900 dark:text-zinc-200 text-sm sm:text-base">
                      {language === 'uz_lat' ? 'Tizim interfeys tili' : language === 'uz_cyr' ? 'Тизим интерфейс тили' : language === 'ru' ? 'Язык интерфейса системы' : 'System Interface Language'}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed mb-4">
                    {language === 'uz_lat' ? 'Ilova interfeysi va barcha tugmalar, bo\'limlar kiritilgan tilga mos ravishda moslashadi.' : 
                     language === 'uz_cyr' ? 'Илова интерфейси ва барча тугмалар, бўлимлар киритилган тилга мос равишда мослашади.' : 
                     language === 'ru' ? 'Интерфейс приложения, кнопки и разделы адаптируются под выбранный язык.' : 
                     'The application interface, buttons and headings automatically adjust to the selected language.'}
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { code: 'uz_lat', label: '🇺🇿 O\'zbekcha' },
                      { code: 'uz_cyr', label: '🇺🇿 Ўзбекча' },
                      { code: 'ru', label: '🇷🇺 Русский' },
                      { code: 'en', label: '🇺🇸 English' }
                    ].map((langOption) => {
                      const isActive = language === langOption.code;
                      return (
                        <button
                          key={langOption.code}
                          type="button"
                          onClick={() => setLanguage(langOption.code as any)}
                          className={`px-3 py-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                            isActive
                              ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400 font-extrabold shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          {langOption.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subscription Tier toggle panel */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3 block">
                    {language === 'uz_lat' ? 'Obuna darajasi (Subscription)' : language === 'uz_cyr' ? 'Обуна даражаси (Subscription)' : language === 'ru' ? 'Тарифный план подписки' : 'Membership Subscription Tier'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Free Option */}
                    <button
                      type="button"
                      onClick={() => setSubscriptionTier("free")}
                      className={`p-4 rounded-xl border text-left transition-all bg-white dark:bg-zinc-900 relative flex flex-col justify-between ${
                        subscriptionTier === "free"
                          ? "border-blue-600 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm"
                          : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-gray-900 dark:text-zinc-100 text-sm sm:text-base">
                            {language === 'uz_lat' ? 'Bepul (Free)' : language === 'uz_cyr' ? 'Бепул (Free)' : language === 'ru' ? 'Бесплатный' : 'Free Tier'}
                          </p>
                          {subscriptionTier === "free" && (
                            <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                          {language === 'uz_lat' ? 'Kuniga 10 ta bepul AI so\'rov, 3 ta eksport' : 
                           language === 'uz_cyr' ? 'Кунига 10 та бепул AI сўров, 3 та экспорт' : 
                           language === 'ru' ? '10 бесплатных запросов и 3 экспорта в сутки' : 
                           '10 daily queries, 3 document exports'}
                        </p>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-extrabold text-gray-800 dark:text-zinc-200">$0 <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">
                          {language === 'uz_lat' ? '/oylik' : language === 'uz_cyr' ? '/ойлик' : language === 'ru' ? '/месяц' : '/month'}
                        </span></p>
                      </div>
                    </button>

                    {/* Pro Option */}
                    <button
                      type="button"
                      onClick={() => setSubscriptionTier("pro")}
                      className={`p-4 rounded-xl border text-left transition-all bg-white dark:bg-zinc-900 relative overflow-hidden flex flex-col justify-between ${
                        subscriptionTier === "pro"
                          ? "border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm ring-1 ring-amber-500"
                          : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="absolute right-0 top-0 bg-amber-500 text-white px-2 py-0.5 rounded-bl text-[8px] font-extrabold tracking-wider uppercase flex items-center gap-0.5 shadow-sm">
                        <Crown className="w-2.5 h-2.5 fill-white text-white" /> POPULAR
                      </div>
                      <div>
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-gray-900 dark:text-zinc-100 text-sm sm:text-base">Pro Plan</p>
                          {subscriptionTier === "pro" && (
                            <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                          {language === 'uz_lat' ? 'Cheksiz so\'rovlar va eksport, Tahlil, Strategiya' : 
                           language === 'uz_cyr' ? 'Чексиз сўровлар ва экспорт, Таҳлил, Стратегия' : 
                           language === 'ru' ? 'Безлимитные опции, Аналитика, Стратегия и Планы' : 
                           'Unlimited queries, exports, analysis and strategy plans'}
                        </p>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-extrabold text-amber-700 dark:text-amber-400">$19.99 <span className="text-xs font-normal text-gray-500 dark:text-zinc-500">
                          {language === 'uz_lat' ? '/oylik' : language === 'uz_cyr' ? '/ойлик' : language === 'ru' ? '/месяц' : '/month'}
                        </span></p>
                      </div>
                    </button>

                    {/* Business Option */}
                    <button
                      type="button"
                      onClick={() => setSubscriptionTier("business")}
                      className={`p-4 rounded-xl border text-left transition-all bg-white dark:bg-zinc-900 relative overflow-hidden flex flex-col justify-between ${
                        subscriptionTier === "business"
                          ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-sm ring-1 ring-indigo-600"
                          : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="absolute right-0 top-0 bg-indigo-600 text-white px-2 py-0.5 rounded-bl text-[8px] font-extrabold tracking-wider uppercase flex items-center gap-0.5 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5 fill-white text-white" /> BIZ
                      </div>
                      <div>
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-gray-900 dark:text-zinc-100 text-sm sm:text-base">Business</p>
                          {subscriptionTier === "business" && (
                            <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                          {language === 'uz_lat' ? 'Pro + Ustuvorlik, Kengaytirilgan chuqur tahlil' : 
                           language === 'uz_cyr' ? 'Pro + Устуворлик, Кенгайтирилган чуқур таҳлил' : 
                           language === 'ru' ? 'Pro + Выделенный приоритет, Расширенный аудит' : 
                           'Pro benefits + High Priority, Deep audit of cases'}
                        </p>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-400">$49.99 <span className="text-xs font-normal text-gray-500 dark:text-zinc-500">
                          {language === 'uz_lat' ? '/oylik' : language === 'uz_cyr' ? '/ойлик' : language === 'ru' ? '/месяц' : '/month'}
                        </span></p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white text-sm font-bold tracking-wide rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {language === 'uz_lat' ? 'Saqlanmoqda...' : language === 'uz_cyr' ? 'Сақланмоқда...' : language === 'ru' ? 'Сохранение...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {language === 'uz_lat' ? 'Ma\'lumotlarni saqlash' : language === 'uz_cyr' ? 'Маълумотларни сақлаш' : language === 'ru' ? 'Сохранить профиль' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

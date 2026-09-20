import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  X, Check, Sparkles, Crown, CreditCard, ShieldCheck, 
  Loader2, CheckCircle, Smartphone, Landmark, AlertCircle, Award
} from "lucide-react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getPlanLimits, PlanLimits, DEFAULT_PLAN_LIMITS } from "../services/subscriptionService";
import { getApiAuthorizationHeader } from "../services/apiAuth";

type PaywallVariant = "requests" | "exports" | "advanced" | "general";

interface PaywallContextType {
  openPaywall: (variant?: PaywallVariant) => void;
  closePaywall: () => void;
  isPaywallOpen: boolean;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export function usePaywall() {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error("usePaywall must be used within a PaywallProvider");
  }
  return context;
}

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState<PaywallVariant>("general");
  const [selectedTier, setSelectedTier] = useState<"pro" | "business">("pro");
  const [checkoutStep, setCheckoutStep] = useState<"plans" | "payment" | "success">("plans");
  const [paymentMethod, setPaymentMethod] = useState<"click" | "payme" | "manual">("payme");
  
  // Payment Form State
  const [cardHolder, setCardHolder] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const [limits, setLimits] = useState<PlanLimits>(DEFAULT_PLAN_LIMITS);

  const handleDirectCheckout = async () => {
    if (!auth.currentUser) {
      alert("Iltimos, to'ldirish yoki obunani yangilash uchun avval tizimga kiring.");
      return;
    }
    setIsRedirecting(true);
    try {
      const authHeaders = await getApiAuthorizationHeader();
      const resp = await fetch("/api/payment/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({
          tier: selectedTier,
          paymentMethod: paymentMethod, // click or payme
          returnUrl: window.location.href
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data.checkoutUrl) {
         throw new Error(data.error || "Server redirect URL construction failed.");
      }
      // Real transaction checkout redirect
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("Redirection failure: ", err);
      alert("To'lov yo'naltirishda xatolik yuz berdi: " + (err.message || err));
    } finally {
      setIsRedirecting(false);
    }
  };

  useEffect(() => {
    getPlanLimits().then(setLimits).catch(console.error);
  }, [isOpen]);

  const openPaywall = (v: PaywallVariant = "general") => {
    setVariant(v);
    setCheckoutStep("plans");
    setIsOpen(true);
  };

  const closePaywall = () => {
    setIsOpen(false);
  };

  const handleSelectPlan = (tier: "pro" | "business") => {
    setSelectedTier(tier);
    setPhoneNumber(auth.currentUser?.phoneNumber || "");
    setCheckoutStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSubmitting(true);

    try {
      const amount = selectedTier === "pro" ? 19.99 : 49.99;
      const formattedAmount = selectedTier === "pro" ? "250,000 UZS (approx $19.99)" : "630,000 UZS (approx $49.99)";
      
      // Add manual payment request for Admin approval
      await addDoc(collection(db, "paymentRequests"), {
        userId: auth.currentUser.uid,
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || "anon@example.com",
        displayName: auth.currentUser.displayName || "Foydalanuvchi",
        tier: selectedTier,
        amount,
        formattedAmount,
        provider: paymentMethod,
        cardHolder: cardHolder || "Belgilanmagan",
        phoneNumber: phoneNumber || "Kiritilmagan",
        receiptNote: receiptNote || "Izohsiz",
        status: "pending",
        createdAt: serverTimestamp()
      });

      setCheckoutStep("success");
    } catch (err) {
      console.error("Payment registration failed:", err);
      alert("Xatolik: to'lov so'rovini yuborib bo'lmadi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PaywallContext.Provider value={{ openPaywall, closePaywall, isPaywallOpen: isOpen }}>
      {children}

      {/* MODAL VIEW */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn" id="paywall-overlay">
          <div className="bg-white text-gray-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row relative">
            
            {/* Close Trigger Button */}
            <button 
              onClick={closePaywall}
              className="absolute right-4 top-4 z-50 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all"
              id="close-paywall-modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Accent Graphic Feature Info (ChatGPT dark slate style) */}
            <div className="bg-slate-900 text-white p-8 md:w-5/12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-600 p-2 rounded-xl text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold tracking-wider uppercase text-blue-400">Premium Avfzalliklar</span>
                </div>
                
                <h3 className="text-2xl font-black leading-tight tracking-tight text-white mb-6">
                  {variant === "requests" && "Kunlik AI so'rovlar limitiga yetdingiz"}
                  {variant === "exports" && "Kunlik yuklab olish limitiga yetdingiz"}
                  {variant === "advanced" && "Kengaytirilgan tahlillar faqat faol obunachilarda"}
                  {variant === "general" && "Professional huquqiy tahlillarni oching"}
                </h3>

                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  Platformamizning sun'iy intellekt modeli sizga har qanday shartnomalar tahlili, huquqiy maslahatlar va strategiyallarni professional darajada tayyorlab beradi.
                </p>

                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Cheksiz AI So'rovlar</p>
                      <p className="text-[10px] text-slate-400">Kutmasdan istalgancha shartnomalarni tahlil qilish imkoniyati</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Cheksiz Word/PDF yuklab olishlar</p>
                      <p className="text-[10px] text-slate-400">Eksport yuklash limitlarisiz barcha hujjat nusxalari</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Risklarni Baholash & Strategiyalar</p>
                      <p className="text-[10px] text-slate-400">Biznesingizni xavf ostiga qo'yuvchi chalkash bandlarni ko'rish</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Biznes & Ustuvorlik Rejimi</p>
                      <p className="text-[10px] text-slate-400">Tezkor generatsiyalar va chuqurlashtirilgan yuridik ko'riklar</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-blue-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-300">XAVFSIZ TO'LOV TIZIMI</p>
                  <p className="text-[9px] text-slate-500">Barcha to'lovlar manual tekshiruv va daxlsizlik kafolati ostida amalga ohiriladi.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interaction Workflows */}
            <div className="p-8 md:w-7/12 flex flex-col justify-center bg-gray-50/50 min-h-[480px]">
              
              {/* SCREEN 1: THE SUBSCRIPTION PLANS SELECTOR */}
              {checkoutStep === "plans" && (
                <div className="animate-fadeIn">
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-1">Muvofiq tarifni tanlang</h2>
                  <p className="text-xs text-gray-500 mb-6">Ushbu so'rovlarni davom ettirish va to'liq ochish uchun tarifingizni yangilang.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pro Plan Box */}
                    <div className="bg-white p-5 rounded-2xl border border-amber-300 relative shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div className="absolute right-3 top-3 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                        <Crown className="w-2.5 h-2.5 fill-white" /> POPULAR
                      </div>
                      <div>
                        <h4 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                          Pro Premium
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-1 lines-clamp-2">
                          Bepul so'rovlar chegarasini yengib o'ting, qulay tahlillarga ega bo'ling.
                        </p>
                        
                        <ul className="mt-4 space-y-2 text-[11px] text-gray-600 font-medium">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Cheksiz AI so'rovi
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Cheksiz Word/PDF eksport
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Risklar va yo'llanmalar tahlili
                          </li>
                        </ul>
                      </div>

                      <div className="mt-6 border-t border-gray-100 pt-4">
                        <p className="text-sm font-black text-gray-900">
                          19.99 USD <span className="text-[10px] text-gray-400 font-normal">/ bir oylik</span>
                        </p>
                        <button 
                          onClick={() => handleSelectPlan("pro")}
                          className="w-full mt-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-1"
                        >
                          Pro Plan-ga Yangilash
                        </button>
                      </div>
                    </div>

                    {/* Business Plan Box */}
                    <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div className="absolute right-3 top-3 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5" /> BIZNES
                      </div>
                      <div>
                        <h4 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                          Business Plan
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Yuridik shaxslar va tadbirkorlar uchun eng kuchli va kengaytirilgan tahlil.
                        </p>
                        
                        <ul className="mt-4 space-y-2 text-[11px] text-gray-600 font-medium">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Hammasi cheksiz + eng tezkor
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Kengaytirilgan Biznes rejimi
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Ustuvor yuridik ko'rik so'rovi
                          </li>
                        </ul>
                      </div>

                      <div className="mt-6 border-t border-gray-100 pt-4">
                        <p className="text-sm font-black text-gray-900">
                          49.99 USD <span className="text-[10px] text-gray-400 font-normal">/ bir oylik</span>
                        </p>
                        <button 
                          onClick={() => handleSelectPlan("business")}
                          className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1"
                        >
                          Business-ga Yangilash
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <button 
                      onClick={closePaywall}
                      className="text-gray-400 hover:text-gray-600 text-[11px] font-semibold underline"
                    >
                      Keyinroq yangilash, hozircha bepul darajada qolish
                    </button>
                  </div>
                </div>
              )}

              {/* SCREEN 2: PAYMENT METHOD AND MANUAL RECEIPT SUBMISSION */}
              {checkoutStep === "payment" && (
                <div className="animate-fadeIn">
                  <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                    <button 
                      onClick={() => setCheckoutStep("plans")}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      ← Tariflarni O'zgartirish
                    </button>
                    <span className="text-gray-300 text-xs">|</span>
                    <span className="text-xs font-bold text-gray-500">Tarif: {selectedTier === "pro" ? "Pro Premium" : "Business Enterprise"}</span>
                  </div>

                  <h2 className="text-lg font-extrabold text-gray-900">To'lov Usulini Tanlang</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5 mb-4">Integratsiya tayyorlangan Click, Payme va Bank o'tkazmalari manual tasdiqlash rejimida ishlamoqda.</p>

                  {/* Provider Selection */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("payme")}
                      className={`py-3 px-2 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'payme' ? 'border-teal-500 bg-teal-50/20 shadow-xs' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <Smartphone className={`w-5 h-5 ${paymentMethod === 'payme' ? 'text-teal-600' : 'text-gray-400'}`} />
                      <span className="text-[10px] font-black tracking-wide text-teal-800">PAYME</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("click")}
                      className={`py-3 px-2 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'click' ? 'border-sky-500 bg-sky-50/20 shadow-xs' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <Smartphone className={`w-5 h-5 ${paymentMethod === 'click' ? 'text-sky-600' : 'text-gray-400'}`} />
                      <span className="text-[10px] font-black tracking-wide text-sky-800">CLICK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("manual")}
                      className={`py-3 px-2 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'manual' ? 'border-indigo-500 bg-indigo-50/20 shadow-xs' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <Landmark className={`w-5 h-5 ${paymentMethod === 'manual' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className="text-[10px] font-black tracking-wide text-indigo-800">KARTA / BANK</span>
                    </button>
                  </div>

                  {/* Details based on selection */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-[11px] text-gray-600 space-y-2 mb-4">
                    {paymentMethod === "payme" && (
                      <>
                        <p className="font-extrabold text-teal-800 uppercase tracking-wider">Payme To'lov Qabul Qilish</p>
                        <p>Bizning Payme hisobimiz: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-100 font-bold">+998 90 123 45 67</span></p>
                        <p>Iltimos, ilovada ko'rsatilgan summani o'tkazib, quyidagi shaklni to'ldiring. Admin 5-10 daqiqa ichida faollashtiradi.</p>
                      </>
                    )}
                    {paymentMethod === "click" && (
                      <>
                        <p className="font-extrabold text-sky-800 uppercase tracking-wider">Click To'lov Qabul Qilish</p>
                        <p>Bizning Click hamyonimiz: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-100 font-bold">+998 90 987 65 43</span></p>
                        <p>To'lovni amalga oshirgach, o'tkazma raqamini / ismingizni yozing!</p>
                      </>
                    )}
                    {paymentMethod === "manual" && (
                      <>
                        <p className="font-extrabold text-indigo-800 uppercase tracking-wider">Manual Bank O'tkazmasi / Karta</p>
                        <p>Uzcard: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-100 font-bold">8600 1204 5678 9012</span> (U. A.)</p>
                        <p>Karta orqali pul o'tkazgach, tasdiqlovchi dalilni/karta egasini kiritib jo'natishingiz so'raladi.</p>
                      </>
                    )}
                  </div>

                  {/* Submission and Gateway Forms */}
                  {paymentMethod === "manual" ? (
                    <form onSubmit={handlePaymentSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Karta Egasi yoki F.I.Sh</label>
                          <input
                            type="text"
                            required
                            placeholder="Masalan, Alisher Umarov"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full text-xs px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Telefon Raqamingiz</label>
                          <input
                            type="text"
                            required
                            placeholder="+998 90 123 45 67"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full text-xs px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">To'lov Izohi / Chek Kodu / Vaqti</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Chek raqami, tranzaksiya IDsi yoki pul yuborilgan marta va sana"
                          value={receiptNote}
                          onChange={(e) => setReceiptNote(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md shadow-blue-600/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                        Tasdiqlash So'rovini Yuborish (Submit Approval Request)
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4 pt-1">
                      <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5 animate-bounce" />
                        <p className="text-[10px] text-sky-900 leading-relaxed font-medium">
                          Siz real vaqt rejimida <b>{selectedTier === "pro" ? "Pro Premium (250,000 UZS)" : "Business Enterprise (630,000 UZS)"}</b> tarifiga to'lov qilish arafasidasiz. Tugmani bosgandan so'ng xavfsiz to'lov sahifasiga yo'naltirilasiz. Muvaffaqiyatli to'lovdan so'ng hisobingiz darhol faollashadi.
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleDirectCheckout}
                        disabled={isRedirecting}
                        className={`w-full py-3.5 text-white font-black text-xs tracking-wider uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${paymentMethod === 'payme' ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/10' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/10'}`}
                      >
                        {isRedirecting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Xavfsiz to'lovga yo'naltirilmoqda...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            {paymentMethod === 'payme' ? "Payme orqali to'lov qilish" : "Click orqali to'lov qilish"}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SCREEN 3: SUCCESS CONFIRMATION STATE */}
              {checkoutStep === "success" && (
                <div className="text-center space-y-4 animate-scaleUp">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">To'lov muvaffaqiyatli topshirildi!</h2>
                    <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                      Sizning {selectedTier === "pro" ? "Pro Premium" : "Business Enterprise"} tarifiga o'tish so'rovingiz tizimga ro'yxatdan o'tkazildi. Ma'murlarimiz to'lovni tasdiqlashlari bilan profilingiz avtomatik faollashadi.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-[11px] text-gray-600 max-w-sm mx-auto">
                    Arizangiz holatini profilingizdagi <span className="font-bold">Obuna</span> bo'limi yoki admin roziligi orqali tekshirishingiz mumkin. Katta rahmat!
                  </div>

                  <button
                    onClick={closePaywall}
                    className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Oynani yopish (Close Modal)
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </PaywallContext.Provider>
  );
}

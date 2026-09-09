import { useState } from "react";
import { Link } from "react-router-dom";
import { Scale, FileText, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { TemplateSelector } from "../components/TemplateSelector";

export function Landing() {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  return (
    <div className="bg-white">
      <TemplateSelector isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} />
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white -z-10 hero-gradient-fallback" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                <span>AI yordamida huquqiy hujjatlar</span>
              </div>
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                <span className="block">Sud hujjatlarini</span>
                <span className="block text-blue-600">daqiqalarda tayyorlang</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 sm:text-xl">
                O'zbekiston qonunchiligiga mos keladigan da'vo arizalarini advokatsiz, 
                AI yordamida avtomatik tarzda yarating. Qulay, tez va ishonchli.
              </p>
              <div className="mt-10 sm:flex sm:justify-center lg:justify-start gap-4">
                <button
                  onClick={() => setIsSelectorOpen(true)}
                  className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 md:text-lg transition-all shadow-lg hover:shadow-xl shadow-lg-fallback"
                >
                  Hujjat yaratish
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <Link
                  to="/login"
                  className="inline-flex items-center px-8 py-4 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 md:text-lg transition-all shadow-sm"
                >
                  Tizimga kirish
                </Link>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
            >
              <div className="relative mx-auto w-full rounded-2xl shadow-2xl overflow-hidden bg-white border border-gray-100 shadow-2xl-fallback">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-4 h-4 w-48 bg-gray-200 rounded" />
                </div>
                <div className="p-8 space-y-4">
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded" />
                  <div className="h-32 w-full bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-12 h-12 text-blue-200" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-100 rounded" />
                    <div className="h-4 w-full bg-gray-100 rounded" />
                    <div className="h-4 w-2/3 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Xususiyatlar</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Nega aynan Dastyorchi.uz?
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "AI Huquqiy Layer",
                description: "Sun'iy intellekt siz kiritgan ma'lumotlarni rasmiy huquqiy tilga o'giradi.",
                icon: Zap,
              },
              {
                title: "Qonuniy Asoslar",
                description: "Hujjatlar O'zbekiston Respublikasining amaldagi qonunchiligiga to'liq mos keladi.",
                icon: ShieldCheck,
              },
              {
                title: "Tezkor Generatsiya",
                description: "Advokat qabulini kutish shart emas. Hujjat bir necha soniyada tayyor.",
                icon: FileText,
              },
            ].map((feature, idx) => (
              <div key={idx} className="relative p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow shadow-sm-fallback">
                <div className="p-3 bg-blue-50 rounded-xl w-fit mb-6">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Types Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Hujjatlar</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Qanday hujjatlarni tayyorlash mumkin?
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Qarzni undirish haqida da'vo ariza",
              "Aliment undirish haqida ariza",
              "To'lanmagan ish haqini undirish",
              "Mulk nizolari bo'yicha ariza",
              "Shartnoma nizolari",
              "Sudga fuqarolik shikoyati",
            ].map((doc, idx) => (
              <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Narxlar</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Sizga mos rejani tanlang
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Bepul",
                price: "0",
                features: ["1 ta hujjat/oy", "PDF yuklab olish", "Standart AI"],
                cta: "Boshlash",
                popular: false,
              },
              {
                name: "Professional",
                price: "49,000",
                features: ["Cheksiz hujjatlar", "PDF & DOCX", "Premium AI", "Arxiv saqlash"],
                cta: "Sotib olish",
                popular: true,
              },
              {
                name: "Yuridik shaxslar",
                price: "199,000",
                features: ["Ko'p foydalanuvchi", "API kirish", "Maxsus shablonlar", "24/7 yordam"],
                cta: "Bog'lanish",
                popular: false,
              },
            ].map((plan, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "relative p-8 bg-white rounded-3xl border transition-all",
                  plan.popular ? "border-blue-500 shadow-xl scale-105 z-10" : "border-gray-100 shadow-sm hover:shadow-md"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    Ommabop
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-sm">so'm / oy</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={cn(
                    "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center",
                    plan.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <Scale className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-white tracking-tight">Dastyorchi.uz</span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; 2026 Dastyorchi.uz - Legal Document Generator. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </footer>
    </div>
  );
}

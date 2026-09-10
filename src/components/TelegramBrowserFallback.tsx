import React from "react";
import { Scale, Send, ShieldCheck, Sparkles, Terminal, ArrowRight, Loader2, AlertTriangle } from "lucide-react";

interface TelegramBrowserFallbackProps {
  onDevLogin?: () => Promise<void>;
  devLoading?: boolean;
  errorMessage?: string;
  isNotMiniApp?: boolean;
}

export function TelegramBrowserFallback({ onDevLogin, devLoading, errorMessage, isNotMiniApp }: TelegramBrowserFallbackProps) {
  const isDev = Boolean(import.meta.env?.DEV);
  const botUsername = "dastyorchi_bot"; // Configurable bot handle
  const telegramBotUrl = `https://t.me/${botUsername}`;

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Liquid Glass Card */}
        <div 
          style={{
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
          className="bg-white/80 dark:bg-[#141418]/80 border border-white/80 dark:border-white/10 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.04)] text-center transition-all"
        >
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25 mb-6">
            {isNotMiniApp ? (
              <AlertTriangle className="w-10 h-10 stroke-[2.2] text-amber-300" />
            ) : (
              <Scale className="w-10 h-10 stroke-[2.2]" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
            {isNotMiniApp ? "Mini App Telegram WebApp sifatida ishga tushirilmagan" : "Dastyorchi Telegram orqali ishlaydi"}
          </h1>

          <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed mb-6 font-normal">
            {isNotMiniApp
              ? "Ushbu sahifa Telegram ichki brauzerida oddiy havola orqali ochilgan. Telegram xavfsiz avtorizatsiyasi va foydalanuvchi hisobiga kirish uchun ilovani rasmiy botimizdagi Mini App (menyu tugmasi) orqali oching."
              : "Ushbu xizmat Telegram WebApp platformasi uchun maxsus ishlab chiqilgan. Shaxsiy yuridik AI yordamchi va hujjatlar generatoridan foydalanish uchun rasmiy Telegram botimiz orqali kiring."}
          </p>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs text-left">
              {errorMessage}
            </div>
          )}

          {/* Primary Action Button */}
          <a
            href={telegramBotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer mb-4"
          >
            <Send className="w-5 h-5" />
            <span>Telegram botda ochish</span>
            <ArrowRight className="w-4 h-4 ml-0.5 opacity-80" />
          </a>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/70 dark:bg-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[11px] font-medium text-gray-600 dark:text-zinc-300">Xavfsiz identifikatsiya</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/70 dark:bg-white/5">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-[11px] font-medium text-gray-600 dark:text-zinc-300">Tezkor AI yurist</span>
            </div>
          </div>

          {/* Development mode test bypass (strictly stripped / hidden in production) */}
          {isDev && onDevLogin && (
            <div className="mt-6 pt-4 border-t border-dashed border-amber-300 dark:border-amber-900/50 text-left">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>Rivojlantirish rejimi (Development Mode)</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 mb-3">
                Browser iframe sinovi uchun test hisobi orqali to'g'ridan-to'g'ri kirishingiz mumkin. Bu panel faqat ishlab chiqish muhitida ko'rinadi.
              </p>
              <button
                type="button"
                onClick={onDevLogin}
                disabled={devLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-[0.98] text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-400/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {devLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Kirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <span>Test hisobi bilan kirish (Dev Bypass)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400 dark:text-zinc-600 mt-6">
          Dastyorchi.uz &bull; O'zbekiston Respublikasi qonunchiligi asosida
        </p>
      </div>
    </div>
  );
}

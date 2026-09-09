import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { Language } from "../types";
import { translations, TranslationSchema } from "../translations";

interface LanguageContextProps {
  language: Language;
  t: TranslationSchema;
  direction: "ltr" | "rtl";
  setLanguage: (lang: Language) => Promise<void>;
  formatDate: (date: Date | number | string) => string;
  formatNumber: (num: number) => string;
  formatCurrency: (num: number) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Try to default to localStorage language, otherwise 'uz_lat'
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("preferred_language") as Language;
    return saved && ["uz_lat", "uz_cyr", "ru", "en"].includes(saved) ? saved : "uz_lat";
  });

  const [t, setT] = useState<TranslationSchema>(() => translations[language] || translations.uz_lat);

  // Update localized dictionary immediately on language state change
  useEffect(() => {
    setT(translations[language] || translations.uz_lat);
  }, [language]);

  // Read saved language preference from Firestore when user logs in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.language && ["uz_lat", "uz_cyr", "ru", "en"].includes(data.language)) {
              setLanguageState(data.language as Language);
              localStorage.setItem("preferred_language", data.language);
            }
          }
        } catch (err) {
          console.error("[i18n] Error syncing language from Firestore profile:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem("preferred_language", newLang);

    // Save preference to signed-in user's profile in Firestore
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { language: newLang });
      } catch (err) {
        console.error("[i18n] Failed to save language choice in remote Firestore user profile:", err);
      }
    }
  };

  // Human-friendly localized date & time formatter
  const formatDate = (dateInput: Date | number | string) => {
    if (!dateInput) return "";
    let dateObj: Date;
    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (typeof dateInput === "number") {
      dateObj = new Date(dateInput);
    } else {
      dateObj = new Date(dateInput);
    }

    if (isNaN(dateObj.getTime())) return "";

    const localeMap: Record<Language, string> = {
      uz_lat: "uz-UZ",
      uz_cyr: "uz-UZ-u-nu-latn", // ensure cyrillic numbers are standard
      ru: "ru-RU",
      en: "en-US",
    };

    return dateObj.toLocaleDateString(localeMap[language], {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Clean localized number formatter
  const formatNumber = (num: number) => {
    if (num === null || num === undefined) return "0";
    const localeMap: Record<Language, string> = {
      uz_lat: "uz-UZ",
      uz_cyr: "uz-UZ",
      ru: "ru-RU",
      en: "en-US",
    };
    return new Intl.NumberFormat(localeMap[language]).format(num);
  };

  // Localized currency representation
  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined) return "0 UZS";
    
    // Choose professional currency based on language
    if (language === "en") {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount / 12500); // quick conversion rate or format
    } else if (language === "ru") {
      return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(amount / 140);
    } else {
      return new Intl.NumberFormat("uz-UZ").format(amount) + " UZS";
    }
  };

  // Determine standard RTL layout status (Uzbek, Russian, English are LTR)
  // Ready to support right-to-left directions seamlessly format future extensions
  const direction = "ltr";

  return (
    <LanguageContext.Provider
      value={{
        language,
        t,
        direction,
        setLanguage,
        formatDate,
        formatNumber,
        formatCurrency,
      }}
    >
      <div dir={direction} className="w-full h-full">
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

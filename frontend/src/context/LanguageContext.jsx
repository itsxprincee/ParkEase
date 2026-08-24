import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧", region: "Default" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳", region: "National" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳", region: "Maharashtra" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳", region: "Gujarat" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳", region: "Tamil Nadu" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳", region: "Andhra / Telangana" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳", region: "West Bengal" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳", region: "Karnataka" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳", region: "Kerala" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳", region: "Punjab" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", flag: "🇮🇳", region: "Odisha" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇮🇳", region: "National" },
  { code: "as", name: "Assamese", native: "অসমীया", flag: "🇮🇳", region: "Assam" },
];

export function LanguageProvider({ children }) {
  // Default is strictly English ('en') unless explicitly changed by user in localStorage
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem("parkease_lang");
      if (saved && saved !== "en" && LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return "en";
  });

  const applyGlobalTranslation = useCallback((langCode) => {
    try {
      if (langCode === "en") {
        // Clear any previous translation cookies
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/;`;
        document.documentElement.lang = "en";

        const combo = document.querySelector(".goog-te-combo");
        if (combo && combo.value !== "en") {
          combo.value = "en";
          combo.dispatchEvent(new Event("change"));
        }
        return;
      }

      // If user selected an Indian language
      const targetCode = `/en/${langCode}`;
      document.cookie = `googtrans=${targetCode}; path=/;`;
      document.cookie = `googtrans=${targetCode}; domain=.${window.location.hostname}; path=/;`;
      document.documentElement.lang = langCode;

      const triggerCombo = () => {
        const combo = document.querySelector(".goog-te-combo");
        if (combo) {
          combo.value = langCode;
          combo.dispatchEvent(new Event("change"));
          return true;
        }
        return false;
      };

      if (!triggerCombo()) {
        const timer1 = setTimeout(triggerCombo, 300);
        const timer2 = setTimeout(triggerCombo, 1000);
        const timer3 = setTimeout(triggerCombo, 2500);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      }
    } catch (err) {
      console.warn("Translation trigger error:", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("parkease_lang", language);
    } catch {
      // ignore
    }

    if (language !== "en") {
      applyGlobalTranslation(language);
    } else {
      // Clean reset to default English
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.documentElement.lang = "en";
    }
  }, [language, applyGlobalTranslation]);

  const setLanguage = (code) => {
    if (LANGUAGES.some((l) => l.code === code)) {
      setLanguageState(code);
      applyGlobalTranslation(code);
    }
  };

  const t = (key, fallbackText) => {
    return fallbackText || key;
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        LANGUAGES,
        currentLanguage: currentLangObj,
      }}
    >
      {children}
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

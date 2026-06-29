"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import dictionary from "./i18n.json";

type Lang = "ID" | "EN";
type Dict = typeof dictionary["ID"];

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof Dict) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "ID",
  setLang: () => {},
  t: (key) => key as string,
});

export function I18nProvider({ children, initialLang = "ID" }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    const stored = localStorage.getItem("kh_lang") as Lang | null;
    if (stored === "ID" || stored === "EN") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("kh_lang", l);
  };

  const t = (key: keyof Dict): string => {
    return (dictionary[lang] as Dict)[key] ?? (key as string);
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { messages, defaultLocale, type Locale } from "@/lib/i18n";

/**
 * 客户端 i18next 初始化。
 *
 * react-i18next 的 initReactInext 使用 React.createContext，必须在客户端组件中使用。
 * 本文件仅供 'use client' 组件导入。
 */

const resources = {
  zh: { translation: messages.zh },
  en: { translation: messages.en },
} as const;

export function initI18n(locale: Locale) {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: defaultLocale,
      interpolation: { escapeValue: false },
    });
  } else if (i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }
  return i18n;
}

export default i18n;

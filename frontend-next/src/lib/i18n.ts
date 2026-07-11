/**
 * i18n 纯数据与工具（无 react-i18next 依赖，可在 Server/Client Component 安全导入）。
 *
 * react-i18next 的初始化（含 createContext）集中在 lib/i18n-client.ts（仅客户端组件使用），
 * 避免在 RSC 模块图中触发 createContext。
 */

import zh from "@/messages/zh.json";
import en from "@/messages/en.json";

export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";

/** locale → HTML lang 属性映射。 */
export const localeToHtmlLang: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en",
};

export const messages = { zh, en } as const;

/** 校验 locale 参数，无效时返回默认 locale。 */
export function resolveLocale(locale: string | undefined): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
}

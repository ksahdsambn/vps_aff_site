"use client";

import { useEffect } from "react";
import { localeToHtmlLang, type Locale } from "@/lib/i18n";

/**
 * 同步 <html lang> 属性到当前 locale。
 *
 * 根 layout 渲染 <html lang="zh-CN">（默认）并加 suppressHydrationWarning，
 * 允许本组件在客户端水合后无警告地更新 lang。
 *
 * 当进入 /en 路由时，本组件将 <html lang> 更新为 "en"。
 *
 * SEO 缓解：[locale]/layout.tsx 的 generateMetadata 已输出 content-language meta，
 * 搜索引擎可据此识别页面语言（即使原始 HTML 的 lang 属性仍为默认值，
 * 水合后即被修正）。这是 Next.js 单根布局 + i18n 的已知限制。
 */
export default function LangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang[locale];
  }, [locale]);

  return null;
}

"use client";

import { Button } from "antd";
import { TranslationOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Locale } from "@/lib/i18n";

/**
 * 语言切换器（URL 路由版）。
 *
 * 与旧前端不同：不再用 localStorage 切换 i18n 实例，而是导航到对应 locale 的 URL
 * （如 /zh/products/1 ↔ /en/products/1），使中英文各自拥有独立可索引 URL。
 * 同时将用户偏好写入 localStorage，供根路径重定向使用。
 */
export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  const targetLocale: Locale = locale === "zh" ? "en" : "zh";
  // 将当前路径的 locale 段替换为目标 locale。
  // 若路径无 locale 前缀（如 /admin/products），回退到目标 locale 首页，
  // 避免在非 locale 路由内错误导航。
  const hasLocalePrefix = /^\/(zh|en)(\/|$)/.test(pathname);
  const targetPath = hasLocalePrefix
    ? pathname.replace(/^\/(zh|en)(\/|$)/, `/${targetLocale}$2`)
    : `/${targetLocale}`;

  const handleClick = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", targetLocale);
    }
    router.push(targetPath || `/${targetLocale}`);
  }, [router, targetPath, targetLocale]);

  const label = locale === "zh" ? "English" : "中文";

  return (
    <Button
      type="text"
      icon={<TranslationOutlined />}
      onClick={handleClick}
      aria-label={label}
    >
      {label}
    </Button>
  );
}

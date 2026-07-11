import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { defaultLocale, type Locale } from "@/lib/i18n";

/**
 * 根路径 `/` → 根据 Accept-Language 重定向到对应 locale。
 *
 * 策略：
 * 1. 解析 Accept-Language header，匹配 zh/en。
 * 2. 无匹配时默认 /zh（中文优先，与站点主要受众一致）。
 *
 * 这样爬虫与浏览器按语言偏好被导向正确的可索引 URL。
 */
export default async function RootPage() {
  const headerList = await headers();
  const acceptLang = headerList.get("accept-language") || "";
  const locale = pickLocale(acceptLang);
  redirect(`/${locale}`);
}

/** 从 Accept-Language 字符串中选择支持的 locale。 */
function pickLocale(acceptLanguage: string): Locale {
  const parsed = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qStr] = part.trim().split(";q=");
      const q = qStr ? parseFloat(qStr) : 1;
      return { tag: tag.toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parsed) {
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("en")) return "en";
  }
  return defaultLocale;
}

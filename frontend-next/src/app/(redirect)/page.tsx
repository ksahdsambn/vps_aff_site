import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { defaultLocale, type Locale } from "@/lib/i18n";

export default async function RootPage() {
  const acceptLang = (await headers()).get("accept-language") || "";
  redirect(`/${pickLocale(acceptLang)}`);
}

function pickLocale(acceptLanguage: string): Locale {
  const parsed = acceptLanguage.split(",").map((part) => {
    const [tag, qStr] = part.trim().split(";q=");
    return { tag: tag.toLowerCase(), q: qStr ? parseFloat(qStr) : 1 };
  }).sort((a, b) => b.q - a.q);
  for (const { tag } of parsed) {
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("en")) return "en";
  }
  return defaultLocale;
}

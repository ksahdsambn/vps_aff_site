"use client";

import { I18nextProvider } from "react-i18next";
import { ConfigProvider } from "antd";
import { antdTheme } from "@/lib/theme";
import { type Locale } from "@/lib/i18n";
import { initI18n } from "@/lib/i18n-client";
import LangSync from "@/components/LangSync";

/**
 * 客户端 i18n + AntD Provider 包装器。
 *
 * react-i18next 的 I18nextProvider 内部使用 React.createContext，
 * 必须在客户端组件中调用，故将 layout 的 provider 包装收敛到此 'use client' 组件。
 */
export default function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const i18nInstance = initI18n(locale);
  return (
    <I18nextProvider i18n={i18nInstance}>
      <ConfigProvider theme={antdTheme}>
        <LangSync locale={locale} />
        {children}
      </ConfigProvider>
    </I18nextProvider>
  );
}

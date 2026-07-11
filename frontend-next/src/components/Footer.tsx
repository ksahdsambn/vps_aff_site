"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { FrontendConfig } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import styles from "./Footer.module.css";

interface FooterProps {
  config?: FrontendConfig | null;
  locale: Locale;
}

/**
 * 公共页脚 —— Editorial-Data Minimal。
 *
 * 不透明白底 + 暖色 hairline 顶边（无 backdrop-filter）。左对齐导航，
 * 版权与隐私政策置于次行。仅出现在公共页面，Admin 区无页脚。
 */
export default function Footer({ config, locale }: FooterProps) {
  const { i18n } = useTranslation();
  const year = new Date().getFullYear();
  const siteTitle =
    i18n.language === "zh"
      ? config?.site_title_zh || "VPS导航"
      : config?.site_title_en || "VPS Navigator";

  const copyright =
    locale === "zh"
      ? `© ${year} ${siteTitle}。保留所有权利。`
      : `© ${year} ${siteTitle}. All rights reserved.`;

  const privacyLabel = locale === "zh" ? "隐私政策" : "Privacy Policy";
  const blogLabel = locale === "zh" ? "博客" : "Blog";

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav className={styles.nav} aria-label="Footer links">
          <Link href={`/${locale}`} className={styles.navPrimary}>
            {siteTitle}
          </Link>
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.social}>
            {config?.link_telegram && (
              <a href={config.link_telegram} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            )}
            {config?.link_youtube && (
              <a href={config.link_youtube} target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            )}
            {config?.link_blog && (
              <a href={config.link_blog} target="_blank" rel="noopener noreferrer">
                {blogLabel}
              </a>
            )}
            {config?.link_x && (
              <a href={config.link_x} target="_blank" rel="noopener noreferrer">
                X
              </a>
            )}
          </span>
          <span className={styles.divider} aria-hidden="true" />
          <Link href={`/${locale === "zh" ? "en" : "zh"}`}>
            {locale === "zh" ? "English" : "中文"}
          </Link>
        </nav>
        <p className={styles.copyright}>
          {copyright}
          <span className={styles.dot} aria-hidden="true">·</span>
          <Link href={`/${locale}/privacy`}>
            {privacyLabel}
          </Link>
        </p>
      </div>
    </footer>
  );
}

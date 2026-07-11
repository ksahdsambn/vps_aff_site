"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { FrontendConfig } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

interface FooterProps {
  config?: FrontendConfig | null;
  locale: Locale;
}

/**
 * 公共页脚。
 *
 * 完善语义结构：版权信息、社交链接重复、语言切换。
 * 仅出现在公共页面（首页/详情/聚合），Admin 区无页脚。
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

  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "32px 24px",
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(226, 232, 240, 0.6)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <nav aria-label="Footer links" style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12, flexWrap: "wrap" }}>
          <Link href={`/${locale}`}>{siteTitle}</Link>
          {(config?.link_telegram || config?.link_youtube || config?.link_blog || config?.link_x) && (
            <span>
              {config?.link_telegram && (
                <a href={config.link_telegram} target="_blank" rel="noopener noreferrer" style={{ margin: "0 8px" }}>
                  Telegram
                </a>
              )}
              {config?.link_youtube && (
                <a href={config.link_youtube} target="_blank" rel="noopener noreferrer" style={{ margin: "0 8px" }}>
                  YouTube
                </a>
              )}
              {config?.link_blog && (
                <a href={config.link_blog} target="_blank" rel="noopener noreferrer" style={{ margin: "0 8px" }}>
                  {locale === "zh" ? "博客" : "Blog"}
                </a>
              )}
              {config?.link_x && (
                <a href={config.link_x} target="_blank" rel="noopener noreferrer" style={{ margin: "0 8px" }}>
                  X
                </a>
              )}
            </span>
          )}
          <Link href={`/${locale === "zh" ? "en" : "zh"}`}>
            {locale === "zh" ? "English" : "中文"}
          </Link>
        </nav>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
          {copyright} · <Link href={`/${locale}/privacy`} style={{ color: "#94a3b8" }}>{privacyLabel}</Link>
        </p>
      </div>
    </footer>
  );
}

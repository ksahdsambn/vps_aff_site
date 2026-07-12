"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Space } from "antd";
import {
  SendOutlined,
  YoutubeOutlined,
  ReadOutlined,
  TwitterOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import styles from "./Header.module.css";
import LanguageSwitcher from "./LanguageSwitcher";
import type { FrontendConfig } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

interface HeaderProps {
  config?: FrontendConfig | null;
  locale: Locale;
  /**
   * 站点标题是否作为 h1。
   * - 首页 true（站点标题作为页面主标题 h1）。
   * - 详情页/服务商页 false（渲染为 div，避免与页面内容 h1 冲突）。
   */
  asH1?: boolean;
}

/**
 * 公共页头 —— Editorial-Data Minimal。
 *
 * 不透明白底 + 暖色 hairline 底边（无 backdrop-filter）。站点标题用 Fraunces（display），
 * 通过 CSS module 的 .title 控制；语义层级由 asH1 决定（首页 h1，其余 div）。
 */
const Header: React.FC<HeaderProps> = ({ config, locale, asH1 = true }) => {
  const { i18n } = useTranslation();

  const title =
    i18n.language === "zh"
      ? config?.site_title_zh || "VPS导航"
      : config?.site_title_en || "VPS Navigator";

  const titleContent = <Link href={`/${locale}`}>{title}</Link>;

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        {config?.site_logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={config.site_logo}
            alt="VPS Navi Logo"
            className={styles.logo}
            width={120}
            height={28}
          />
        )}
        {asH1 ? (
          <h1 className={styles.title}>{titleContent}</h1>
        ) : (
          <div className={styles.title}>{titleContent}</div>
        )}
      </div>

      <div className={styles.actions}>
        <nav aria-label="Social links">
          <Space className={styles.socialIcons}>
            {config?.link_telegram && (
              <a href={config.link_telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className={styles.iconLink}>
                <SendOutlined className={styles.icon} />
              </a>
            )}
            {config?.link_youtube && (
              <a href={config.link_youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={styles.iconLink}>
                <YoutubeOutlined className={styles.icon} />
              </a>
            )}
            {config?.link_blog && (
              <a href={config.link_blog} target="_blank" rel="noopener noreferrer" aria-label="Blog" className={styles.iconLink}>
                <ReadOutlined className={styles.icon} />
              </a>
            )}
            {config?.link_x && (
              <a href={config.link_x} target="_blank" rel="noopener noreferrer" aria-label="X" className={styles.iconLink}>
                <TwitterOutlined className={styles.icon} />
              </a>
            )}
          </Space>
        </nav>

        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
};

export default Header;

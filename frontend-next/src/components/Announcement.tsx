"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { CaretDownOutlined, NotificationOutlined } from "@ant-design/icons";
import { Button } from "antd";
import styles from "./Announcement.module.css";
import type { FrontendConfig } from "@/lib/api";
import { markdownOptions } from "@/lib/markdown";

// react-markdown 体积较大，懒加载以减小首屏 JS bundle。
// 仅在有公告内容时才加载。
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: true,
  loading: () => null,
});

interface AnnouncementProps {
  config?: FrontendConfig | null;
}

/**
 * 公告区。
 *
 * 从旧前端迁移，内容由站点配置驱动（announcement_zh / announcement_en）。
 * 服务端 SSG 时 config 已传入，首帧即渲染公告内容（消除骨架屏闪烁）。
 */
const Announcement: React.FC<AnnouncementProps> = ({ config }) => {
  const { i18n, t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  // startsWith("zh") 兼容 "zh-CN" 等区域变体。
  const content =
    i18n.language?.startsWith("zh") ? config?.announcement_zh : config?.announcement_en;

  if (!content) {
    return null;
  }

  return (
    <aside className={styles.container} aria-label="Announcement">
      <div className={styles.header}>
        <div className={styles.title}>
          <NotificationOutlined className={styles.icon} />
          <span>{t("announcement.title")}</span>
        </div>
        <Button
          type="text"
          size="small"
          onClick={() => setExpanded(!expanded)}
          className={styles.toggleBtn}
          aria-expanded={expanded}
        >
          <CaretDownOutlined className={`${styles.chevron} ${expanded ? styles.chevronUp : ""}`} />
          {expanded ? t("announcement.collapse") : t("announcement.expand")}
        </Button>
      </div>
      <div className={`${styles.content} ${expanded ? styles.expanded : styles.collapsed}`}>
        <ReactMarkdown {...markdownOptions}>{content}</ReactMarkdown>
      </div>
    </aside>
  );
};

export default Announcement;

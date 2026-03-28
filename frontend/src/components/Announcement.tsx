import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { CaretDownOutlined, CaretUpOutlined, NotificationOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import styles from './Announcement.module.css';
import type { FrontendConfig } from '../api';

interface AnnouncementProps {
  config?: FrontendConfig | null;
}

const Announcement: React.FC<AnnouncementProps> = ({ config }) => {
  const { i18n, t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const content = i18n.language === 'zh' 
    ? config?.announcement_zh 
    : config?.announcement_en;

  if (!content) {
    return null;
  }

  return (
    <aside className={styles.container} aria-label="Announcement">
      <div className={styles.header}>
        <div className={styles.title}>
          <NotificationOutlined className={styles.icon} />
          <span>{t('announcement.title')}</span>
        </div>
        <Button 
          type="text" 
          size="small" 
          onClick={() => setExpanded(!expanded)}
          className={styles.toggleBtn}
        >
          {expanded ? (
            <><CaretUpOutlined /> {t('announcement.collapse')}</>
          ) : (
            <><CaretDownOutlined /> {t('announcement.expand')}</>
          )}
        </Button>
      </div>
      <div className={`${styles.content} ${expanded ? styles.expanded : styles.collapsed}`}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </aside>
  );
};

export default Announcement;

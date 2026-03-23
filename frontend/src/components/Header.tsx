import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Space, Typography } from 'antd';
import { 
  SendOutlined, 
  YoutubeOutlined, 
  ReadOutlined, 
  TwitterOutlined,
  TranslationOutlined
} from '@ant-design/icons';
import styles from './Header.module.css';
import type { FrontendConfig } from '../api';

const { Title } = Typography;

interface HeaderProps {
  config?: FrontendConfig | null;
}

const Header: React.FC<HeaderProps> = ({ config }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  const title = i18n.language === 'zh' 
    ? (config?.site_title_zh || 'VPS导航') 
    : (config?.site_title_en || 'VPS Navigator');
  
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        {config?.site_logo && (
          <img src={config.site_logo} alt="Logo" className={styles.logo} />
        )}
        <Title level={4} className={styles.title}>{title}</Title>
      </div>
      
      <div className={styles.actions}>
        <Space className={styles.socialIcons}>
          {config?.link_telegram && (
            <a href={config.link_telegram} target="_blank" rel="noopener noreferrer">
              <SendOutlined className={styles.icon} />
            </a>
          )}
          {config?.link_youtube && (
            <a href={config.link_youtube} target="_blank" rel="noopener noreferrer">
              <YoutubeOutlined className={styles.icon} />
            </a>
          )}
          {config?.link_blog && (
            <a href={config.link_blog} target="_blank" rel="noopener noreferrer">
              <ReadOutlined className={styles.icon} />
            </a>
          )}
          {config?.link_x && (
            <a href={config.link_x} target="_blank" rel="noopener noreferrer">
              <TwitterOutlined className={styles.icon} />
            </a>
          )}
        </Space>
        
        <Button 
          type="text" 
          icon={<TranslationOutlined />} 
          onClick={toggleLanguage}
          className={styles.langBtn}
        >
          {i18n.language === 'zh' ? 'English' : '中文'}
        </Button>
      </div>
    </header>
  );
};

export default Header;

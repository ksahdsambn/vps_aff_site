import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

// 从 localStorage 读取用户语言偏好
const savedLang = localStorage.getItem('lang') || 'zh';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS 防护
    },
  });

// 语言代码到 HTML lang 属性的映射
const langMap: Record<string, string> = { zh: 'zh-CN', en: 'en' };

// 初始化时同步 HTML lang 属性
document.documentElement.lang = langMap[i18n.language] || 'zh-CN';

// 语言切换时同步 HTML lang 属性
i18n.on('languageChanged', (lng: string) => {
  document.documentElement.lang = langMap[lng] || 'zh-CN';
});

export default i18n;

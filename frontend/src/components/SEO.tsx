import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  lang?: string;
}

const defaultTitle = 'VPS导航 - 全球VPS价格对比与推荐 | VPS Navi';
const defaultDescription = 'VPS导航 - 全球VPS服务器价格对比与推荐，帮你找到最具性价比的VPS主机';

const SEO: React.FC<SEOProps> = ({ title, description, lang = 'zh-CN' }) => {
  const finalTitle = title ? `${title} | VPS Navi` : defaultTitle;
  const finalDescription = description || defaultDescription;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
    </Helmet>
  );
};

export default SEO;

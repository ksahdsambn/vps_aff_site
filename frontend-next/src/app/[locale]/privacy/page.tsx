import type { Metadata } from "next";
import Link from "next/link";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import Header from "@/components/Header";
import Announcement from "@/components/Announcement";
import Footer from "@/components/Footer";
import { getConfig } from "@/lib/api";

/**
 * 隐私政策页（SSG）。
 *
 * 简单的隐私政策声明，双语。Footer 中的"隐私政策"链接指向此页。
 */

export async function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "en" }];
}

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = resolveLocale(rawLocale);
  const config = await getConfig().catch(() => null);

  const isZh = locale === "zh";
  const t = isZh
    ? {
        title: "隐私政策",
        intro:
          "本隐私政策说明 VPS Navi（以下简称「我们」）如何收集、使用和保护您的信息。",
        sections: [
          {
            heading: "信息收集",
            body:
              "我们不要求您注册账户即可浏览本站内容。我们通过 Google Analytics 收集匿名的访问统计信息（如页面浏览量、访问时长、大致地理位置），不收集可识别个人身份的信息。",
          },
          {
            heading: "Cookie",
            body:
              "本站使用 Cookie 改善用户体验和分析流量。您可以通过浏览器设置禁用 Cookie，但可能影响部分功能。",
          },
          {
            heading: "第三方链接",
            body:
              "本站包含指向第三方服务商的联盟链接。点击这些链接后，您将离开本站，第三方网站的隐私政策不再受本政策约束。",
          },
          {
            heading: "数据安全",
            body:
              "我们采取合理的技术措施保护收集的信息免遭未经授权的访问、使用或披露。",
          },
          {
            heading: "政策变更",
            body: "我们可能不时更新本隐私政策。更新后的政策将在本页面发布并立即生效。",
          },
        ],
        back: "返回首页",
        lastUpdated: "最后更新：2026-07-13",
      }
    : {
        title: "Privacy Policy",
        intro:
          'This privacy policy explains how VPS Navi ("we") collects, uses, and protects your information.',
        sections: [
          {
            heading: "Information Collection",
            body:
              "We do not require you to register an account to browse this site. We collect anonymous traffic statistics (such as page views, visit duration, and approximate geographic location) via Google Analytics. We do not collect personally identifiable information.",
          },
          {
            heading: "Cookies",
            body:
              "This site uses cookies to improve user experience and analyze traffic. You can disable cookies in your browser settings, but some features may be affected.",
          },
          {
            heading: "Third-Party Links",
            body:
              "This site contains affiliate links to third-party providers. Clicking these links will take you away from this site, and the third-party website's privacy policy will apply.",
          },
          {
            heading: "Data Security",
            body:
              "We take reasonable technical measures to protect collected information from unauthorized access, use, or disclosure.",
          },
          {
            heading: "Policy Changes",
            body: "We may update this privacy policy from time to time. Updated policies will be posted on this page and take effect immediately.",
          },
        ],
        back: "Back to Home",
        lastUpdated: "Last updated: 2026-07-13",
      };

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <Header config={config} locale={locale} asH1={false} />
      <Announcement config={config} />

      <section style={{ maxWidth: 720, margin: "0 auto", padding: "32px clamp(16px, 4vw, 24px) 48px", overflowWrap: "anywhere" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          {isZh ? "法律声明" : "Legal"}
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            fontWeight: 600,
            color: "var(--ink)",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          {t.title}
        </h1>
        <p style={{ color: "var(--text)", marginBottom: 12, fontSize: "1rem", lineHeight: 1.7 }}>
          {t.intro}
        </p>
        <p style={{ color: "var(--muted)", marginBottom: 36, fontSize: "0.8125rem" }}>
          {t.lastUpdated}
        </p>

        {t.sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "var(--ink)",
                marginBottom: 8,
                letterSpacing: "-0.01em",
              }}
            >
              {section.heading}
            </h2>
            <p style={{ color: "var(--text)", lineHeight: 1.8, fontSize: "0.9375rem" }}>
              {section.body}
            </p>
          </div>
        ))}

        <hr style={{ border: 0, borderTop: "1px solid var(--rule)", margin: "32px 0" }} />

        <Link
          href={`/${locale}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 22px",
            minHeight: 44,
            borderRadius: 8,
            background: "transparent",
            border: "1px solid var(--rule-strong)",
            color: "var(--ink)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            transition: "border-color var(--dur) var(--ease-out), color var(--dur) var(--ease-out), background var(--dur) var(--ease-out)",
          }}
        >
          <span aria-hidden="true">←</span> {t.back}
        </Link>
      </section>

      <Footer config={config} locale={locale} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const title = locale === "zh" ? "隐私政策" : "Privacy Policy";
  const description =
    locale === "zh"
      ? "VPS Navi 隐私政策：了解我们如何收集、使用和保护您的信息。"
      : "VPS Navi Privacy Policy: Learn how we collect, use, and protect your information.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/privacy`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/privacy`,
        en: `${SITE_URL}/en/privacy`,
        "x-default": `${SITE_URL}/zh/privacy`,
      },
    },
  };
}

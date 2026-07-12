"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "antd";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CompassOutlined,
  RocketOutlined,
  SlidersOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import styles from "./GettingStarted.module.css";

export type OnboardingPreset = "value" | "performance" | "explore";

interface GettingStartedProps {
  resultCount: number;
  onStart: (preset: OnboardingPreset) => void;
}

const STORAGE_KEY = "vps-navi-onboarding-dismissed";
const subscribeToStorage = () => () => undefined;

/** 安全读取 localStorage（隐私模式 / 配额超额时降级为 false）。 */
function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/** 安全写入 localStorage（隐私模式 / 配额超额时静默失败，不阻断交互）。 */
function writeDismissed(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {
    // 隐私模式或配额超额——忽略，用户仍可在本次会话内使用 onboarding。
  }
}

/** Optional first-use guide that starts a real comparison flow. */
export default function GettingStarted({ resultCount, onStart }: GettingStartedProps) {
  const { t } = useTranslation();
  const dismissed = useSyncExternalStore(
    subscribeToStorage,
    readDismissed,
    () => false
  );
  const [forceOpen, setForceOpen] = useState(false);
  const [chosenPreset, setChosenPreset] = useState<OnboardingPreset | null>(null);

  const expanded = forceOpen || !dismissed;

  const dismiss = () => {
    writeDismissed(true);
    setForceOpen(false);
  };

  const start = (preset: OnboardingPreset) => {
    setChosenPreset(preset);
    writeDismissed(true);
    setForceOpen(false);
    onStart(preset);
  };

  if (!expanded) {
    return (
      <div className={styles.reopenWrap}>
        <button className={styles.reopen} type="button" onClick={() => setForceOpen(true)}>
          <CompassOutlined aria-hidden="true" />
          {t("onboarding.reopen")}
        </button>
      </div>
    );
  }

  const options: { preset: OnboardingPreset; icon: ReactNode; title: string; description: string }[] = [
    {
      preset: "value",
      icon: <SlidersOutlined />,
      title: t("onboarding.valueTitle"),
      description: t("onboarding.valueDescription"),
    },
    {
      preset: "performance",
      icon: <RocketOutlined />,
      title: t("onboarding.performanceTitle"),
      description: t("onboarding.performanceDescription"),
    },
    {
      preset: "explore",
      icon: <CompassOutlined />,
      title: t("onboarding.exploreTitle"),
      description: t("onboarding.exploreDescription"),
    },
  ];

  return (
    <aside className={`${styles.guide} page-enter`} aria-label={t("onboarding.ariaLabel")}>
      <div className={styles.intro}>
        <p className="eyebrow">{t("onboarding.eyebrow")}</p>
        <h2>{t("onboarding.title")}</h2>
        <p className={styles.lede}>{t("onboarding.description", { count: resultCount })}</p>
      </div>

      <ol className={styles.steps}>
        <li className={styles.step}><span className={styles.stepNumber}>1</span><span>{t("onboarding.stepGoal")}</span></li>
        <li className={styles.step}><span className={styles.stepNumber}>2</span><span>{t("onboarding.stepCompare")}</span></li>
        <li className={styles.step}><span className={styles.stepNumber}>3</span><span>{t("onboarding.stepReview")}</span></li>
      </ol>

      <div className={styles.options}>
        {options.map((option) => (
          <button
            className={`${styles.option} ${chosenPreset === option.preset ? styles.optionSelected : ""}`}
            key={option.preset}
            type="button"
            onClick={() => start(option.preset)}
          >
            <span className={styles.optionIcon} aria-hidden="true">{option.icon}</span>
            <span className={styles.optionContent}><strong>{option.title}</strong><span>{option.description}</span></span>
            {chosenPreset === option.preset ? (
              <CheckCircleFilled className={styles.selectedIcon} aria-label={t("onboarding.selected")} />
            ) : (
              <ArrowRightOutlined className={styles.arrow} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      <div className={styles.footer}>
        <span>{t("onboarding.note")}</span>
        <Button type="link" onClick={dismiss} className={styles.skip}>{t("onboarding.skip")}</Button>
      </div>
    </aside>
  );
}

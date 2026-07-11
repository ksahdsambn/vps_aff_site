"use client";

import React from "react";
import { Button as AntButton } from "antd";
import type { ButtonProps as AntButtonProps } from "antd";
import styles from "./Button.module.css";

export type BtnVariant = "primary" | "ghost" | "text";

// Omit AntD props that collide with our own or that we re-declare:
//  - "type": we map variant→type internally
//  - "variant": AntD 6 Button has its own `variant` prop (different values); we shadow it
//  - "ghost": AntD's boolean `ghost` prop collides semantically with our variant="ghost";
//    omit it so callers can't accidentally toggle AntD's ghost behavior
export interface ButtonProps extends Omit<AntButtonProps, "type" | "variant" | "ghost"> {
  /** 视觉样式：primary（实色 CTA）/ ghost（描边次操作）/ text（纯文字）。 */
  variant?: BtnVariant;
}

/**
 * 共享 CTA 按钮 —— Editorial-Data Minimal。
 *
 * 替代旧前端里 7 处内联 `linear-gradient(135deg, #6366f1, #4f46e5)` 渐变按钮。
 * 统一走 AntD Button + 设计 token（colorPrimary 已是纯色 #4338ca，无渐变）。
 *
 * - primary：实色 accent，CTA 主操作（下单、登录、提交）。
 * - ghost：透明底 + accent 边框，次操作（查看测评、返回）。
 * - text：纯文字链接，最轻量。
 *
 * 强制 44px 最小点击区域（AGENTS.md tap-target 要求）。
 * 动效由 globals.css 的 AntD 过渡规则统一接管（ease-out-quart，无 translateY/scale）。
 *
 * href/target/rel 等锚点属性直接透传给 AntD Button（AntD 6 在传入 href 时原生渲染 <a>），
 * 故无需在此分支处理。
 */
const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className,
  children,
  size = "large",
  ...rest
}) => {
  const type: AntButtonProps["type"] =
    variant === "primary" ? "primary" : variant === "ghost" ? "default" : "text";

  const cls = [
    styles.btn,
    variant === "primary" && styles.primary,
    variant === "ghost" && styles.ghost,
    variant === "text" && styles.text,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AntButton type={type} size={size} className={cls} {...rest}>
      {children}
    </AntButton>
  );
};

export default Button;

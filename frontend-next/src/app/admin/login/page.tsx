"use client";

import { useState, useEffect, Suspense } from "react";
import { Form, Input, message, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { adminLogin, adminGetSession, getApiErrorMessage, getApiStatusCode, getHttpStatus } from "@/lib/api";
import Button from "@/components/ui/Button";
import styles from "./Login.module.css";

/**
 * Admin 登录页（客户端组件）—— Editorial-Data Minimal。
 *
 * 完全重置：删除三色渐变背景、两个模糊光斑、玻璃卡、springFadeIn 弹跳。
 * 改为不透明 paper 背景 + 居中不透明卡片（hairline 边框）。
 * 标题用 Fraunces，提交按钮走共享 Button（实色 accent，无渐变）。
 *
 * 注：useSearchParams() 在 Next.js 中必须包裹 Suspense 边界，否则构建期
 * 静态预渲染会 bail out 报错。故拆为外层 Suspense + 内层 LoginPageInner。
 */
interface LoginFormValues {
  username: string;
  password: string;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("reason") === "expired";
  const redirectTo = searchParams.get("from") || "/admin/products";

  // 已登录用户访问登录页时直接跳转 dashboard，避免重复登录。
  useEffect(() => {
    let cancelled = false;
    void adminGetSession()
      .then(() => {
        if (!cancelled) router.replace(redirectTo);
      })
      .catch(() => {
        // 未登录，留在登录页。
      });
    return () => {
      cancelled = true;
    };
  }, [router, redirectTo]);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await adminLogin(values.username, values.password);
      message.success("Signed in.");
      router.push(redirectTo);
    } catch (error: unknown) {
      // Rate-limited sign-in: backend business code 1002 或 HTTP 429。
      const businessCode = getApiStatusCode(error);
      const httpStatus = getHttpStatus(error);
      if (businessCode === 1002 || httpStatus === 429) {
        message.error("Too many sign-in attempts. For your account's safety, please wait about 15 minutes before trying again.");
        return;
      }
      // 区分网络错误与凭证错误，给出准确提示。
      if (httpStatus === undefined) {
        message.error(getApiErrorMessage(error) || "Couldn't reach the server. Please check your connection and try again.");
      } else {
        message.error(getApiErrorMessage(error) || "That username or password didn't match. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} page-enter`}>
        <div className={styles.brandBlock}>
          <div className={styles.eyebrow}>VPS Navigator</div>
          <h1 className={styles.title}>Admin</h1>
        </div>

        {sessionExpired && (
          <Alert
            type="warning"
            showIcon
            message="Your session expired. Please sign in again."
            style={{ marginBottom: 16 }}
          />
        )}

        <Form name="admin_login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please enter your username." }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" maxLength={100} autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password." }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" maxLength={200} autoComplete="current-password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              variant="primary"
              size="large"
              htmlType="submit"
              block
              loading={loading}
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

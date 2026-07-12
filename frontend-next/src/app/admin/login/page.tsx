"use client";

import { useState } from "react";
import { Form, Input, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { adminLogin, getApiErrorMessage, getApiStatusCode } from "@/lib/api";
import Button from "@/components/ui/Button";
import styles from "./Login.module.css";

/**
 * Admin 登录页（客户端组件）—— Editorial-Data Minimal。
 *
 * 完全重置：删除三色渐变背景、两个模糊光斑、玻璃卡、springFadeIn 弹跳。
 * 改为不透明 paper 背景 + 居中不透明卡片（hairline 边框）。
 * 标题用 Fraunces，提交按钮走共享 Button（实色 accent，无渐变）。
 */
interface LoginFormValues {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await adminLogin(values.username, values.password);
      message.success("Signed in.");
      router.push("/admin/products");
    } catch (error: unknown) {
      // Rate-limited sign-in (backend code 1002 / HTTP 429). Show a clear,
      // actionable message rather than the raw backend text.
      const code = getApiStatusCode(error);
      if (code === 1002) {
        message.error("Too many sign-in attempts. For your account's safety, please wait about 15 minutes before trying again.");
        return;
      }
      message.error(getApiErrorMessage(error) || "That username or password didn't match. Please try again.");
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

        <Form name="admin_login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please enter your username." }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password." }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
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

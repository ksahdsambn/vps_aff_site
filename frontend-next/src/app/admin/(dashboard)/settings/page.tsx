"use client";

import { useEffect, useState } from "react";
import { Form, Input, Button, Card, message, Space, Divider } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { adminGetConfig, adminUpdateConfig, getApiErrorMessage } from "@/lib/api";

type SettingsFormValues = Record<string, string>;

/**
 * Admin 配置管理（客户端组件）。
 *
 * 从旧前端 Settings.tsx 迁移：API 调用改为新的解包封装。
 */
export default function AdminSettingsPage() {
  const [form] = Form.useForm<SettingsFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // 加载完成后的初始值快照——用于 dirty diff，只发送改动过的 key，
  // 避免覆盖其他 admin 并发的修改。
  const [initialSnapshot, setInitialSnapshot] = useState<SettingsFormValues>({});
  // 表单是否有未保存改动（控制 Save 按钮启用状态）。
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadConfigs = async () => {
      setLoading(true);
      try {
        const items = await adminGetConfig();
        if (cancelled) return;
        const initialValues: SettingsFormValues = {};
        items.forEach((item) => {
          initialValues[item.configKey] = item.configValue || "";
        });
        form.setFieldsValue(initialValues);
        setInitialSnapshot(initialValues);
        setDirty(false);
      } catch (error) {
        if (!cancelled) message.error(getApiErrorMessage(error) || "Couldn't load the settings. Please refresh the page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadConfigs();
    return () => {
      cancelled = true;
    };
  }, [form]);

  const onFinish = async (values: SettingsFormValues) => {
    setSaving(true);
    try {
      // 仅发送改动过的 key，避免覆盖其他 admin 并发的修改。
      const changedEntries = Object.entries(values).filter(
        ([key, value]) => (initialSnapshot[key] ?? "") !== (value || "")
      );
      if (changedEntries.length === 0) {
        message.info("No changes to save.");
        return;
      }
      // allSettled 而非 all：单个 key 失败不影响其他 key，报告部分成功/失败。
      const results = await Promise.allSettled(
        changedEntries.map(([key, value]) => adminUpdateConfig(key, value || ""))
      );
      const failed = results
        .map((r, i) => (r.status === "rejected" ? changedEntries[i][0] : null))
        .filter((k): k is string => k !== null);
      if (failed.length === 0) {
        message.success(`Settings saved (${changedEntries.length} item${changedEntries.length > 1 ? "s" : ""}).`);
        setInitialSnapshot({ ...values });
        setDirty(false);
      } else {
        const succeeded = changedEntries.length - failed.length;
        message.warning(
          `Saved ${succeeded} of ${changedEntries.length}. Failed: ${failed.join(", ")}. Please retry the failed items.`
        );
        // 部分成功：更新快照为已成功的值，保留失败项的旧值供重试。
        const nextSnapshot = { ...initialSnapshot };
        changedEntries.forEach(([key, value], i) => {
          if (results[i].status === "fulfilled") {
            nextSnapshot[key] = value || "";
          }
        });
        setInitialSnapshot(nextSnapshot);
      }
    } catch (error) {
      message.error(getApiErrorMessage(error) || "Couldn't save the settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Settings" loading={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => void onFinish(values)}
        onValuesChange={(_changed, allValues) => {
          // 比较当前表单值与初始快照，判断是否有未保存改动。
          const isDirty = Object.keys(allValues).some(
            (key) => (initialSnapshot[key] ?? "") !== (allValues[key] || "")
          );
          setDirty(isDirty);
        }}
        style={{ maxWidth: 800 }}
      >
        <h3
          style={{
            marginTop: 24,
            marginBottom: 16,
            borderBottom: "1px solid var(--rule)",
            paddingBottom: 8,
          }}
        >
          Basic settings
        </h3>
        <Space size="large" style={{ display: "flex", flexWrap: "wrap" }}>
          <Form.Item name="site_title_zh" label="Site title (ZH)" rules={[{ required: true, whitespace: true, max: 100 }]}>
            <Input placeholder="e.g. VPS Navigator" maxLength={100} />
          </Form.Item>
          <Form.Item name="site_title_en" label="Site title (EN)" rules={[{ required: true, whitespace: true, max: 100 }]}>
            <Input placeholder="e.g. VPS Navigator" maxLength={100} />
          </Form.Item>
        </Space>

        <Form.Item name="site_logo" label="Logo URL" rules={[{ type: "url", max: 2048 }]}>
          <Input placeholder="https://example.com/logo.png" maxLength={2048} />
        </Form.Item>

        <h3
          style={{
            marginTop: 24,
            marginBottom: 16,
            borderBottom: "1px solid var(--rule)",
            paddingBottom: 8,
          }}
        >
          Social links
        </h3>
        <Space size="large" style={{ display: "flex", flexWrap: "wrap" }}>
          <Form.Item name="link_telegram" label="Telegram URL" rules={[{ type: "url", max: 2048 }]}>
            <Input placeholder="https://t.me/..." style={{ width: 300 }} maxLength={2048} />
          </Form.Item>
          <Form.Item name="link_youtube" label="YouTube URL" rules={[{ type: "url", max: 2048 }]}>
            <Input placeholder="https://youtube.com/..." style={{ width: 300 }} maxLength={2048} />
          </Form.Item>
          <Form.Item name="link_x" label="X URL" rules={[{ type: "url", max: 2048 }]}>
            <Input placeholder="https://x.com/..." style={{ width: 300 }} maxLength={2048} />
          </Form.Item>
          <Form.Item name="link_blog" label="Blog URL" rules={[{ type: "url", max: 2048 }]}>
            <Input placeholder="https://yourblog.com" style={{ width: 300 }} maxLength={2048} />
          </Form.Item>
        </Space>

        <Divider />

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} disabled={!dirty} size="large">
            Save changes
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

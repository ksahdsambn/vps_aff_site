"use client";

import { useEffect, useState } from "react";
import { Tabs, Input, Button, message, Card, Row, Col, Typography } from "antd";
import ReactMarkdown from "react-markdown";
import { adminGetConfig, adminUpdateConfig, getApiErrorMessage } from "@/lib/api";
import { markdownOptions } from "@/lib/markdown";

const { Title } = Typography;

/**
 * Admin 公告管理（客户端组件）。
 *
 * 从旧前端 Announcement.tsx 迁移：API 调用改为新的解包封装。
 * 中英文双 Tab，Markdown 编辑器 + 实时预览。
 */
export default function AdminAnnouncementPage() {
  const [zhContent, setZhContent] = useState("");
  const [enContent, setEnContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingZh, setSavingZh] = useState(false);
  const [savingEn, setSavingEn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadConfig = async () => {
      setLoading(true);
      try {
        const items = await adminGetConfig();
        if (cancelled) return;
        const zh = items.find((item) => item.configKey === "announcement_zh");
        const en = items.find((item) => item.configKey === "announcement_en");
        setZhContent(zh?.configValue || "");
        setEnContent(en?.configValue || "");
      } catch (error) {
        if (!cancelled) message.error(getApiErrorMessage(error) || "Failed to load announcements");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (
    key: string,
    value: string,
    setSaving: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setSaving(true);
    try {
      await adminUpdateConfig(key, value);
      message.success("Saved");
    } catch (error) {
      message.error(getApiErrorMessage(error) || "Save request failed");
    } finally {
      setSaving(false);
    }
  };

  const renderEditor = (
    content: string,
    setContent: React.Dispatch<React.SetStateAction<string>>,
    saveHandler: () => void,
    saving: boolean
  ) => (
    <Row gutter={24}>
      <Col span={12}>
        <Title level={5}>Markdown Editor</Title>
        <Input.TextArea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={20}
          placeholder="Write Markdown content here..."
          style={{ fontFamily: "monospace" }}
        />
        <Button type="primary" onClick={saveHandler} loading={saving} style={{ marginTop: 16 }}>
          Save changes
        </Button>
      </Col>
      <Col span={12}>
        <Title level={5}>Live Preview</Title>
        <div
          style={{
            padding: 16,
            background: "#fffbe6",
            border: "1px solid #ffe58f",
            borderRadius: 8,
            minHeight: 450,
          }}
        >
          {content ? (
            <ReactMarkdown {...markdownOptions}>{content}</ReactMarkdown>
          ) : (
            <div style={{ color: "#999" }}>No announcement content</div>
          )}
        </div>
      </Col>
    </Row>
  );

  return (
    <Card title="Announcement Management" loading={loading}>
      <Tabs
        defaultActiveKey="zh"
        items={[
          {
            key: "zh",
            label: "Chinese announcement",
            children: renderEditor(
              zhContent,
              setZhContent,
              () => {
                void handleSave("announcement_zh", zhContent, setSavingZh);
              },
              savingZh
            ),
          },
          {
            key: "en",
            label: "English announcement",
            children: renderEditor(
              enContent,
              setEnContent,
              () => {
                void handleSave("announcement_en", enContent, setSavingEn);
              },
              savingEn
            ),
          },
        ]}
      />
    </Card>
  );
}

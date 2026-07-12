"use client";

import { useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";
import { Tabs, Input, Button, message, Card, Row, Col, Typography } from "antd";
import { adminGetConfig, adminUpdateConfig, getApiErrorMessage } from "@/lib/api";
import { markdownOptions } from "@/lib/markdown";

const { Title } = Typography;

/**
 * react-markdown 懒加载（与 Announcement.tsx 同一模式）。
 * 避免把整个 markdown 解析器 + rehype-sanitize 拉进 admin 公告页的首屏 chunk——
 * 预览仅在用户切到编辑 Tab 后才需要。ssr:false：该 Tab 是纯客户端实时预览，
 * 首屏无 SSR 需求；加载中显示占位文案。
 */
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <div style={{ color: "var(--muted)" }}>Loading preview…</div>,
});

/**
 * 预览组件：memo 化，避免编辑器每次按键（TextArea onChange → state 变化 → 父重渲染）
 * 都全量重解析 markdown。props 仅 children（content）与 markdownOptions（模块级常量，
 * 引用稳定），React.memo 浅比较即可在 content 不变时跳过重渲染。
 */
const MarkdownPreview = memo(function MarkdownPreview({ content }: { content: string }) {
  return <ReactMarkdown {...markdownOptions}>{content}</ReactMarkdown>;
});

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
  // 加载时的初始内容快照——用于判断是否有未保存改动。
  const [zhSnapshot, setZhSnapshot] = useState("");
  const [enSnapshot, setEnSnapshot] = useState("");
  // 当前激活的 Tab key，用于切换 Tab 时的未保存提示。
  const [activeTab, setActiveTab] = useState("zh");

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
        setZhSnapshot(zh?.configValue || "");
        setEnSnapshot(en?.configValue || "");
      } catch (error) {
        if (!cancelled) message.error(getApiErrorMessage(error) || "Couldn't load the announcements. Please refresh the page and try again.");
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
      message.success("Announcement saved.");
      // 保存成功后刷新快照，使 dirty 状态正确归零。
      if (key === "announcement_zh") setZhSnapshot(value);
      if (key === "announcement_en") setEnSnapshot(value);
    } catch (error) {
      message.error(getApiErrorMessage(error) || "Couldn't save the announcement. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // 切换 Tab 前检查是否有未保存改动，提示用户确认丢弃。
  const handleTabChange = (nextKey: string) => {
    const currentDirty =
      (activeTab === "zh" && zhContent !== zhSnapshot) ||
      (activeTab === "en" && enContent !== enSnapshot);
    if (currentDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Switching tabs will discard them. Continue?"
      );
      if (!confirmed) return;
      // 丢弃未保存改动，恢复到上次保存的快照。
      if (activeTab === "zh") setZhContent(zhSnapshot);
      if (activeTab === "en") setEnContent(enSnapshot);
    }
    setActiveTab(nextKey);
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
          maxLength={10000}
          showCount
          placeholder="Write your announcement here. Markdown is supported."
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
            background: "var(--surface-alt)",
            border: "1px solid var(--rule)",
            borderRadius: 8,
            minHeight: 450,
          }}
        >
          {content ? (
            <MarkdownPreview content={content} />
          ) : (
            <div style={{ color: "var(--muted)" }}>Nothing to preview yet. Start writing on the left.</div>
          )}
        </div>
      </Col>
    </Row>
  );

  return (
    <Card title="Announcement Management" loading={loading}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
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

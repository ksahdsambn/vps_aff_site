import React, { useEffect, useState } from 'react';
import { Tabs, Input, Button, message, Card, Row, Col, Typography } from 'antd';
import ReactMarkdown from 'react-markdown';
import { adminGetConfig, adminUpdateConfig, getApiErrorMessage } from '../../api';

const { Title } = Typography;

const Announcement: React.FC = () => {
  const [zhContent, setZhContent] = useState('');
  const [enContent, setEnContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingZh, setSavingZh] = useState(false);
  const [savingEn, setSavingEn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      setLoading(true);

      try {
        const res = await adminGetConfig();
        if (cancelled) {
          return;
        }

        if (res.data.code === 0 && res.data.data) {
          const zh = res.data.data.find((item) => item.configKey === 'announcement_zh');
          const en = res.data.data.find((item) => item.configKey === 'announcement_en');
          setZhContent(zh?.configValue || '');
          setEnContent(en?.configValue || '');
        } else {
          message.error(res.data.message || 'Failed to load announcements');
        }
      } catch (error: unknown) {
        if (!cancelled) {
          message.error(getApiErrorMessage(error) || 'Failed to load announcements');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
    setSaving: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    setSaving(true);

    try {
      const res = await adminUpdateConfig(key, value);
      if (res.data.code === 0) {
        message.success('Saved');
      } else {
        message.error(res.data.message || 'Save failed');
      }
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error) || 'Save request failed');
    } finally {
      setSaving(false);
    }
  };

  const renderEditor = (
    content: string,
    setContent: React.Dispatch<React.SetStateAction<string>>,
    saveHandler: () => void,
    saving: boolean,
  ) => (
    <Row gutter={24}>
      <Col span={12}>
        <Title level={5}>Markdown Editor</Title>
        <Input.TextArea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={20}
          placeholder="Write Markdown content here..."
          style={{ fontFamily: 'monospace' }}
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
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: 8,
            minHeight: 450,
          }}
        >
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <div style={{ color: '#999' }}>No announcement content</div>
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
            key: 'zh',
            label: 'Chinese announcement',
            children: renderEditor(
              zhContent,
              setZhContent,
              () => {
                void handleSave('announcement_zh', zhContent, setSavingZh);
              },
              savingZh,
            ),
          },
          {
            key: 'en',
            label: 'English announcement',
            children: renderEditor(
              enContent,
              setEnContent,
              () => {
                void handleSave('announcement_en', enContent, setSavingEn);
              },
              savingEn,
            ),
          },
        ]}
      />
    </Card>
  );
};

export default Announcement;

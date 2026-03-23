import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Space, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { adminGetConfig, adminUpdateConfig, getApiErrorMessage } from '../../api';

type SettingsFormValues = Record<string, string>;

const Settings: React.FC = () => {
  const [form] = Form.useForm<SettingsFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadConfigs = async () => {
      setLoading(true);

      try {
        const res = await adminGetConfig();
        if (cancelled) {
          return;
        }

        if (res.data.code === 0 && res.data.data) {
          const initialValues: SettingsFormValues = {};
          res.data.data.forEach((item) => {
            initialValues[item.configKey] = item.configValue || '';
          });
          form.setFieldsValue(initialValues);
        } else {
          message.error(res.data.message || 'Failed to load settings');
        }
      } catch (error: unknown) {
        if (!cancelled) {
          message.error(getApiErrorMessage(error) || 'Failed to load settings');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
      await Promise.all(
        Object.entries(values).map(([key, value]) => adminUpdateConfig(key, value || '')),
      );
      message.success('Settings saved');
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error) || 'Failed to save settings');
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
        style={{ maxWidth: 800 }}
      >
        <h3
          style={{
            marginTop: 24,
            marginBottom: 16,
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: 8,
          }}
        >
          Basic settings
        </h3>
        <Space size="large" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Form.Item name="site_title_zh" label="Site title (ZH)" rules={[{ required: true }]}>
            <Input placeholder="e.g. VPS Navigator" />
          </Form.Item>
          <Form.Item name="site_title_en" label="Site title (EN)" rules={[{ required: true }]}>
            <Input placeholder="e.g. VPS Navigator" />
          </Form.Item>
        </Space>

        <Form.Item name="site_logo" label="Logo URL" rules={[{ type: 'url', warningOnly: true }]}>
          <Input placeholder="https://example.com/logo.png" />
        </Form.Item>

        <h3
          style={{
            marginTop: 24,
            marginBottom: 16,
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: 8,
          }}
        >
          Social links
        </h3>
        <Space size="large" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Form.Item name="link_telegram" label="Telegram URL" rules={[{ type: 'url' }]}>
            <Input placeholder="https://t.me/..." style={{ width: 300 }} />
          </Form.Item>
          <Form.Item name="link_youtube" label="YouTube URL" rules={[{ type: 'url' }]}>
            <Input placeholder="https://youtube.com/..." style={{ width: 300 }} />
          </Form.Item>
          <Form.Item name="link_x" label="X URL" rules={[{ type: 'url' }]}>
            <Input placeholder="https://x.com/..." style={{ width: 300 }} />
          </Form.Item>
          <Form.Item name="link_blog" label="Blog URL" rules={[{ type: 'url' }]}>
            <Input placeholder="https://yourblog.com" style={{ width: 300 }} />
          </Form.Item>
        </Space>

        <Divider />

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">
            Save changes
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Settings;

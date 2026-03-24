import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage, login } from '../../api';

interface LoginFormValues {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const res = await login(values.username, values.password);
      if (res.data.code === 0 && res.data.data) {
        localStorage.setItem('token', res.data.data.token);
        message.success('Login successful');
        navigate('/admin/products');
      } else {
        message.error(res.data.message || 'Login failed');
      }
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error) || 'Login request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background blobs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: 300,
        height: 300,
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'float 20s infinite alternate',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: 400,
        height: 400,
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        animation: 'float 25s infinite alternate-reverse',
      }} />

      <Card
        title={<div style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, padding: '10px 0' }}>VPS Navigator Admin</div>}
        style={{ 
          width: 420, 
          borderRadius: 24,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'springFadeIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        styles={{ header: { borderBottom: 'none' }, body: { padding: '24px 32px' } }}
      >
        <Form
          name="admin_login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#6366f1' }} />} 
              placeholder="Username" 
              style={{ borderRadius: 12 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#6366f1' }} />} 
              placeholder="Password" 
              style={{ borderRadius: 12 }}
              size="large"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              loading={loading}
              style={{ 
                height: 54, 
                borderRadius: 14, 
                fontSize: 18, 
                fontWeight: 700,
                background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
              }}
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;

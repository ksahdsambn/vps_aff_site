import React from 'react';
import { Layout, Menu, Button } from 'antd';
import {
  AppstoreOutlined,
  NotificationOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const menuItems = [
    {
      key: '/admin/products',
      icon: <AppstoreOutlined />,
      label: '产品管理',
      onClick: () => navigate('/admin/products'),
    },
    {
      key: '/admin/announcement',
      icon: <NotificationOutlined />,
      label: '公告管理',
      onClick: () => navigate('/admin/announcement'),
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: '配置管理',
      onClick: () => navigate('/admin/settings'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Sider 
        breakpoint="lg" 
        collapsedWidth="0"
        style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ 
          height: 64, 
          margin: '16px 20px', 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: 12, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#fff', 
          fontWeight: 800,
          fontSize: '1.1rem',
          letterSpacing: '1px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          NAVIGATOR
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ background: 'transparent', border: 'none' }}
        />
      </Sider>
      <Layout style={{ background: 'transparent' }}>
        <Header style={{ 
          padding: '0 32px', 
          background: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(10px)',
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          height: 72,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Admin Panel</span>
            <Button 
              type="primary" 
              danger 
              ghost
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              style={{ borderRadius: 8 }}
            >
              Logout
            </Button>
          </div>
        </Header>
        <Content style={{ margin: '24px', overflow: 'initial' }}>
          <div style={{ 
            padding: 32, 
            background: '#ffffff', 
            borderRadius: 20, 
            minHeight: 360,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
            animation: 'springFadeIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

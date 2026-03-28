import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#6366f1',
            fontFamily: "'Inter', 'Noto Sans SC', system-ui, -apple-system, sans-serif",
            borderRadius: 12,
            colorSuccess: '#10b981',
            colorWarning: '#f59e0b',
            colorError: '#ef4444',
            colorInfo: '#3b82f6',
            colorBgContainer: '#ffffff',
            colorBgLayout: '#f8fafc',
            controlHeight: 40,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          components: {
            Button: {
              controlHeight: 42,
              paddingInline: 20,
              borderRadius: 10,
              fontWeight: 600,
            },
            Table: {
              headerBg: 'transparent',
              headerColor: '#1e293b',
              headerBorderRadius: 12,
              rowHoverBg: 'rgba(99, 102, 241, 0.05)',
            },
            Card: {
              borderRadiusLG: 16,
              boxShadowTertiary: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
            Input: {
              controlHeight: 42,
              borderRadius: 10,
            },
            Select: {
              controlHeight: 42,
              borderRadius: 10,
            }
          }
        }}
      >
        <App />
      </ConfigProvider>
    </HelmetProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import './i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
          fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
          borderRadius: 8,
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#3b82f6',
        },
        components: {
          Button: {
            controlHeight: 40,
          },
          Table: {
            headerBg: '#ffffff',
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)

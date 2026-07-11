"use client";

import { Layout, Menu } from "antd";
import {
  AppstoreOutlined,
  NotificationOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { adminLogout } from "@/lib/api";
import Button from "@/components/ui/Button";

const { Header, Sider, Content } = Layout;

/**
 * Admin 外壳（Sider + Header + Content）—— Editorial-Data Minimal。
 *
 * AGENTS.md 明确要求 admin 区更冷静、更实用：无弹跳/玻璃态。
 * - Sider：不透明深色平面（var(--ink) 实色，无渐变）。
 * - Header：不透明白底 + hairline 底边（无 backdrop-filter）。
 * - Content：不透明白卡 + hairline 边框（无 springFadeIn 弹跳）。
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    // 先调用后端吊销 token（服务端失效），再清除本地 token 并跳转。
    // adminLogout 内部吞掉错误，确保客户端登出不会被网络问题阻断。
    await adminLogout();
    localStorage.removeItem("token");
    router.replace("/admin/login");
  };

  const menuItems = [
    {
      key: "/admin/products",
      icon: <AppstoreOutlined />,
      label: "产品管理",
      onClick: () => router.push("/admin/products"),
    },
    {
      key: "/admin/announcement",
      icon: <NotificationOutlined />,
      label: "公告管理",
      onClick: () => router.push("/admin/announcement"),
    },
    {
      key: "/admin/settings",
      icon: <SettingOutlined />,
      label: "配置管理",
      onClick: () => router.push("/admin/settings"),
    },
  ];

  // 计算当前选中菜单项（匹配最长前缀）
  const selectedKey =
    menuItems
      .map((m) => m.key)
      .filter((key) => pathname.startsWith(key))
      .sort((a, b) => b.length - a.length)[0] || "/admin/products";

  return (
    <Layout style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={232}
        style={{
          background: "var(--ink)",
          // 深色侧栏与浅色内容之间用半透明白色细线分隔（深底上的 hairline）。
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            paddingLeft: 24,
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "1.05rem",
            letterSpacing: "0.02em",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          NAVIGATOR
        </div>
        <Menu
          // theme="dark" 使用 AntD 内置深色菜单调色板（hover/selected 配色）。
          // 注意：theme.ts 的 Menu.* token 仅对 theme="light" 生效；此处有意用
          // dark，让菜单与 --ink 侧栏协调。暗色菜单的强调色由 AntD 派生自
          // colorPrimary（#4338ca），与设计系统一致。
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ background: "transparent", border: "none", paddingTop: 8 }}
        />
      </Sider>
      <Layout style={{ background: "transparent" }}>
        <Header
          style={{
            padding: "0 24px",
            background: "var(--surface)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            borderBottom: "1px solid var(--rule)",
            height: 60,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Admin Panel</span>
            <Button
              variant="ghost"
              size="middle"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </Header>
        <Content style={{ margin: 24, overflow: "initial" }}>
          <div
            className="surface"
            style={{
              padding: 28,
              minHeight: 360,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

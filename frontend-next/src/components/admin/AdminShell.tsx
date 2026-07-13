"use client";

import { Layout, Menu, Drawer, Grid } from "antd";
import {
  AppstoreOutlined,
  NotificationOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminLogout } from "@/lib/api";
import Button from "@/components/ui/Button";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

/**
 * Admin 外壳（Sider + Header + Content）—— Editorial-Data Minimal。
 *
 * AGENTS.md 明确要求 admin 区更冷静、更实用：无弹跳/玻璃态。
 * - Sider：不透明深色平面（var(--ink) 实色，无渐变）。
 * - Header：不透明白底 + hairline 底边（无 backdrop-filter）。
 * - Content：不透明白卡 + hairline 边框（无 springFadeIn 弹跳）。
 *
 * 响应式：≥lg 用常驻 Sider；<lg（平板/手机）Sider 折叠为 0 宽，改由 Header 中的
 * 汉堡按钮唤出左侧 Drawer 承载导航——否则 <lg 下 admin 不可导航。useBreakpoint
 * 是 AntD 内置响应式 hook，无新依赖。
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const screens = useBreakpoint();
  const isDesktop = Boolean(screens.lg);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // 登出中状态：禁用按钮 + loading，防止重复点击发送多个 /admin/logout 请求。
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      // 服务端吊销并清除 HttpOnly Cookie；网络失败也不阻断本地跳转。
      await adminLogout();
    } finally {
      router.replace("/admin/login");
    }
  };

  const menuItems = [
    {
      key: "/admin/products",
      icon: <AppstoreOutlined />,
      label: "Products",
      onClick: () => {
        router.push("/admin/products");
        setDrawerOpen(false);
      },
    },
    {
      key: "/admin/announcement",
      icon: <NotificationOutlined />,
      label: "Announcement",
      onClick: () => {
        router.push("/admin/announcement");
        setDrawerOpen(false);
      },
    },
    {
      key: "/admin/settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => {
        router.push("/admin/settings");
        setDrawerOpen(false);
      },
    },
  ];

  // 计算当前选中菜单项（匹配最长前缀）
  const selectedKey =
    menuItems
      .map((m) => m.key)
      .filter((key) => pathname.startsWith(key))
      .sort((a, b) => b.length - a.length)[0] || "/admin/products";

  // 深色侧栏 / Drawer 头部品牌块（桌面 Sider 与移动 Drawer 共用）。
  const brand = (
    <div
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        paddingLeft: 20,
        color: "var(--accent-contrast)",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: "1.05rem",
        letterSpacing: "0.02em",
        borderBottom: "1px solid var(--rule-inverse)",
      }}
    >
      NAVIGATOR
    </div>
  );

  const navMenu = (
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
  );

  return (
    <Layout style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {isDesktop && (
        <Sider
          width={232}
          style={{
            background: "var(--ink)",
            // 深色侧栏与浅色内容之间用 inverse hairline 分隔（深底上的细线）。
            borderRight: "1px solid var(--rule-inverse)",
          }}
        >
          {brand}
          {navMenu}
        </Sider>
      )}

      {/* <lg：常驻 Drawer 承载深色导航（不透明 --ink，无渐变）。 */}
      {!isDesktop && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={232}
          closable={false}
          styles={{ body: { padding: 0, background: "var(--ink)" }, header: { display: "none" } }}
        >
          {brand}
          {navMenu}
        </Drawer>
      )}

      <Layout style={{ background: "transparent" }}>
        <Header
          style={{
            padding: "0 clamp(12px, 3vw, 24px)",
            background: "var(--surface)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid var(--rule)",
            height: 60,
          }}
        >
          {/* <lg：汉堡按钮唤出 Drawer（44px 触达）。≥lg 时该按钮隐藏。 */}
          {!isDesktop && (
            <Button
              variant="text"
              size="middle"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              style={{ color: "var(--ink)" }}
            />
          )}
          {isDesktop && <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Admin Panel</span>}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              variant="ghost"
              size="middle"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              loading={loggingOut}
              disabled={loggingOut}
            >
              Logout
            </Button>
          </div>
        </Header>
        <Content style={{ margin: "clamp(12px, 2vw, 24px)", overflow: "initial" }}>
          <div
            className="surface"
            style={{
              padding: "clamp(16px, 3vw, 28px)",
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

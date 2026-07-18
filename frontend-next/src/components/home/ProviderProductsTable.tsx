"use client";

import { Table, Tooltip, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { QuestionCircleOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { Product } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import Button from "@/components/ui/Button";
import { formatNum, formatTraffic, formatBandwidth, formatPrice } from "@/lib/format";
import { goLink } from "@/lib/links";
import styles from "./ProviderProductsTable.module.css";

/**
 * 服务商聚合页的产品表格（客户端组件）—— Editorial-Data Minimal。
 * AntD Table 需要 ConfigProvider 上下文，故提取为 client island。
 * 样式与桌面端 ProductTable 一致：不透明面板、tabular-nums、实色 chip、共享 Button。
 */
export default function ProviderProductsTable({
  products,
  locale,
}: {
  products: Product[];
  locale: Locale;
}) {
  const { t } = useTranslation();

  const columns: ColumnsType<Product> = [
    {
      title: t("table.name"),
      dataIndex: "name",
      key: "name",
      width: 160,
      ellipsis: true,
      render: (text, record) => (
        <Link href={`/${locale}/products/${record.id}`} className={styles.nameLink}>
          {text}
        </Link>
      ),
    },
    {
      title: t("table.cpu"),
      dataIndex: "cpu",
      key: "cpu",
      width: 90,
      render: (val: number) => (
        <span className="num" style={{ fontSize: 13, color: "var(--text)" }}>
          {formatNum(val)} {t("table.cpuUnit")}
        </span>
      ),
    },
    {
      title: t("table.memory"),
      dataIndex: "memory",
      key: "memory",
      width: 90,
      render: (val: number) => (
        <span className="num" style={{ fontSize: 13, color: "var(--text)" }}>
          {formatNum(val)} {t("table.memoryUnit")}
        </span>
      ),
    },
    {
      title: t("table.disk"),
      dataIndex: "disk",
      key: "disk",
      width: 90,
      render: (val: number) => (
        <span className="num" style={{ fontSize: 13, color: "var(--text)" }}>
          {formatNum(val)} {t("table.diskUnit")}
        </span>
      ),
    },
    {
      title: t("table.monthlyTraffic"),
      dataIndex: "monthlyTraffic",
      key: "monthlyTraffic",
      width: 110,
      render: (val: number) => (
        <span className="num" style={{ fontSize: 13, color: "var(--text)" }}>
          {formatTraffic(val)} TB
        </span>
      ),
    },
    {
      title: t("table.bandwidth"),
      dataIndex: "bandwidth",
      key: "bandwidth",
      width: 110,
      render: (val: number) => (
        <span className="num" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
          {formatBandwidth(val)} Gbps
        </span>
      ),
    },
    {
      title: t("table.location"),
      dataIndex: "location",
      key: "location",
      width: 100,
      ellipsis: true,
      render: (text: string) => (
        <span style={{ fontSize: 13, color: "var(--text)" }}>{text || "—"}</span>
      ),
    },
    {
      title: (
        <span>
          {t("table.price")}
          <Tooltip title={t("table.priceSortTip")}>
            <QuestionCircleOutlined style={{ marginLeft: 4, color: "var(--muted)" }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "price",
      key: "price",
      width: 130,
      render: (val: number, record: Product) => (
        <span className="num" style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>
          {formatPrice(val, record.currency)}
        </span>
      ),
    },
    {
      title: t("table.order"),
      key: "order",
      width: 110,
      align: "center" as const,
      render: (_, record: Product) => (
        <Button
          variant="primary"
          size="middle"
          href={goLink(record.id)}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          icon={<ShoppingCartOutlined />}
        >
          {t("table.orderButton")}
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={products}
      rowKey="id"
      pagination={false}
      scroll={{ x: "max-content" }}
      locale={{ emptyText: <Empty description={t("table.noData")} /> }}
    />
  );
}

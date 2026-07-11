"use client";

import { Table, Tag, Button, Typography, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { QuestionCircleOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { Product } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

/**
 * 服务商聚合页的产品表格（客户端组件）。
 * AntD Table 需要 ConfigProvider 上下文，故提取为 client island。
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
      render: (text, record) => (
        <Link href={`/${locale}/products/${record.id}`}>
          <Typography.Text strong style={{ color: "#475569" }}>
            {text}
          </Typography.Text>
        </Link>
      ),
    },
    {
      title: t("table.cpu"),
      dataIndex: "cpu",
      key: "cpu",
      width: 80,
      render: (val: number) => (
        <Typography.Text style={{ fontSize: 13 }}>
          {val} {t("table.cpuUnit")}
        </Typography.Text>
      ),
    },
    {
      title: t("table.memory"),
      dataIndex: "memory",
      key: "memory",
      width: 80,
      render: (val: number) => <Typography.Text style={{ fontSize: 13 }}>{val} {t("table.memoryUnit")}</Typography.Text>,
    },
    {
      title: t("table.disk"),
      dataIndex: "disk",
      key: "disk",
      width: 80,
      render: (val: number) => <Typography.Text style={{ fontSize: 13 }}>{val} {t("table.diskUnit")}</Typography.Text>,
    },
    {
      title: t("table.monthlyTraffic"),
      dataIndex: "monthlyTraffic",
      key: "monthlyTraffic",
      width: 100,
      render: (val: number) => <Tag color="cyan">{(val / 1000).toFixed(2)} TB</Tag>,
    },
    {
      title: t("table.bandwidth"),
      dataIndex: "bandwidth",
      key: "bandwidth",
      width: 100,
      render: (val: number) => (
        <Typography.Text strong style={{ color: "#0ea5e9" }}>
          {(val / 1000).toFixed(2)} Gbps
        </Typography.Text>
      ),
    },
    {
      title: t("table.location"),
      dataIndex: "location",
      key: "location",
      width: 80,
    },
    {
      title: (
        <span>
          {t("table.price")}
          <Tooltip title={t("table.priceSortTip")}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (val: number, record: Product) => (
        <span style={{ fontSize: 16, fontWeight: 700, color: "#4f46e5" }}>
          {val.toFixed(2)} {record.currency}
        </span>
      ),
    },
    {
      title: t("table.order"),
      key: "order",
      width: 100,
      render: (_, record: Product) => (
        <Button
          type="primary"
          href={record.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ShoppingCartOutlined />}
          style={{
            borderRadius: 6,
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            border: "none",
            fontSize: 12,
            fontWeight: 600,
            height: 28,
            padding: "0 12px",
          }}
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
    />
  );
}

"use client";

import React from "react";
import { Table, Tooltip, Typography, Empty } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { QuestionCircleOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import type { Product } from "@/lib/api";
import Button from "@/components/ui/Button";
import { formatNum, formatTraffic, formatBandwidth, formatPrice } from "@/lib/format";

const { Text } = Typography;

interface ProductTableProps {
  data: Product[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onChange: TableProps<Product>["onChange"];
}

/**
 * 桌面端产品表格（客户端组件）—— Editorial-Data Minimal。
 *
 * 不透明面板 + hairline 边框（无 glass-panel）。数值列用 .num（tabular-nums）对齐。
 * 服务商为实色 chip（accent-soft 底），价格为 accent 实色，下单按钮走共享 Button。
 * 接收服务端 SSG 预取的初始产品数据作为首帧内容（爬虫可见）。
 */
const ProductTable: React.FC<ProductTableProps> = ({ data, loading, pagination, onChange }) => {
  const { t } = useTranslation();

  const columns: ColumnsType<Product> = [
    {
      title: t("table.provider"),
      dataIndex: "provider",
      key: "provider",
      width: 110,
      ellipsis: true,
      render: (text) => (
        <span
          style={{
            display: "inline-block",
            maxWidth: "100%",
            padding: "2px 10px",
            borderRadius: 6,
            background: "var(--accent-soft)",
            color: "var(--accent)",
            fontSize: 12,
            fontWeight: 600,
            lineHeight: "20px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            verticalAlign: "middle",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: t("table.name"),
      dataIndex: "name",
      key: "name",
      width: 160,
      ellipsis: true,
      render: (text) => (
        <Text strong style={{ color: "var(--ink)" }}>
          {text}
        </Text>
      ),
    },
    {
      title: t("table.cpu"),
      dataIndex: "cpu",
      key: "cpu",
      sorter: true,
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
      sorter: true,
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
      sorter: true,
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
      sorter: true,
      render: (val: number) => (
        <span
          className="num"
          style={{ fontSize: 13, color: "var(--text)" }}
        >
          {formatTraffic(val)} TB
        </span>
      ),
    },
    {
      title: t("table.bandwidth"),
      dataIndex: "bandwidth",
      key: "bandwidth",
      width: 110,
      sorter: true,
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
      sorter: true,
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
          href={record.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ShoppingCartOutlined />}
        >
          {t("table.orderButton")}
        </Button>
      ),
    },
  ];

  return (
    <div
      className="surface page-enter"
      style={{
        padding: 0,
        margin: "0 0 24px",
        overflow: "hidden",
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <Empty description={t("table.noData")} /> }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["20", "50", "100"],
          showTotal: (total) => t("table.total", { total }),
          position: ["bottomCenter"],
        }}
        onChange={onChange}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default ProductTable;

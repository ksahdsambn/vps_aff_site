"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Select,
  InputNumber,
  Space,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  adminGetProducts,
  adminAddProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  getApiErrorMessage,
} from "@/lib/api";
import type { Product, ProductFormData, ProductUpdatePayload } from "@/lib/api";

const { Option } = Select;

/**
 * 浮点安全比较：判断数值字段是否"实质改变"。
 *
 * 直接用 `!==` 比较 number 时，浮点精度往返（DB Float → JSON → InputNumber → 回传）
 * 可能产生微小误差（如 24.0 vs 24.00000001）导致未改动字段被误判为已改动并发送。
 * 此函数使用相对容差（1e-9）进行比较，消除浮点噪声。
 */
function numChanged(a: number | null | undefined, b: number | null | undefined): boolean {
  if (a == null && b == null) return false;
  if (a == null || b == null) return true;
  return Math.abs(a - b) > 1e-9 * Math.max(Math.abs(a), Math.abs(b), 1);
}

interface ProductFormValues {
  provider: string;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  monthlyTrafficValue: number;
  monthlyTrafficUnit: "GB" | "TB";
  bandwidthValue: number;
  bandwidthUnit: "Mbps" | "Gbps";
  location: string;
  price: number;
  currency: string;
  reviewUrl?: string;
  remark?: string;
  affiliateUrl: string;
}

/**
 * Admin 产品管理（客户端组件）。
 *
 * 从旧前端 Products.tsx 迁移：
 * - API 调用改为新的解包封装（adminGetProducts 等直接返回数据，非 axios res）。
 * - 编辑模式 diff 算法保留（只发送改动字段，见 Bug #5）。
 */
export default function AdminProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<Product | null>(null);
  const [form] = Form.useForm<ProductFormValues>();

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      setLoading(true);
      try {
        const result = await adminGetProducts({ page, pageSize, keyword });
        if (cancelled) return;
        setData(result.list);
        setTotal(result.total);
      } catch (error) {
        if (!cancelled) message.error(getApiErrorMessage(error) || "Couldn't load products. Please refresh the page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, keyword, reloadVersion]);

  const refreshCurrentPage = () => setReloadVersion((v) => v + 1);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? 20);
  };

  const handleSearch = (value: string) => {
    const normalizedValue = value.trim();
    setSearchInput(normalizedValue);
    setKeyword(normalizedValue);
    setPage(1);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    if (value.trim() === "") {
      setKeyword("");
      setPage(1);
    }
  };

  const showAddModal = () => {
    setEditingId(null);
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ monthlyTrafficUnit: "GB", bandwidthUnit: "Mbps", currency: "USD" });
    setIsModalVisible(true);
  };

  const showEditModal = (record: Product) => {
    setEditingId(record.id);
    setEditingRecord(record);
    form.setFieldsValue({
      provider: record.provider,
      name: record.name,
      cpu: record.cpu,
      memory: record.memory,
      disk: record.disk,
      monthlyTrafficValue: record.monthlyTraffic,
      monthlyTrafficUnit: "GB",
      bandwidthValue: record.bandwidth,
      bandwidthUnit: "Mbps",
      location: record.location,
      price: record.price,
      currency: record.currency,
      reviewUrl: record.reviewUrl || undefined,
      remark: record.remark || undefined,
      affiliateUrl: record.affiliateUrl,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await adminDeleteProduct(id);
      message.success("Product deleted.");
      if (data.length === 1 && page > 1) {
        setPage((c) => c - 1);
      } else {
        refreshCurrentPage();
      }
    } catch (error) {
      message.error(getApiErrorMessage(error) || "Couldn't delete the product. Please try again.");
    }
  };

  const handleModalOk = async () => {
    let values: ProductFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const currency = values.currency.toUpperCase();

    try {
      if (editingId !== null && editingRecord) {
        const payload: ProductUpdatePayload = {};
        if (values.provider !== editingRecord.provider) payload.provider = values.provider;
        if (values.name !== editingRecord.name) payload.name = values.name;
        if (numChanged(values.cpu, editingRecord.cpu)) payload.cpu = values.cpu;
        if (numChanged(values.memory, editingRecord.memory)) payload.memory = values.memory;
        if (numChanged(values.disk, editingRecord.disk)) payload.disk = values.disk;
        if (values.location !== editingRecord.location) payload.location = values.location;
        if (numChanged(values.price, editingRecord.price)) payload.price = values.price;
        if (currency !== editingRecord.currency) payload.currency = currency;
        const newReviewUrl = values.reviewUrl || null;
        if ((newReviewUrl ?? null) !== (editingRecord.reviewUrl ?? null))
          payload.reviewUrl = newReviewUrl;
        const newRemark = values.remark || null;
        if ((newRemark ?? null) !== (editingRecord.remark ?? null)) payload.remark = newRemark;
        if (values.affiliateUrl !== editingRecord.affiliateUrl) payload.affiliateUrl = values.affiliateUrl;

        const trafficNormalized =
          values.monthlyTrafficUnit === "TB"
            ? values.monthlyTrafficValue * 1000
            : values.monthlyTrafficValue;
        if (numChanged(trafficNormalized, editingRecord.monthlyTraffic)) {
          payload.monthlyTraffic = {
            value: values.monthlyTrafficValue,
            unit: values.monthlyTrafficUnit,
          };
        }

        const bandwidthNormalized =
          values.bandwidthUnit === "Gbps"
            ? values.bandwidthValue * 1000
            : values.bandwidthValue;
        if (numChanged(bandwidthNormalized, editingRecord.bandwidth)) {
          payload.bandwidth = {
            value: values.bandwidthValue,
            unit: values.bandwidthUnit,
          };
        }

        await adminUpdateProduct(editingId, payload);
        message.success("Product updated.");
        setIsModalVisible(false);
        refreshCurrentPage();
        return;
      }

      const payload: ProductFormData = {
        provider: values.provider,
        name: values.name,
        cpu: values.cpu,
        memory: values.memory,
        disk: values.disk,
        monthlyTraffic: { value: values.monthlyTrafficValue, unit: values.monthlyTrafficUnit },
        bandwidth: { value: values.bandwidthValue, unit: values.bandwidthUnit },
        location: values.location,
        price: values.price,
        currency,
        reviewUrl: values.reviewUrl,
        remark: values.remark,
        affiliateUrl: values.affiliateUrl,
      };

      await adminAddProduct(payload);
      message.success("Product created.");
      setIsModalVisible(false);
      setPage(1);
      refreshCurrentPage();
    } catch (error) {
      message.error(getApiErrorMessage(error) || "Couldn't save the product. Please try again.");
    }
  };

  const columns: ColumnsType<Product> = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Provider", dataIndex: "provider", key: "provider" },
    { title: "Product", dataIndex: "name", key: "name" },
    { title: "CPU", dataIndex: "cpu", key: "cpu" },
    { title: "Memory (GB)", dataIndex: "memory", key: "memory" },
    { title: "Disk (GB)", dataIndex: "disk", key: "disk" },
    { title: "Traffic (GB)", dataIndex: "monthlyTraffic", key: "monthlyTraffic" },
    { title: "Bandwidth (Mbps)", dataIndex: "bandwidth", key: "bandwidth" },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (value: number, record: Product) => `${value} ${record.currency}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_value: unknown, record: Product) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete this product?" description="This can't be undone." okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Input.Search
          placeholder="Search provider or product"
          value={searchInput}
          onSearch={handleSearch}
          onChange={(event) => handleSearchInputChange(event.target.value)}
          style={{ width: "min(320px, 100%)", flex: 1, minWidth: 200 }}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
          Add product
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, pageSize, total, showSizeChanger: true }}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={editingId !== null ? "Edit product" : "Add product"}
        open={isModalVisible}
        onOk={() => void handleModalOk()}
        onCancel={() => setIsModalVisible(false)}
        width="min(800px, 92vw)"
      >
        <Form form={form} layout="vertical">
          <Space size="large" style={{ display: "flex" }} wrap>
            <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
              <Input placeholder="e.g. Vultr" />
            </Form.Item>
            <Form.Item name="name" label="Product name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Cloud Compute" style={{ width: 250 }} />
            </Form.Item>
            <Form.Item name="location" label="Location" rules={[{ required: true }]}>
              <Input placeholder="e.g. Los Angeles" />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: "flex" }} wrap>
            <Form.Item name="cpu" label="CPU cores" rules={[{ required: true }]}>
              <InputNumber min={1} precision={0} />
            </Form.Item>
            <Form.Item name="memory" label="Memory (GB)" rules={[{ required: true }]}>
              <InputNumber min={0.1} step={0.1} />
            </Form.Item>
            <Form.Item name="disk" label="Disk (GB)" rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: "flex" }} wrap>
            <Form.Item
              label="Monthly traffic"
              required
              tooltip="Stored in GB. When editing, the value shows as originally entered — check the unit before changing. Leave it untouched to keep the current value."
            >
              <Input.Group compact>
                <Form.Item name="monthlyTrafficValue" noStyle rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: "60%" }} />
                </Form.Item>
                <Form.Item name="monthlyTrafficUnit" noStyle>
                  <Select style={{ width: "40%" }}>
                    <Option value="GB">GB</Option>
                    <Option value="TB">TB</Option>
                  </Select>
                </Form.Item>
              </Input.Group>
            </Form.Item>

            <Form.Item
              label="Bandwidth"
              required
              tooltip="Stored in Mbps. When editing, the value shows as originally entered — check the unit before changing. Leave it untouched to keep the current value."
            >
              <Input.Group compact>
                <Form.Item name="bandwidthValue" noStyle rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: "60%" }} />
                </Form.Item>
                <Form.Item name="bandwidthUnit" noStyle>
                  <Select style={{ width: "40%" }}>
                    <Option value="Mbps">Mbps</Option>
                    <Option value="Gbps">Gbps</Option>
                  </Select>
                </Form.Item>
              </Input.Group>
            </Form.Item>

            <Form.Item label="Annual price" required>
              <Input.Group compact>
                <Form.Item name="price" noStyle rules={[{ required: true }]}>
                  <InputNumber min={0} step={0.01} style={{ width: "60%" }} />
                </Form.Item>
                <Form.Item name="currency" noStyle rules={[{ required: true, len: 3 }]}>
                  <Input placeholder="USD" style={{ width: "40%" }} maxLength={3} />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Space>

          <Form.Item name="affiliateUrl" label="Affiliate URL" rules={[{ required: true, type: "url" }]}>
            <Input placeholder="https://provider.com/order?aff=..." />
          </Form.Item>

          <Form.Item name="reviewUrl" label="Review URL" rules={[{ type: "url" }]}>
            <Input placeholder="https://yourblog.com/review/..." />
          </Form.Item>

          <Form.Item name="remark" label="Remark">
            <Input.TextArea placeholder="Optional notes shown to users (e.g. limited stock, promo code)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

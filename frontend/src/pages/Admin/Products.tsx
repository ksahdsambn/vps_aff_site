import React, { useEffect, useState } from 'react';
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
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  adminGetProducts,
  adminAddProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  getApiErrorMessage,
} from '../../api';
import type { Product, ProductFormData } from '../../api';

const { Option } = Select;

interface ProductFormValues {
  provider: string;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  monthlyTrafficValue: number;
  monthlyTrafficUnit: 'GB' | 'TB';
  bandwidthValue: number;
  bandwidthUnit: 'Mbps' | 'Gbps';
  location: string;
  price: number;
  currency: string;
  reviewUrl?: string;
  remark?: string;
  affiliateUrl: string;
}

const Products: React.FC = () => {
  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<ProductFormValues>();

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);

      try {
        const res = await adminGetProducts({ page, pageSize, keyword });
        if (cancelled) {
          return;
        }

        if (res.data.code === 0 && res.data.data) {
          setData(res.data.data.list);
          setTotal(res.data.data.total);
        } else {
          message.error(res.data.message || 'Failed to load products');
        }
      } catch (error: unknown) {
        if (!cancelled) {
          message.error(getApiErrorMessage(error) || 'Failed to load products');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, keyword, reloadVersion]);

  const refreshCurrentPage = () => {
    setReloadVersion((value) => value + 1);
  };

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
    if (value.trim() === '') {
      setKeyword('');
      setPage(1);
    }
  };

  const showAddModal = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      monthlyTrafficUnit: 'GB',
      bandwidthUnit: 'Mbps',
      currency: 'USD',
    });
    setIsModalVisible(true);
  };

  const showEditModal = (record: Product) => {
    setEditingId(record.id);
    form.setFieldsValue({
      provider: record.provider,
      name: record.name,
      cpu: record.cpu,
      memory: record.memory,
      disk: record.disk,
      monthlyTrafficValue: record.monthlyTraffic,
      monthlyTrafficUnit: 'GB',
      bandwidthValue: record.bandwidth,
      bandwidthUnit: 'Mbps',
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
      const res = await adminDeleteProduct(id);
      if (res.data.code !== 0) {
        message.error(res.data.message || 'Delete failed');
        return;
      }

      message.success('Product deleted');
      if (data.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        refreshCurrentPage();
      }
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error) || 'Delete request failed');
    }
  };

  const handleModalOk = async () => {
    let values: ProductFormValues;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const payload: ProductFormData = {
      provider: values.provider,
      name: values.name,
      cpu: values.cpu,
      memory: values.memory,
      disk: values.disk,
      monthlyTraffic: {
        value: values.monthlyTrafficValue,
        unit: values.monthlyTrafficUnit,
      },
      bandwidth: {
        value: values.bandwidthValue,
        unit: values.bandwidthUnit,
      },
      location: values.location,
      price: values.price,
      currency: values.currency.toUpperCase(),
      reviewUrl: values.reviewUrl,
      remark: values.remark,
      affiliateUrl: values.affiliateUrl,
    };

    try {
      if (editingId !== null) {
        const res = await adminUpdateProduct(editingId, payload);
        if (res.data.code !== 0) {
          message.error(res.data.message || 'Update failed');
          return;
        }

        message.success('Product updated');
        setIsModalVisible(false);
        refreshCurrentPage();
        return;
      }

      const res = await adminAddProduct(payload);
      if (res.data.code !== 0) {
        message.error(res.data.message || 'Create failed');
        return;
      }

      message.success('Product created');
      setIsModalVisible(false);
      setPage(1);
      refreshCurrentPage();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error) || 'Save failed');
    }
  };

  const columns: ColumnsType<Product> = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Provider', dataIndex: 'provider', key: 'provider' },
    { title: 'Product', dataIndex: 'name', key: 'name' },
    { title: 'CPU', dataIndex: 'cpu', key: 'cpu' },
    { title: 'Memory (GB)', dataIndex: 'memory', key: 'memory' },
    { title: 'Disk (GB)', dataIndex: 'disk', key: 'disk' },
    { title: 'Traffic (GB)', dataIndex: 'monthlyTraffic', key: 'monthlyTraffic' },
    { title: 'Bandwidth (Mbps)', dataIndex: 'bandwidth', key: 'bandwidth' },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (value: number, record: Product) => `${value} ${record.currency}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_value: unknown, record: Product) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete this product?" onConfirm={() => handleDelete(record.id)}>
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
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <Input.Search
          placeholder="Search provider or product"
          value={searchInput}
          onSearch={handleSearch}
          onChange={(event) => handleSearchInputChange(event.target.value)}
          style={{ width: 320 }}
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
      />

      <Modal
        title={editingId !== null ? 'Edit product' : 'Add product'}
        open={isModalVisible}
        onOk={() => void handleModalOk()}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Space size="large" style={{ display: 'flex' }}>
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

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="cpu" label="CPU cores" rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="memory" label="Memory (GB)" rules={[{ required: true }]}>
              <InputNumber min={0.1} step={0.1} />
            </Form.Item>
            <Form.Item name="disk" label="Disk (GB)" rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item label="Monthly traffic" required>
              <Input.Group compact>
                <Form.Item name="monthlyTrafficValue" noStyle rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: '60%' }} />
                </Form.Item>
                <Form.Item name="monthlyTrafficUnit" noStyle>
                  <Select style={{ width: '40%' }}>
                    <Option value="GB">GB</Option>
                    <Option value="TB">TB</Option>
                  </Select>
                </Form.Item>
              </Input.Group>
            </Form.Item>

            <Form.Item label="Bandwidth" required>
              <Input.Group compact>
                <Form.Item name="bandwidthValue" noStyle rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: '60%' }} />
                </Form.Item>
                <Form.Item name="bandwidthUnit" noStyle>
                  <Select style={{ width: '40%' }}>
                    <Option value="Mbps">Mbps</Option>
                    <Option value="Gbps">Gbps</Option>
                  </Select>
                </Form.Item>
              </Input.Group>
            </Form.Item>

            <Form.Item label="Annual price" required>
              <Input.Group compact>
                <Form.Item name="price" noStyle rules={[{ required: true }]}>
                  <InputNumber min={0} step={0.01} style={{ width: '60%' }} />
                </Form.Item>
                <Form.Item name="currency" noStyle rules={[{ required: true, len: 3 }]}>
                  <Input placeholder="USD" style={{ width: '40%' }} maxLength={3} />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Space>

          <Form.Item
            name="affiliateUrl"
            label="Affiliate URL"
            rules={[{ required: true, type: 'url' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="reviewUrl" label="Review URL" rules={[{ type: 'url' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="remark" label="Remark">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;

import axios from 'axios';

// ============================
// Axios 实例配置
// ============================

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================
// 请求拦截器：自动附加 Token
// ============================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================
// 响应拦截器：401 清 Token 跳登录
// ============================

api.interceptors.response.use(
  (response) => {
    // 检查业务错误码 401（Token 过期或未登录）
    if (response.data && response.data.code === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
      return Promise.reject(new Error('Unauthorized'));
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ============================
// 类型定义
// ============================

export interface ProductListParams {
  providers?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  keyword?: string;
  location?: string;
}

export interface AdminProductListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  isDeleted?: boolean;
}

export interface TrafficInput {
  value: number;
  unit: 'GB' | 'TB';
}

export interface BandwidthInput {
  value: number;
  unit: 'Mbps' | 'Gbps';
}

export interface ProductFormData {
  provider: string;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  monthlyTraffic: TrafficInput;
  bandwidth: BandwidthInput;
  location: string;
  price: number;
  currency: string;
  reviewUrl?: string;
  remark?: string;
  affiliateUrl: string;
}

export interface Product {
  id: number;
  provider: string;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  monthlyTraffic: number;
  bandwidth: number;
  location: string;
  price: number;
  currency: string;
  reviewUrl: string | null;
  remark: string | null;
  affiliateUrl: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  list: T[];
}

export interface FrontendConfig {
  announcement_zh: string;
  announcement_en: string;
  link_telegram: string;
  link_youtube: string;
  link_blog: string;
  link_x: string;
  site_title_zh: string;
  site_title_en: string;
  site_logo: string;
}

export interface SystemConfigItem {
  id: number;
  configKey: string;
  configValue: string | null;
  description: string | null;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: string;
}

export interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

export const getApiErrorMessage = (error: unknown): string | undefined => {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return undefined;
};

export const getApiStatusCode = (error: unknown): number | undefined => {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
};

// ============================
// 前端公开 API
// ============================

/** 获取前端产品列表 */
export const getProducts = (params?: ProductListParams) =>
  api.get<ApiResponse<PaginatedResponse<Product>>>('/products', { params });

/** 获取服务商列表 */
export const getProviders = () =>
  api.get<ApiResponse<string[]>>('/providers');

/** 获取前端系统配置 */
export const getConfig = () =>
  api.get<ApiResponse<FrontendConfig>>('/config');

// ============================
// 后台管理 API
// ============================

/** 管理员登录 */
export const login = (username: string, password: string) =>
  api.post<ApiResponse<LoginResponse>>('/admin/login', { username, password });

/** 后台获取产品列表 */
export const adminGetProducts = (params?: AdminProductListParams) =>
  api.get<ApiResponse<PaginatedResponse<Product>>>('/admin/products', { params });

/** 添加产品 */
export const adminAddProduct = (data: ProductFormData) =>
  api.post<ApiResponse<Product>>('/admin/products', data);

/** 更新产品 */
export const adminUpdateProduct = (id: number, data: ProductFormData) =>
  api.put<ApiResponse<Product>>(`/admin/products/${id}`, data);

/** 删除产品 */
export const adminDeleteProduct = (id: number) =>
  api.delete<ApiResponse<null>>(`/admin/products/${id}`);

/** 后台获取所有配置 */
export const adminGetConfig = () =>
  api.get<ApiResponse<SystemConfigItem[]>>('/admin/config');

/** 更新配置项 */
export const adminUpdateConfig = (configKey: string, configValue: string) =>
  api.put<ApiResponse<SystemConfigItem>>('/admin/config', { configKey, configValue });

export default api;

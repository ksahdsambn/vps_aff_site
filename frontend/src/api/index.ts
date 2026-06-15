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

/**
 * 产品更新 payload：所有字段可选。
 * 后端 updateProduct 已按 PATCH 语义实现，仅更新 body 中出现的字段。
 * 编辑场景下前端应只发送本次实际改动的字段，避免「未改动的字段被
 * 用默认单位重新换算一次」导致的数据扭曲（见 Bug #5）。
 */
export type ProductUpdatePayload = Partial<ProductFormData>;

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

/**
 * 解析 JWT 并判断是否已过期（或格式无效）。
 *
 * 仅做本地 exp 校验，不验证签名（签名验证由后端负责）。
 * 用于 AuthGuard 在渲染受保护页面之前提前拦截已过期/损坏的 token，
 * 避免页面挂载后才在每个 API 请求上收到 401 再硬跳转，造成 UI 闪烁。
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) {
    return true;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return true;
  }

  try {
    // JWT payload 使用 base64url 编码：补齐 padding 并转换 URL 安全字符。
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    // atob 在浏览器环境可用；Node 19+ 也提供全局 atob。
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (typeof payload.exp !== 'number') {
      // 没有 exp 字段，视为无效。
      return true;
    }

    // exp 是秒级时间戳。留 1 秒缓冲避免边界竞争。
    return payload.exp * 1000 <= Date.now() + 1000;
  } catch {
    return true;
  }
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

/** 更新产品（仅发送改动的字段） */
export const adminUpdateProduct = (id: number, data: ProductUpdatePayload) =>
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

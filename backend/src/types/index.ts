import { Request } from 'express';

// ============================
// Express 扩展类型
// ============================

/**
 * 带有管理员信息的认证请求
 */
export interface AuthRequest extends Request {
  admin?: {
    adminId: number;
    username: string;
  };
}

// ============================
// 统一响应类型
// ============================

export interface SuccessResponse<T = unknown> {
  code: 0;
  data: T;
}

export interface ErrorResponse {
  code: number;
  message: string;
}

// ============================
// Product 相关类型
// ============================

/**
 * 月流量输入（带单位）
 */
export interface TrafficInput {
  value: number;
  unit: 'GB' | 'TB';
}

/**
 * 带宽输入（带单位）
 */
export interface BandwidthInput {
  value: number;
  unit: 'Mbps' | 'Gbps';
}

/**
 * 添加/更新产品请求体
 */
export interface ProductCreateInput {
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
 * 前端产品列表查询参数
 */
export interface ProductListQuery {
  providers?: string;      // 逗号分隔的服务商列表
  sortField?: string;      // 排序字段
  sortOrder?: 'asc' | 'desc';  // 排序方向
  page?: number;           // 页码，默认 1
  pageSize?: number;       // 每页数量，默认 50
  keyword?: string;        // 产品名称搜索关键词
  location?: string;       // 位置搜索关键词
}

/**
 * 后台产品列表查询参数
 *
 * 注意：Express 的 req.query 恒为字符串/字符串数组，运行时不会是真正的
 * number/boolean。这里保留 TS 类型以便阅读，但 controller 中需对 isDeleted
 * / page / pageSize 等显式做字符串解析。
 */
export interface AdminProductListQuery {
  keyword?: string;        // 搜索关键词（匹配 provider 或 name）
  page?: number;           // 页码，默认 1
  pageSize?: number;       // 每页数量，默认 20
  // Express query 恒为字符串；类型标注为联合类型以反映运行时真实情况，
  // 避免 controller 中的字符串比较被 TS 误判为无意义比较。
  isDeleted?: boolean | string;     // 传 "true" 仅查已删除，未传则默认查未删除
}

/**
 * 分页响应结构
 */
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  list: T[];
}

// ============================
// SystemConfig 相关类型
// ============================

/**
 * 系统配置更新请求体
 */
export interface ConfigUpdateInput {
  configKey: string;
  configValue: string;
}

/**
 * 前端配置响应格式
 */
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

// ============================
// Admin 相关类型
// ============================

/**
 * 登录请求体
 */
export interface LoginInput {
  username: string;
  password: string;
}

/**
 * 登录成功响应数据
 */
export interface LoginResponse {
  token: string;
  expiresIn: number;
}

// ============================
// 业务错误码常量
// ============================

export const ERROR_CODES = {
  // 通用错误
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,

  // 业务错误
  LOGIN_FAILED: 1001,           // 用户名或密码错误
  LOGIN_RATE_LIMIT: 1002,       // 登录失败次数过多
  PRODUCT_NOT_FOUND: 2001,      // 产品不存在
  CONFIG_NOT_FOUND: 3001,       // 配置项不存在
  CONFIG_UPDATE_FAILED: 3002,   // 配置更新失败
} as const;

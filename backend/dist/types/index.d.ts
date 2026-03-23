import { Request } from 'express';
/**
 * 带有管理员信息的认证请求
 */
export interface AuthRequest extends Request {
    admin?: {
        adminId: number;
        username: string;
    };
}
export interface SuccessResponse<T = unknown> {
    code: 0;
    data: T;
}
export interface ErrorResponse {
    code: number;
    message: string;
}
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
    providers?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
    keyword?: string;
    location?: string;
}
/**
 * 后台产品列表查询参数
 */
export interface AdminProductListQuery {
    keyword?: string;
    page?: number;
    pageSize?: number;
    isDeleted?: boolean;
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
    expiresIn: string;
}
export declare const ERROR_CODES: {
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly INTERNAL_ERROR: 500;
    readonly LOGIN_FAILED: 1001;
    readonly LOGIN_RATE_LIMIT: 1002;
    readonly PRODUCT_NOT_FOUND: 2001;
    readonly CONFIG_NOT_FOUND: 3001;
    readonly CONFIG_UPDATE_FAILED: 3002;
};
//# sourceMappingURL=index.d.ts.map
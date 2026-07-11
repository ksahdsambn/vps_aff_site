/**
 * API 客户端 + 类型定义。
 *
 * 从旧前端 frontend/src/api/index.ts 迁移而来。
 * - 公共页面（Server Component）使用 fetch 封装（getProducts / getConfig / getProviders）。
 * - Admin 区（Client Component）使用 axios 实例 + JWT 拦截器。
 */

// ============ 类型定义 ============

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
  reviewUrl?: string | null;
  remark?: string | null;
  affiliateUrl: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrafficInput {
  value: number;
  unit: "GB" | "TB";
}

export interface BandwidthInput {
  value: number;
  unit: "Mbps" | "Gbps";
}

export interface ProductFormData {
  provider: string;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  monthlyTraffic: number | TrafficInput;
  bandwidth: number | BandwidthInput;
  location: string;
  price: number;
  currency: string;
  reviewUrl?: string;
  remark?: string;
  affiliateUrl: string;
}

export type ProductUpdatePayload = Partial<ProductFormData>;

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
  configKey: string;
  configValue: string | null;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  list: T[];
}

// ============ 公共 API（fetch 封装，可在 Server/Client Component 使用）============

const API_BASE = "/api";

/**
 * 服务端 fetch 使用的后端绝对地址。
 *
 * 注意：Next.js Server Component 中的相对路径 fetch（/api/...）在运行时由 Next.js
 * 服务自身处理（经 rewrites 代理），但在构建时（SSG 预渲染）没有运行中的服务，
 * 相对路径无法解析。因此服务端 fetch 必须使用绝对地址。
 *
 * 优先级：BACKEND_URL（Docker 内部）> NEXT_PUBLIC_API_URL > localhost:3000。
 */
const SERVER_BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

/** 返回服务端 fetch 应使用的 base URL（构建时为绝对地址）。 */
function serverApiBase(): string {
  // 在服务端（含构建时）使用绝对地址；客户端用相对路径 /api（经 rewrites 代理）
  if (typeof window === "undefined") {
    return `${SERVER_BACKEND_URL}/api`;
  }
  return API_BASE;
}

/** 服务端 fetch 超时（ms）。构建时后端不可用则快速失败，降级为空数据。 */
const SERVER_FETCH_TIMEOUT = 8000;

/** 从统一响应信封中取 data，非 0 code 抛错。 */
async function unwrap<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || `API error code=${json.code}`);
  }
  return json.data as T;
}

/** 构建服务端 fetch 选项（含超时），客户端调用时无需超时。 */
function serverFetchOptions(revalidate: number): RequestInit {
  return {
    next: { revalidate },
    signal: typeof AbortSignal !== "undefined" ? AbortSignal.timeout(SERVER_FETCH_TIMEOUT) : undefined,
  } as RequestInit;
}

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  providers?: string;
  keyword?: string;
  location?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

/** 公共：获取产品列表（分页/筛选/排序）。 */
export async function getProducts(
  params: GetProductsParams = {}
): Promise<PaginatedResponse<Product>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.providers) qs.set("providers", params.providers);
  if (params.keyword) qs.set("keyword", params.keyword);
  if (params.location) qs.set("location", params.location);
  if (params.sortField) qs.set("sortField", params.sortField);
  if (params.sortOrder) qs.set("sortOrder", params.sortOrder);
  const query = qs.toString();
  const res = await fetch(`${serverApiBase()}/products${query ? `?${query}` : ""}`, serverFetchOptions(300));
  return unwrap<PaginatedResponse<Product>>(res);
}

/** 公共：获取所有服务商名称。 */
export async function getProviders(): Promise<string[]> {
  const res = await fetch(`${serverApiBase()}/providers`, serverFetchOptions(300));
  return unwrap<string[]>(res);
}

/** 产品 ID + 更新时间（用于 generateStaticParams 和 sitemap lastmod）。 */
export interface ProductIdWithUpdated {
  id: number;
  updatedAt: string;
}

/** 公共：获取所有产品 ID + updatedAt（用于 generateStaticParams 和 sitemap）。 */
export async function getAllProductIds(): Promise<ProductIdWithUpdated[]> {
  const res = await fetch(`${serverApiBase()}/products/all`, serverFetchOptions(3600));
  return unwrap<ProductIdWithUpdated[]>(res);
}

/** 公共：获取单个产品详情（不存在时抛错/404）。 */
export async function getProductById(id: number | string): Promise<Product> {
  const res = await fetch(`${serverApiBase()}/products/${id}`, serverFetchOptions(3600));
  if (!res.ok) {
    throw new Error(`Product ${id} not found`);
  }
  return unwrap<Product>(res);
}

/** 公共：获取指定服务商的所有产品（聚合页用）。 */
export async function getProductsByProvider(name: string): Promise<Product[]> {
  const res = await fetch(
    `${serverApiBase()}/providers/${encodeURIComponent(name)}/products`,
    serverFetchOptions(3600)
  );
  return unwrap<Product[]>(res);
}

/** 公共：获取站点配置。 */
export async function getConfig(): Promise<FrontendConfig> {
  const res = await fetch(`${serverApiBase()}/config`, serverFetchOptions(300));
  return unwrap<FrontendConfig>(res);
}

// ============ Admin API（axios，仅客户端）============

// axios 在客户端组件中动态引入，避免进入服务端 bundle。
export async function getAdminApi() {
  const { default: axios } = await import("axios");
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
  });

  // 请求拦截：附加 JWT
  instance.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // 响应拦截：401 清理 token 并跳转登录
  instance.interceptors.response.use(
    (response) => {
      const data = response.data as ApiResponse<unknown>;
      if (data?.code === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          if (!window.location.pathname.startsWith("/admin/login")) {
            window.location.href = "/admin/login";
          }
        }
        return Promise.reject(new Error("Session expired. Please sign in again."));
      }
      return response;
    },
    (error) => {
      if (error?.response?.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("token");
        if (!window.location.pathname.startsWith("/admin/login")) {
          window.location.href = "/admin/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

/** 提取 API 错误信息。 */
export function getApiErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const resp = (err as { response?: { data?: ApiResponse<unknown> } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred. Please try again.";
}

/** 获取 API 业务状态码。 */
export function getApiStatusCode(err: unknown): number | undefined {
  if (err && typeof err === "object" && "response" in err) {
    const resp = (err as { response?: { data?: ApiResponse<unknown> } }).response;
    return resp?.data?.code;
  }
  return undefined;
}

/** 本地解析 JWT 是否过期（避免无效请求）。 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as { exp?: number };
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000 - 1000;
  } catch {
    return true;
  }
}

// ============ Admin API 调用封装（客户端组件使用）============
//
// 以下函数在客户端组件中调用，返回解包后的数据（已校验 code===0）。
// 使用动态 getAdminApi() 获取带 JWT 拦截器的 axios 实例。

/** 登录，返回 token。 */
export async function adminLogin(
  username: string,
  password: string
): Promise<{ token: string; expiresIn: number }> {
  const api = await getAdminApi();
  const res = await api.post<ApiResponse<{ token: string; expiresIn: number }>>(
    "/admin/login",
    { username, password }
  );
  if (res.data.code !== 0 || !res.data.data) {
    throw new Error(res.data.message || "Login failed");
  }
  return res.data.data;
}

/** 后台获取产品列表（分页/搜索）。 */
export async function adminGetProducts(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  isDeleted?: string;
} = {}): Promise<PaginatedResponse<Product>> {
  const api = await getAdminApi();
  const res = await api.get<ApiResponse<PaginatedResponse<Product>>>("/admin/products", {
    params,
  });
  if (res.data.code !== 0 || !res.data.data) {
    throw new Error(res.data.message || "Failed to load products");
  }
  return res.data.data;
}

/** 后台新增产品。 */
export async function adminAddProduct(
  payload: ProductFormData
): Promise<Product> {
  const api = await getAdminApi();
  const res = await api.post<ApiResponse<Product>>("/admin/products", payload);
  if (res.data.code !== 0) {
    throw new Error(res.data.message || "Create failed");
  }
  return res.data.data as Product;
}

/** 后台更新产品（仅改动字段）。 */
export async function adminUpdateProduct(
  id: number,
  payload: ProductUpdatePayload
): Promise<Product> {
  const api = await getAdminApi();
  const res = await api.put<ApiResponse<Product>>(`/admin/products/${id}`, payload);
  if (res.data.code !== 0) {
    throw new Error(res.data.message || "Update failed");
  }
  return res.data.data as Product;
}

/** 后台删除产品（软删除）。 */
export async function adminDeleteProduct(id: number): Promise<void> {
  const api = await getAdminApi();
  const res = await api.delete<ApiResponse<null>>(`/admin/products/${id}`);
  if (res.data.code !== 0) {
    throw new Error(res.data.message || "Delete failed");
  }
}

/** 后台登出（服务端吊销当前 token）。失败不阻断客户端清除本地 token。 */
export async function adminLogout(): Promise<void> {
  try {
    const api = await getAdminApi();
    await api.post<ApiResponse<null>>("/admin/logout");
  } catch {
    // 服务端吊销失败（如网络错误）不应阻断客户端登出流程。
  }
}

/** 后台获取所有配置项（原始数组）。 */
export async function adminGetConfig(): Promise<SystemConfigItem[]> {
  const api = await getAdminApi();
  const res = await api.get<ApiResponse<SystemConfigItem[]>>("/admin/config");
  if (res.data.code !== 0 || !res.data.data) {
    throw new Error(res.data.message || "Failed to load config");
  }
  return res.data.data;
}

/** 后台更新单个配置项。 */
export async function adminUpdateConfig(
  configKey: string,
  configValue: string
): Promise<void> {
  const api = await getAdminApi();
  const res = await api.put<ApiResponse<null>>("/admin/config", {
    configKey,
    configValue,
  });
  if (res.data.code !== 0) {
    throw new Error(res.data.message || "Config update failed");
  }
}

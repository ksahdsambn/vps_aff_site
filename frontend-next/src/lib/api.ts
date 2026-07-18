/**
 * API 客户端 + 类型定义。
 *
 * 从旧前端 frontend/src/api/index.ts 迁移而来。
 * - 公共页面（Server Component）使用 fetch 封装（getProducts / getConfig / getProviders）。
 * - Admin 区（Client Component）使用 axios 实例 + JWT 拦截器。
 */

// ============ 类型定义 ============

/**
 * 公共产品类型（来自公共 API：/api/products、/api/products/:id、/api/providers/:name/products）。
 *
 * 注意：不含 `affiliateUrl`——后端公共接口已剥离该字段（防抓包批量采集商家推广域名）。
 * 真实推广 URL 仅由内部中转端点 /api/go/:id 按需返回（见 getAffiliateUrl），
 * 或由 admin 接口返回（见 AdminProduct）。
 */
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
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 后台产品类型（来自 admin API：/api/admin/products）。
 *
 * 在公共 Product 基础上多出 `affiliateUrl`：后台编辑表单需回填该字段。
 */
export interface AdminProduct extends Product {
  affiliateUrl: string;
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
  reviewUrl?: string | null;
  remark?: string | null;
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

/**
 * 非 JSON 响应解析错误。
 *
 * 当反代（nginx/Cloudflare）返回 HTML 错误页（502/504/超时页）时，
 * `res.json()` 会抛 SyntaxError，这里包装为带 HTTP status 的错误，
 * 使调用方能区分「后端业务错误」与「反代/网关错误」。
 */
export class ApiParseError extends Error {
  readonly status: number;
  constructor(status: number, message?: string) {
    super(message || `Response is not valid JSON (HTTP ${status})`);
    this.name = "ApiParseError";
    this.status = status;
  }
}

/** 从统一响应信封中取 data，非 0 code 抛错。非 JSON body 抛 ApiParseError。 */
async function unwrap<T>(res: Response): Promise<T> {
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    // 反代返回 HTML 错误页 / 空响应体时 res.json() 抛 SyntaxError。
    throw new ApiParseError(res.status);
  }
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
  /** AbortSignal：客户端快速切换筛选/排序/分页时取消在途请求。 */
  signal?: AbortSignal;
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
  const opts = serverFetchOptions(300);
  // 客户端传入的 signal 用于取消在途请求；服务端 SSG 预取不传。
  if (params.signal) opts.signal = params.signal;
  const res = await fetch(`${serverApiBase()}/products${query ? `?${query}` : ""}`, opts);
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

/** 公共：获取单个产品详情（不存在时抛错/404，服务器错误抛错/5xx）。 */
export async function getProductById(id: number | string): Promise<Product> {
  const res = await fetch(`${serverApiBase()}/products/${id}`, serverFetchOptions(3600));
  if (!res.ok) {
    // 区分 404（产品不存在）与 5xx（后端/网关故障）：
    // 404 → 调用方走 notFound() 渲染 404 页；
    // 5xx → 抛出带 status 的错误，避免把临时故障误渲染为永久 404。
    if (res.status === 404) {
      throw new Error(`Product ${id} not found`);
    }
    throw new Error(`Failed to load product ${id} (HTTP ${res.status})`);
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

/**
 * 推广链接中转查询（仅 /go/[id] 跳转路由使用）。
 *
 * 调用内部端点 /api/go/:id 拿到真实 affiliateUrl（B 域名）。
 * 该端点是为 affiliateUrl 从公共产品接口剥离后，前端获取该字段的唯一入口。
 *
 * 缓存策略：不缓存。后台改了 affiliate URL 后，用户下次点击立即生效——这是
 * affiliate 链接中转的关键需求。
 *
 * 机制说明：本函数未显式传 `cache: 'no-store'` 或 `next: { revalidate: 0 }`，
 * 但调用方（/go/[id]/route.ts）声明了 `export const dynamic = "force-dynamic"`。
 * 在 Next.js 15+ 中，dynamic 路由内未指定缓存策略的 fetch 默认行为为 no-store，
 * 因此整条跳转链路不会被缓存。这与 getProductById 等用 `next: { revalidate }`
 * 的 ISR 函数不同——不要把本函数搬到非 dynamic 路由里调用，否则可能被缓存。
 *
 * 与 getProductById 的错误语义区别（供 /go/[id] 区分 404 vs 5xx）：
 * - HTTP 404（商品不存在/已软删除）→ 抛 AffiliateNotFoundError
 * - HTTP 其他非 2xx（含 5xx、网关错误）→ 抛普通 Error
 * - 响应非 JSON（反代错误页）→ 抛 ApiParseError（带 status）
 */
export class AffiliateNotFoundError extends Error {
  constructor(id: number | string) {
    super(`Affiliate target for product ${id} not found`);
    this.name = "AffiliateNotFoundError";
  }
}

export interface AffiliateTarget {
  id: number;
  affiliateUrl: string;
}

/** 公共：按 id 查推广目标 URL（仅 /go/[id] 跳转路由用）。 */
export async function getAffiliateUrl(id: number | string): Promise<AffiliateTarget> {
  const res = await fetch(`${serverApiBase()}/go/${id}`, {
    // 不传 serverFetchOptions：跳转链路不缓存，确保 affiliate URL 变更立即生效。
    // 但仍需超时保护，避免后端挂掉时跳转路由长时间挂起。
    signal: typeof AbortSignal !== "undefined" ? AbortSignal.timeout(SERVER_FETCH_TIMEOUT) : undefined,
  } as RequestInit);
  if (res.status === 404) {
    throw new AffiliateNotFoundError(id);
  }
  return unwrap<AffiliateTarget>(res);
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
    withCredentials: true,
  });

  // 响应拦截：401 跳转登录；会话位于 HttpOnly Cookie，前端不可读也无需清理。
  // 跳转时携带 ?from=<当前路径>，登录成功后可返回原页面（避免丢失未保存表单上下文）。
  instance.interceptors.response.use(
    (response) => {
      const data = response.data as ApiResponse<unknown>;
      if (data?.code === 401) {
        if (typeof window !== "undefined") {
          if (!window.location.pathname.startsWith("/admin/login")) {
            const from = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/admin/login?from=${from}&reason=expired`;
          }
        }
        return Promise.reject(new Error("Session expired. Please sign in again."));
      }
      return response;
    },
    (error) => {
      if (error?.response?.status === 401 && typeof window !== "undefined") {
        if (!window.location.pathname.startsWith("/admin/login")) {
          const from = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/admin/login?from=${from}&reason=expired`;
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

/** 获取 HTTP 状态码（与业务 code 区分，用于检测 429/503 等）。 */
export function getHttpStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "response" in err) {
    const resp = (err as { response?: { status?: number } }).response;
    return resp?.status;
  }
  return undefined;
}

// ============ Admin API 调用封装（客户端组件使用）============
//
// 以下函数在客户端组件中调用，返回解包后的数据（已校验 code===0）。
// 使用动态 getAdminApi() 获取带会话 Cookie 的 axios 实例（withCredentials）。

/** 登录，服务端通过 HttpOnly Cookie 下发会话，仅返回过期时间。 */
export async function adminLogin(
  username: string,
  password: string
): Promise<LoginResponse> {
  const api = await getAdminApi();
  const res = await api.post<ApiResponse<LoginResponse>>(
    "/admin/login",
    { username, password }
  );
  if (res.data.code !== 0 || !res.data.data) {
    throw new Error(res.data.message || "Login failed");
  }
  return res.data.data;
}

/** 验证当前 HttpOnly 管理员会话。 */
export async function adminGetSession(): Promise<{ expiresAt: number }> {
  const api = await getAdminApi();
  const res = await api.get<ApiResponse<{ expiresAt: number }>>("/admin/session");
  if (res.data.code !== 0 || !res.data.data) {
    throw new Error(res.data.message || "Session expired.");
  }
  return res.data.data;
}

/** 后台获取产品列表（分页/搜索）。返回类型含 affiliateUrl（admin 编辑回填用）。 */
export async function adminGetProducts(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  isDeleted?: string;
} = {}): Promise<PaginatedResponse<AdminProduct>> {
  const api = await getAdminApi();
  const res = await api.get<ApiResponse<PaginatedResponse<AdminProduct>>>("/admin/products", {
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
): Promise<AdminProduct> {
  const api = await getAdminApi();
  const res = await api.post<ApiResponse<AdminProduct>>("/admin/products", payload);
  if (res.data.code !== 0) {
    throw new Error(res.data.message || "Create failed");
  }
  return res.data.data as AdminProduct;
}

/** 后台更新产品（仅改动字段）。 */
export async function adminUpdateProduct(
  id: number,
  payload: ProductUpdatePayload
): Promise<AdminProduct> {
  const api = await getAdminApi();
  const res = await api.put<ApiResponse<AdminProduct>>(`/admin/products/${id}`, payload);
  if (res.data.code !== 0) {
    throw new Error(res.data.message || "Update failed");
  }
  return res.data.data as AdminProduct;
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

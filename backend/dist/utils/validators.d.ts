/**
 * 输入校验工具集。
 *
 * 提供可复用的 URL 协议白名单校验，防止 `javascript:` / `data:` 等危险协议
 * 被存储到数据库并最终渲染为 `<a href>` / `<img src>` 导致存储型 XSS。
 */
/**
 * 校验字符串是否为合法的 http/https URL。
 *
 * 使用 URL 构造器解析，拒绝非 http(s) 协议（如 javascript:、data:、file:）。
 * 空字符串返回 false。
 */
export declare function isSafeHttpUrl(value: string): boolean;
/**
 * 校验可选 URL 字段：允许 null/空，但若提供必须为合法 http(s) URL。
 */
export declare function isSafeOptionalHttpUrl(value: string | null | undefined): boolean;
//# sourceMappingURL=validators.d.ts.map
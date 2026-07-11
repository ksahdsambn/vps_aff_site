/**
 * 安全的错误日志工具。
 *
 * 问题：直接 `console.error('label:', error)` 会打印完整 error 对象，
 * 其中 Prisma 错误可能包含完整 SQL 语句与参数值，容器化部署中日志常被
 * 采集到外部系统（ELK/Loki/云日志），存在敏感信息泄露风险。
 *
 * 此函数仅提取安全的错误字段（name + message + 可选 code），不打印
 * 完整对象、堆栈、SQL 查询或参数。
 */

interface SafeErrorLike {
  message?: string;
  name?: string;
  code?: string | number;
}

/**
 * 从任意 error 中提取安全字段，输出单行日志。
 *
 * @param label  场景标签（如 'Login error'）。
 * @param error  原始 error 对象（unknown）。
 */
export function logError(label: string, error: unknown): void {
  if (error && typeof error === 'object') {
    const e = error as SafeErrorLike;
    const name = e.name || 'Error';
    const message = typeof e.message === 'string' ? e.message : '';
    const code = e.code !== undefined ? ` [code=${e.code}]` : '';
    // 单行输出，便于日志聚合；不含堆栈/SQL/参数。
    console.error(`${label}: ${name}${code} ${message}`);
    return;
  }
  // 非 error 对象（字符串/null/undefined 等），直接打印基本值。
  console.error(`${label}: ${String(error)}`);
}

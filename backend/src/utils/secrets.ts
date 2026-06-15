/**
 * 集中管理敏感配置（密钥/口令）的读取与校验
 *
 * 设计目标：杜绝「环境变量缺失时回退到源码中的硬编码常量」这一类
 * 认证绕过漏洞。任何敏感凭证缺失或强度不足时，应在启动阶段即失败，
 * 而不是静默降级到一个公开已知的默认值。
 */

const MIN_JWT_SECRET_LENGTH = 32;
const isProduction = process.env.NODE_ENV === 'production';

let cachedJwtSecret: string | null = null;

/**
 * 获取 JWT 签名密钥。
 *
 * 校验规则：
 * - 生产环境（NODE_ENV=production）：JWT_SECRET 必须存在且长度 >= 32，否则抛错。
 * - 开发环境：JWT_SECRET 必须存在；长度不足时仅打印警告，但不阻断启动，
 *   方便本地调试（开发环境也不允许回退到硬编码常量）。
 */
export function getJwtSecret(): string {
  if (cachedJwtSecret !== null) {
    return cachedJwtSecret;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim() === '') {
    throw new Error(
      'JWT_SECRET 环境变量未设置。请在 .env 或容器环境变量中配置一个强随机密钥（>= 32 字符）。',
    );
  }

  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    const msg = `JWT_SECRET 长度不足（当前 ${secret.length}，要求 >= ${MIN_JWT_SECRET_LENGTH}）。请使用 openssl rand -hex 32 等方式生成强随机密钥。`;
    if (isProduction) {
      throw new Error(msg);
    }
    console.warn(`[security] ${msg}`);
  }

  cachedJwtSecret = secret;
  return cachedJwtSecret;
}

/**
 * 获取管理员种子账号用户名，默认 "admin"。
 * 用于 seedData，不影响已存在的账号。
 */
export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || 'admin';
}

/**
 * 获取管理员种子账号口令。
 * - 生产环境：ADMIN_PASSWORD 必须存在，否则抛错（使 seedRuntime 以非零码退出）。
 * - 开发环境：缺失时打印警告并返回 null，由调用方决定是否跳过 seeding。
 */
export function getAdminSeedPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.trim() === '') {
    if (isProduction) {
      throw new Error(
        'ADMIN_PASSWORD 环境变量未设置。生产环境必须提供初始管理员口令。',
      );
    }
    console.warn(
      '[security] ADMIN_PASSWORD 未设置，已跳过默认管理员账号 seeding。请在 .env 中配置后再启动。',
    );
    return null;
  }

  return password;
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import adminRoutes from './routes/adminRoutes';
import productRoutes from './routes/productRoutes';
import configRoutes from './routes/configRoutes';

const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
// 出于安全考虑，不再允许通配符 "*" 与 credentials:true 共存。
// 若配置中出现 "*"，在生产环境抛错拒绝启动；开发环境降级为 localhost。
const hasWildcard = allowedOrigins.includes('*');
if (hasWildcard && isProduction) {
  throw new Error(
    'CORS_ORIGIN 不能为 "*"（生产环境必须显式指定允许的源，且不支持与 credentials 同时使用通配符）。',
  );
}
const effectiveOrigins = hasWildcard
  ? ['http://localhost', 'http://localhost:3000']
  : allowedOrigins;

// trust proxy：根据部署拓扑设置可信代理层数。
// - TRUST_PROXY_HOPS 环境变量显式指定跳数（如 Cloudflare→nginx→容器 = 3）。
// - 未设置时默认 1（兼容单层反代）。
//
// 部署拓扑参考（需据此调整 TRUST_PROXY_HOPS）：
//   直连 Express（无反代）= 0
//   单层 nginx = 1
//   1Panel/OpenResty → Next.js(rewrites) → Express = 2~3（取决于各跳是否追加 XFF）
//   Cloudflare → nginx → 容器 = 3
//
// 配置错误会导致 req.ip 为内网地址而非真实客户端 IP，使基于 IP 的限速失效。
const proxyHops = parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
const effectiveProxyHops = Number.isFinite(proxyHops) && proxyHops >= 0 ? proxyHops : 1;
app.set('trust proxy', effectiveProxyHops);
if (isProduction) {
  console.log(`[security] trust proxy = ${effectiveProxyHops} (TRUST_PROXY_HOPS). ` +
    `若登录限速异常，请核验此值是否匹配实际反代跳数。`);
}

// 1. 安全头
app.use(helmet());

// 2. 跨域配置
app.use(cors({
  origin(origin, callback) {
    // 不允许 !origin 放行所有同源/无 Origin 请求以外的场景：
    // 仅同源请求（无 Origin 头）或白名单内来源放行。
    if (!origin || effectiveOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
}));

/**
 * Admin 路由的额外 Origin 收紧中间件。
 *
 * CORS 中间件的 origin 回调无法拒绝"无 Origin 头"的请求（因为同源请求和 curl 都无 Origin），
 * 这对公开 API 无害。但对于携带 Authorization 头（即 credentialed）的管理请求，
 * 收紧为：若存在 Origin 头则必须在白名单中（cors 已做），且对跨域写操作（POST/PUT/DELETE）
 * 要求 Origin 头存在——防止 CSRF 类场景下浏览器以"同源"名义发送 credentialed 请求。
 *
 * 注意：Next.js rewrites 代理的请求可能不携带 Origin 头（服务端代理），此时放行。
 */
app.use('/api/admin', (req, res, next) => {
  const origin = req.headers.origin;
  // 仅对 credentialed 请求（带 Authorization）且跨域写操作收紧。
  if (req.headers.authorization && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Origin 存在但不在白名单 → 拒绝（cors 中间件不返回 ACAO，浏览器会拦截，但服务端也显式拒绝）。
    if (origin && !effectiveOrigins.includes(origin)) {
      res.status(403).json({ code: 403, message: 'Origin not allowed' });
      return;
    }
  }
  next();
});

// 3. gzip 压缩
app.use(compression());

// 4. JSON 解析，限制 body 大小 1mb（管理接口仅需少量字段，防止大 body DoS）
app.use(express.json({ limit: '1mb' }));

// 5. 全局速率限制
app.use(globalLimiter);

// 6. 路由挂载
// 前端 API 路由
app.use('/api', productRoutes);
app.use('/api', configRoutes);
// 后台管理 API 路由
app.use('/api/admin', adminRoutes);

// 7. 404 处理 — 未匹配的路由返回 JSON 格式的 404
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({
    code: 404,
    message: '资源不存在',
  });
});

// 8. 统一错误处理中间件（放在最后）
app.use(errorHandler);

export default app;

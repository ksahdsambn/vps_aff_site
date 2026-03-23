import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import adminRoutes from './routes/adminRoutes';
import productRoutes from './routes/productRoutes';
import configRoutes from './routes/configRoutes';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAnyOrigin = allowedOrigins.includes('*');

app.set('trust proxy', 1);

// 1. 安全头
app.use(helmet());

// 2. 跨域配置
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowAnyOrigin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
}));

// 3. gzip 压缩
app.use(compression());

// 4. JSON 解析，限制 body 大小 10mb
app.use(express.json({ limit: '10mb' }));

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

import { Router } from 'express';
import { getConfig } from '../controllers/configController';

const router = Router();

// GET /api/config — 前端系统配置
router.get('/config', getConfig);

export default router;

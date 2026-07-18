/**
 * 推广链接中转（Affiliate Link Cloaking）的单元测试。
 *
 * 验证后端 controller 的两个关键行为（不连真实 DB，用 mock prisma）：
 * 1. 公共产品查询（getProducts / getProductById / getProductsByProvider）传入
 *    `omit: { affiliateUrl: true }`，确保 affiliateUrl 不出现在公共 API 响应里。
 * 2. getAffiliateTarget 用 `select: { id: true, affiliateUrl: true }` 只取这两个字段。
 *
 * 这是 affiliate 隐藏方案的核心安全契约：HTML 已由 /go/ 中转隐藏，但若 API 仍
 * 返回真实 URL，F12 抓包即可批量采集。本测试锁定该剥离行为不被回归破坏。
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// ============ Mock Prisma ============
//
// controller 通过 `import { prisma } from '../utils/db'` 引入单例。
// 用 Module._load 拦截，把 db 模块替换成返回 mock prisma 的版本。
// 必须在 require controller 之前装载。

const Module = require('module');
const originalLoad = Module._load;

/** 记录 prisma.product.* 被调用时传入的 args。 */
const calls = {
  findMany: [],
  findFirst: [],
  count: [],
};

/** 测试用 product 全字段（含 affiliateUrl，模拟 DB 行）。 */
const FULL_PRODUCT = {
  id: 1,
  provider: 'TestProvider',
  name: 'Test VPS',
  cpu: 1,
  memory: 1,
  disk: 20,
  monthlyTraffic: 1000,
  bandwidth: 1000,
  location: 'US',
  price: 25.99,
  currency: 'USD',
  reviewUrl: null,
  remark: null,
  affiliateUrl: 'https://merchant.example/aff?id=SECRET-12345',
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * 模拟 Prisma 的字段投影行为（select / omit），返回剥离后的对象副本。
 *
 * Prisma 运行时会根据查询参数中传入的 select/omit 对返回行做字段投影。
 * mock 必须复现这一行为，否则测试无法捕获"controller 传了 omit 但实际响应
 * 仍含该字段"的回归（例如有人误删了 omit 但测试因为 mock 不剥离而误判通过）。
 *
 * - select: 只保留 select 中值为 true 的字段（Prisma 语义）
 * - omit:   移除 omit 中值为 true 的字段
 * - 都不传: 返回完整对象
 */
function applyProjection(row, args) {
  if (!args) return { ...row };
  if (args.select) {
    const out = {};
    for (const k of Object.keys(args.select)) {
      if (args.select[k]) out[k] = row[k];
    }
    return out;
  }
  if (args.omit) {
    const out = { ...row };
    for (const k of Object.keys(args.omit)) {
      if (args.omit[k]) delete out[k];
    }
    return out;
  }
  return { ...row };
}

const mockPrisma = {
  product: {
    findMany: async (args) => {
      calls.findMany.push(args);
      // 模拟 Prisma：根据 args.omit/select 投影字段，而非直接返回完整行。
      return [applyProjection(FULL_PRODUCT, args)];
    },
    findFirst: async (args) => {
      calls.findFirst.push(args);
      return applyProjection(FULL_PRODUCT, args);
    },
    count: async (args) => {
      calls.count.push(args);
      return 1;
    },
  },
};

Module._load = function (request, parent, isMain) {
  // 拦截 controller 依赖的 '../utils/db'（相对 controller 文件解析为 ../utils/db）
  if (request === '../utils/db' || request === './db') {
    return { prisma: mockPrisma };
  }
  return originalLoad.apply(this, arguments);
};

// 现在再 require controller（其内部 db 引用已被 mock）
const {
  getProducts,
  getProductById,
  getProductsByProvider,
  getAffiliateTarget,
} = require('../dist/controllers/productController');

// 还原（后续 require 不再受影响）
Module._load = originalLoad;

// ============ 测试辅助 ============

/** 构造 express-like req/res/next，捕获 res.json 的输出。 */
function mockReqRes(params = {}, query = {}) {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return { req: { params, query }, res, next: () => {} };
}

function resetCalls() {
  calls.findMany = [];
  calls.findFirst = [];
  calls.count = [];
}

// ============ 测试 ============

test('getProducts: 传入 omit: { affiliateUrl: true }，响应不含 affiliateUrl', async () => {
  resetCalls();
  const { req, res } = mockReqRes({}, { page: '1', pageSize: '10' });
  await getProducts(req, res);

  assert.equal(res.statusCode, 200, '应返回 200');
  assert.equal(calls.findMany.length, 1, '应调用一次 findMany');
  assert.deepEqual(
    calls.findMany[0].omit,
    { affiliateUrl: true },
    'findMany 必须传入 omit: { affiliateUrl: true }',
  );
  // 关键断言：响应里每项产品都不得含 affiliateUrl 键。
  // mock prisma 会按 omit 投影字段，复现真实 Prisma 的剥离行为。
  const list = res.body.data.list;
  assert.ok(Array.isArray(list) && list.length > 0, '应返回产品列表');
  for (const item of list) {
    assert.equal(
      'affiliateUrl' in item,
      false,
      `响应产品不得含 affiliateUrl 键（防抓包采集），实际：${JSON.stringify(Object.keys(item))}`,
    );
  }
});

test('getProductById: 传入 omit: { affiliateUrl: true }，响应不含 affiliateUrl', async () => {
  resetCalls();
  const { req, res } = mockReqRes({ id: '1' });
  await getProductById(req, res);

  assert.equal(res.statusCode, 200, '应返回 200');
  assert.equal(calls.findFirst.length, 1, '应调用一次 findFirst');
  assert.deepEqual(
    calls.findFirst[0].omit,
    { affiliateUrl: true },
    'findFirst 必须传入 omit: { affiliateUrl: true }',
  );
  assert.equal(res.body.data.id, 1, '响应应含 id');
  assert.equal(
    'affiliateUrl' in res.body.data,
    false,
    '响应不得含 affiliateUrl 键（防抓包采集）',
  );
});

test('getProductsByProvider: 传入 omit: { affiliateUrl: true }，响应不含 affiliateUrl', async () => {
  resetCalls();
  const { req, res } = mockReqRes({ name: 'TestProvider' });
  await getProductsByProvider(req, res);

  assert.equal(res.statusCode, 200, '应返回 200');
  assert.equal(calls.findMany.length, 1, '应调用一次 findMany');
  assert.deepEqual(
    calls.findMany[0].omit,
    { affiliateUrl: true },
    'findMany 必须传入 omit: { affiliateUrl: true }',
  );
  const list = res.body.data;
  assert.ok(Array.isArray(list) && list.length > 0, '应返回产品列表');
  for (const item of list) {
    assert.equal(
      'affiliateUrl' in item,
      false,
      '响应产品不得含 affiliateUrl 键（防抓包采集）',
    );
  }
});

test('回归：若有人误删 omit，测试应失败（防御性元测试）', async () => {
  // 这个测试锁定"mock 正确模拟了 Prisma 的 omit 投影"。
  // 如果 mock 不按 omit 剥离字段（比如直接返回 FULL_PRODUCT），
  // 上面的三个测试会因为响应含 affiliateUrl 而失败。
  // 这里直接验证 applyProjection 的行为，确保 mock 本身正确。
  const withOmit = applyProjection(FULL_PRODUCT, { omit: { affiliateUrl: true } });
  assert.equal('affiliateUrl' in withOmit, false, 'omit 应剥离 affiliateUrl');
  assert.equal(withOmit.id, 1, 'omit 不应影响其他字段');

  const withSelect = applyProjection(FULL_PRODUCT, { select: { id: true, affiliateUrl: true } });
  assert.deepEqual(Object.keys(withSelect).sort(), ['affiliateUrl', 'id'], 'select 应只保留指定字段');

  const noProjection = applyProjection(FULL_PRODUCT, null);
  assert.equal('affiliateUrl' in noProjection, true, '无投影时保留全部字段');
});

test('getAffiliateTarget: 用 select 只取 id + affiliateUrl', async () => {
  resetCalls();
  const { req, res } = mockReqRes({ id: '1' });
  await getAffiliateTarget(req, res);

  assert.equal(res.statusCode, 200, '应返回 200');
  assert.equal(calls.findFirst.length, 1, '应调用一次 findFirst');
  assert.deepEqual(
    calls.findFirst[0].select,
    { id: true, affiliateUrl: true },
    'getAffiliateTarget 必须用 select: { id, affiliateUrl } 只取这两字段',
  );
  // 响应只含这两个字段（模拟 Prisma select 行为）
  const data = res.body.data;
  assert.equal(data.id, 1, '响应应含 id');
  assert.equal(
    data.affiliateUrl,
    'https://merchant.example/aff?id=SECRET-12345',
    '响应应含 affiliateUrl（这是唯一返回真实 URL 的端点）',
  );
  assert.equal(
    Object.keys(data).length,
    2,
    '响应应只含 id + affiliateUrl 两个字段',
  );
});

test('getAffiliateTarget: 商品不存在/已软删除 → 404', async () => {
  resetCalls();
  // 临时把 findFirst mock 成返回 null
  const origFindFirst = mockPrisma.product.findFirst;
  mockPrisma.product.findFirst = async () => null;
  try {
    const { req, res } = mockReqRes({ id: '999' });
    await getAffiliateTarget(req, res);
    assert.equal(res.statusCode, 404, '不存在的商品应返回 404');
    assert.equal(res.body.code, 2001, '业务码应为 PRODUCT_NOT_FOUND');
  } finally {
    mockPrisma.product.findFirst = origFindFirst;
  }
});

test('getAffiliateTarget: 非法 id（0、负数、非数字）→ 400', async () => {
  resetCalls();
  for (const badId of ['0', '-1', 'abc', '01', '1.5']) {
    const { req, res } = mockReqRes({ id: badId });
    await getAffiliateTarget(req, res);
    assert.equal(
      res.statusCode,
      400,
      `id="${badId}" 应返回 400，实际 ${res.statusCode}`,
    );
  }
});

test('getProductById: 商品不存在 → 404', async () => {
  resetCalls();
  const origFindFirst = mockPrisma.product.findFirst;
  mockPrisma.product.findFirst = async () => null;
  try {
    const { req, res } = mockReqRes({ id: '999' });
    await getProductById(req, res);
    assert.equal(res.statusCode, 404, '不存在的商品应返回 404');
  } finally {
    mockPrisma.product.findFirst = origFindFirst;
  }
});

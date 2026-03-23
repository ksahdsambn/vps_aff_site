# VPS AFF 网站 API 文档

## 1. 约定说明

### 1.1 基础信息

- 基础路径：`/api`
- 内容类型：`application/json`
- 鉴权方式：后台管理接口使用 `Authorization: Bearer <token>`

### 1.2 统一响应结构

成功响应：

```json
{
  "code": 0,
  "data": {}
}
```

错误响应：

```json
{
  "code": 400,
  "message": "请求参数错误"
}
```

### 1.3 业务错误码

| 错误码 | HTTP 状态码 | 含义 |
|---|---|---|
| `400` | `400` | 请求参数错误 |
| `401` | `401` | 未登录、Token 缺失、Token 无效或已过期 |
| `404` | `404` | 未匹配路由 |
| `429` | `429` | 全局请求过于频繁 |
| `500` | `500` | 服务器内部错误 |
| `1001` | `401` | 管理员用户名或密码错误 |
| `1002` | `429` | 登录失败次数过多，请稍后再试 |
| `2001` | `404` | 产品不存在 |
| `3001` | `404` | 配置项不存在 |
| `3002` | `500` | 配置更新失败 |

### 1.4 产品字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `number` | 产品 ID |
| `provider` | `string` | 服务商名称 |
| `name` | `string` | 产品名称 |
| `cpu` | `number` | CPU 核数 |
| `memory` | `number` | 内存，数据库单位 GB |
| `disk` | `number` | 硬盘，数据库单位 GB |
| `monthlyTraffic` | `number` | 月流量，数据库单位 GB |
| `bandwidth` | `number` | 带宽，数据库单位 Mbps |
| `location` | `string` | 机房位置 |
| `price` | `number` | 价格数值 |
| `currency` | `string` | 3 位货币代码 |
| `reviewUrl` | `string \| null` | 测评链接 |
| `remark` | `string \| null` | 备注 |
| `affiliateUrl` | `string` | AFF 下单链接 |
| `isDeleted` | `boolean` | 软删除标记 |
| `createdAt` | `string` | 创建时间，ISO 字符串 |
| `updatedAt` | `string` | 更新时间，ISO 字符串 |

### 1.5 管理端产品写入规则

- `monthlyTraffic` 支持以下两种写法：
  - 数字：直接按 GB 存储
  - 对象：`{"value": 1, "unit": "TB"}`，若单位为 `TB` 会自动转换为 `1000 GB`
- `bandwidth` 支持以下两种写法：
  - 数字：直接按 Mbps 存储
  - 对象：`{"value": 1, "unit": "Gbps"}`，若单位为 `Gbps` 会自动转换为 `1000 Mbps`
- `currency` 必须为 3 位英文字母，保存时会自动转为大写

## 2. 公开接口

### 2.1 获取产品列表

- 路径：`GET /api/products`
- 认证：否

查询参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `providers` | `string` | 否 | 服务商列表，逗号分隔，例如 `DigitalOcean,Vultr` |
| `sortField` | `string` | 否 | 允许值：`cpu`、`memory`、`disk`、`monthlyTraffic`、`bandwidth`、`price` |
| `sortOrder` | `string` | 否 | `asc` 或 `desc` |
| `page` | `number` | 否 | 页码，默认 `1` |
| `pageSize` | `number` | 否 | 每页数量，默认 `50`，最大 `100` |
| `keyword` | `string` | 否 | 按产品名称模糊搜索 |
| `location` | `string` | 否 | 按位置模糊搜索 |

说明：

- 只返回 `isDeleted=false` 的产品。
- 未提供合法排序字段时，默认按 `createdAt desc` 排序。

成功响应示例：

```json
{
  "code": 0,
  "data": {
    "total": 2,
    "page": 1,
    "pageSize": 50,
    "list": [
      {
        "id": 1,
        "provider": "DigitalOcean",
        "name": "Basic Droplet",
        "cpu": 1,
        "memory": 1,
        "disk": 25,
        "monthlyTraffic": 1000,
        "bandwidth": 1000,
        "location": "New York",
        "price": 5,
        "currency": "USD",
        "reviewUrl": "https://example.com/review/do-basic",
        "remark": "Good entry-level starter option",
        "affiliateUrl": "https://example.com/aff/do-basic",
        "isDeleted": false,
        "createdAt": "2026-03-23T00:00:00.000Z",
        "updatedAt": "2026-03-23T00:00:00.000Z"
      }
    ]
  }
}
```

错误码：

- `429`：全局限流
- `500`：服务器内部错误

请求示例：

```bash
curl "http://localhost/api/products?providers=DigitalOcean,Vultr&sortField=price&sortOrder=asc&page=1&pageSize=20&keyword=Basic&location=New"
```

### 2.2 获取服务商列表

- 路径：`GET /api/providers`
- 认证：否

成功响应示例：

```json
{
  "code": 0,
  "data": [
    "DigitalOcean",
    "Linode",
    "Vultr"
  ]
}
```

说明：

- 仅返回未删除产品中的去重服务商列表。
- 结果按服务商名称升序排列。

错误码：

- `429`：全局限流
- `500`：服务器内部错误

请求示例：

```bash
curl "http://localhost/api/providers"
```

### 2.3 获取前台系统配置

- 路径：`GET /api/config`
- 认证：否

成功响应示例：

```json
{
  "code": 0,
  "data": {
    "announcement_zh": "",
    "announcement_en": "",
    "link_telegram": "",
    "link_youtube": "",
    "link_blog": "",
    "link_x": "",
    "site_title_zh": "VPS导航",
    "site_title_en": "VPS Navigator",
    "site_logo": ""
  }
}
```

说明：

- 返回值是格式化后的对象，不是配置数组。
- 若某项配置不存在，会回退为默认值或空字符串。

错误码：

- `429`：全局限流
- `500`：服务器内部错误

请求示例：

```bash
curl "http://localhost/api/config"
```

## 3. 后台管理接口

### 3.1 管理员登录

- 路径：`POST /api/admin/login`
- 认证：否
- 限流：同一 IP 15 分钟内最多 5 次尝试

请求体：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `username` | `string` | 是 | 管理员用户名 |
| `password` | `string` | 是 | 管理员密码 |

请求示例：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

成功响应示例：

```json
{
  "code": 0,
  "data": {
    "token": "<jwt-token>",
    "expiresIn": "30m"
  }
}
```

错误码：

- `400`：用户名或密码为空
- `1001`：用户名或密码错误
- `1002`：登录失败次数过多
- `500`：服务器内部错误

请求示例：

```bash
curl -X POST "http://localhost/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3.2 获取后台产品列表

- 路径：`GET /api/admin/products`
- 认证：是

请求头：

```http
Authorization: Bearer <token>
```

查询参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `keyword` | `string` | 否 | 模糊搜索 `provider` 或 `name` |
| `page` | `number` | 否 | 页码，默认 `1` |
| `pageSize` | `number` | 否 | 每页数量，默认 `20`，最大 `100` |
| `isDeleted` | `boolean` | 否 | `true` 时仅查询已删除产品；省略或 `false` 时查询未删除产品 |

成功响应示例：

```json
{
  "code": 0,
  "data": {
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": 1,
        "provider": "DigitalOcean",
        "name": "Basic Droplet",
        "cpu": 1,
        "memory": 1,
        "disk": 25,
        "monthlyTraffic": 1000,
        "bandwidth": 1000,
        "location": "New York",
        "price": 5,
        "currency": "USD",
        "reviewUrl": "https://example.com/review/do-basic",
        "remark": "Good entry-level starter option",
        "affiliateUrl": "https://example.com/aff/do-basic",
        "isDeleted": false,
        "createdAt": "2026-03-23T00:00:00.000Z",
        "updatedAt": "2026-03-23T00:00:00.000Z"
      }
    ]
  }
}
```

错误码：

- `401`：未登录、Token 缺失、Token 无效、Token 过期
- `429`：全局限流
- `500`：服务器内部错误

请求示例：

```bash
curl "http://localhost/api/admin/products?page=1&pageSize=20&keyword=Digital" \
  -H "Authorization: Bearer <token>"
```

### 3.3 添加产品

- 路径：`POST /api/admin/products`
- 认证：是

请求体：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `provider` | `string` | 是 | 服务商名称 |
| `name` | `string` | 是 | 产品名称 |
| `cpu` | `number` | 是 | CPU 核数 |
| `memory` | `number` | 是 | 内存，单位 GB |
| `disk` | `number` | 是 | 硬盘，单位 GB |
| `monthlyTraffic` | `number \| object` | 是 | 数字按 GB 存储；对象支持 `GB/TB` |
| `bandwidth` | `number \| object` | 是 | 数字按 Mbps 存储；对象支持 `Mbps/Gbps` |
| `location` | `string` | 是 | 机房位置 |
| `price` | `number` | 是 | 价格数值 |
| `currency` | `string` | 是 | 3 位货币代码 |
| `affiliateUrl` | `string` | 是 | AFF 下单链接 |
| `reviewUrl` | `string` | 否 | 测评链接 |
| `remark` | `string` | 否 | 备注 |

请求示例：

```json
{
  "provider": "Hetzner",
  "name": "CPX11",
  "cpu": 2,
  "memory": 2,
  "disk": 40,
  "monthlyTraffic": {
    "value": 20,
    "unit": "TB"
  },
  "bandwidth": {
    "value": 1,
    "unit": "Gbps"
  },
  "location": "Helsinki",
  "price": 4.79,
  "currency": "eur",
  "reviewUrl": "https://example.com/review/cpx11",
  "remark": "Entry cloud VPS",
  "affiliateUrl": "https://example.com/aff/cpx11"
}
```

成功响应示例：

```json
{
  "code": 0,
  "data": {
    "id": 99,
    "provider": "Hetzner",
    "name": "CPX11",
    "cpu": 2,
    "memory": 2,
    "disk": 40,
    "monthlyTraffic": 20000,
    "bandwidth": 1000,
    "location": "Helsinki",
    "price": 4.79,
    "currency": "EUR",
    "reviewUrl": "https://example.com/review/cpx11",
    "remark": "Entry cloud VPS",
    "affiliateUrl": "https://example.com/aff/cpx11",
    "isDeleted": false,
    "createdAt": "2026-03-23T00:00:00.000Z",
    "updatedAt": "2026-03-23T00:00:00.000Z"
  }
}
```

错误码：

- `400`：必填字段缺失、货币代码格式错误
- `401`：未登录或 Token 无效
- `429`：全局限流
- `500`：服务器内部错误

请求示例：

```bash
curl -X POST "http://localhost/api/admin/products" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d @product-create.json
```

### 3.4 更新产品

- 路径：`PUT /api/admin/products/:id`
- 认证：是

路径参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `number` | 是 | 产品 ID |

请求体：

- 支持部分更新。
- 字段定义与“添加产品”一致。

请求示例：

```json
{
  "price": 5.99,
  "currency": "usd",
  "monthlyTraffic": {
    "value": 30,
    "unit": "TB"
  }
}
```

成功响应示例：

```json
{
  "code": 0,
  "data": {
    "id": 99,
    "provider": "Hetzner",
    "name": "CPX11",
    "cpu": 2,
    "memory": 2,
    "disk": 40,
    "monthlyTraffic": 30000,
    "bandwidth": 1000,
    "location": "Helsinki",
    "price": 5.99,
    "currency": "USD",
    "reviewUrl": "https://example.com/review/cpx11",
    "remark": "Entry cloud VPS",
    "affiliateUrl": "https://example.com/aff/cpx11",
    "isDeleted": false,
    "createdAt": "2026-03-23T00:00:00.000Z",
    "updatedAt": "2026-03-23T00:30:00.000Z"
  }
}
```

错误码：

- `400`：产品 ID 非法、货币代码格式错误
- `401`：未登录或 Token 无效
- `2001`：产品不存在
- `429`：全局限流
- `500`：服务器内部错误

请求示例：

```bash
curl -X PUT "http://localhost/api/admin/products/99" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"price":5.99,"currency":"usd"}'
```

### 3.5 删除产品

- 路径：`DELETE /api/admin/products/:id`
- 认证：是

说明：

- 该接口执行软删除，实际行为是将 `isDeleted` 更新为 `true`。

成功响应示例：

```json
{
  "code": 0,
  "data": {
    "message": "产品已删除"
  }
}
```

错误码：

- `400`：产品 ID 非法
- `401`：未登录或 Token 无效
- `2001`：产品不存在
- `429`：全局限流
- `500`：服务器内部错误

请求示例：

```bash
curl -X DELETE "http://localhost/api/admin/products/99" \
  -H "Authorization: Bearer <token>"
```

### 3.6 获取全部配置项

- 路径：`GET /api/admin/config`
- 认证：是

成功响应示例：

```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "configKey": "announcement_zh",
      "configValue": "",
      "description": "Chinese announcement content",
      "updatedAt": "2026-03-23T00:00:00.000Z"
    },
    {
      "id": 2,
      "configKey": "announcement_en",
      "configValue": "",
      "description": "English announcement content",
      "updatedAt": "2026-03-23T00:00:00.000Z"
    }
  ]
}
```

说明：

- 返回数据库中的配置数组，按 `id asc` 排序。

错误码：

- `401`：未登录或 Token 无效
- `429`：全局限流
- `500`：服务器内部错误

请求示例：

```bash
curl "http://localhost/api/admin/config" \
  -H "Authorization: Bearer <token>"
```

### 3.7 更新配置项

- 路径：`PUT /api/admin/config`
- 认证：是

请求体：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `configKey` | `string` | 是 | 配置键 |
| `configValue` | `string` | 否 | 配置值；未传时会被保存为空字符串 |

当前系统内置配置键：

- `announcement_zh`
- `announcement_en`
- `link_telegram`
- `link_youtube`
- `link_blog`
- `link_x`
- `site_title_zh`
- `site_title_en`
- `site_logo`

请求示例：

```json
{
  "configKey": "site_title_zh",
  "configValue": "我的 VPS 导航"
}
```

成功响应示例：

```json
{
  "code": 0,
  "data": {
    "id": 7,
    "configKey": "site_title_zh",
    "configValue": "我的 VPS 导航",
    "description": "Chinese site title",
    "updatedAt": "2026-03-23T01:00:00.000Z"
  }
}
```

错误码：

- `400`：`configKey` 为空
- `401`：未登录或 Token 无效
- `3001`：配置项不存在
- `3002`：配置更新失败
- `429`：全局限流
- `500`：服务器内部错误

请求示例：

```bash
curl -X PUT "http://localhost/api/admin/config" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"configKey":"site_title_zh","configValue":"我的 VPS 导航"}'
```

## 4. 路由覆盖清单

以下 10 个实际路由均已在本文档覆盖：

1. `GET /api/products`
2. `GET /api/providers`
3. `GET /api/config`
4. `POST /api/admin/login`
5. `GET /api/admin/products`
6. `POST /api/admin/products`
7. `PUT /api/admin/products/:id`
8. `DELETE /api/admin/products/:id`
9. `GET /api/admin/config`
10. `PUT /api/admin/config`

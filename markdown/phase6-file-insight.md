# 阶段六 · 文件洞察记录

在阶段六中，我们实现了项目后端管理相关的前端页面。

### 新增文件洞察
- `frontend/src/pages/Admin/Login.tsx`
  - 使用了 Ant Design 的 `Form` 来处理登录流程。
  - 集成了 API 接口 `login()`，若登录成功则保存 token 到 `localStorage`。

- `frontend/src/components/AuthGuard.tsx`
  - 路由守卫组件。判断 `localStorage.getItem('token')` 是否存在，进行自动重定向到 `/admin/login`。
  
- `frontend/src/pages/Admin/AdminLayout.tsx`
  - 后台结构的主体布局。
  - 左侧使用 `Menu` 组件管理系统核心入口的切换，右侧提供登录者的安全登出功能，底部使用 `Outlet` 承接子页面。

- `frontend/src/pages/Admin/Products.tsx`
  - 后台产品核心管理页面。
  - 加入了增加、更新的数据提交 `Modal` 和用于展示列表的 `Table` 以及确认删除防误操作的 `Popconfirm` 制约。
  - 在添加产品的表单中实现了在填写时就处理流量、带宽数据单位的选项，与需求的提交规则结构解耦。
  
- `frontend/src/pages/Admin/Announcement.tsx`
  - 使用了 `Tabs` 分离中英文编辑区。
  - 加入了 `react-markdown` 渲染支持对 markdown 原文的实时预览。
  
- `frontend/src/pages/Admin/Settings.tsx`
  - 社交以及系统参数的管理页面。
  - 表单回显利用异步通过 API 取回全部配置后在内存转化为初始 state 对象再交给 `form.setFieldsValue(initialValues)` 完成回读展示。

### 更新文件
- `frontend/src/App.tsx`
  - 加入并完善了 `/admin` 的前端路由保护结构，将后台各个管理页面装载于 `AuthGuard` 与 `AdminLayout` 之中。

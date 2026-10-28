# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Mini Mall — 微型电商项目，用于验证 Next.js 16 全栈开发链路。

**功能范围**：商品浏览（列表/详情/搜索/分类筛选）、注册登录、购物车、下单与订单管理（模拟支付）、会员等级与折扣、后台管理（商品 CRUD / 分类管理 / 订单管理）。

技术栈：Next.js 16 App Router + TypeScript + Prisma 5 + SQLite + TailwindCSS 4。Phase 0（脚手架、数据模型、seed）已完成，业务代码（`src/lib/` 与 `src/app/`）待实现。

## 常用命令

- `npm run dev` — 启动开发服务器（Turbopack，输出到 `.next/dev`）
- `npm run build` — 生产构建（Turbopack）
- `npm run start` — 启动生产服务器
- `npm run lint` — ESLint（flat config）。注意：Next 16 已移除 `next lint`，`next build` 不再自动 lint
- `npx prisma migrate dev --name <name>` — 创建并应用迁移
- `npx prisma db seed` — 执行 seed（`tsx prisma/seed.ts`）
- `npx prisma generate` — 重新生成 Prisma client（schema 变更后必须执行；npm 11 的 install-scripts 审批机制导致 postinstall 未自动运行）
- `npm run db:reset` — `prisma migrate reset`（重置数据库 + 迁移 + seed）
- `npx prisma studio` — 数据库可视化（可选）

## 技术栈与版本

- Next.js 16.4.3（仅 App Router）、React 19.3.0
- TypeScript 5（strict），路径别名 `@/*` → `./src/*`
- Prisma 5.22 + SQLite（`DATABASE_URL` 在 `.env`）
- TailwindCSS 4：通过 `@tailwindcss/turbopack` 集成，**没有** `postcss.config.mjs` / `tailwind.config`，样式入口在 `src/app/globals.css` 顶部 `@import "tailwindcss"`
- 认证：bcryptjs（密码哈希）+ jose（JWT 签名）
- zod 4、server-only、clsx + tailwind-merge

## Next.js 16 破坏性变更（≠ Next 14/15）

这是 Next 16，与旧版差异大。不确定时读 `node_modules/next/dist/docs/`（`AGENTS.md` 也指向这里）：

1. **`middleware.ts` → `src/proxy.ts`**。导出函数名 `middleware` → `proxy`（或 default export）；运行时是 nodejs（非 edge，不可配置）。用 `export const config = { matcher: [...] }` 限定路径。proxy 里读 cookie 用 `request.cookies.get('session')`，**不是** `next/headers` 的 `cookies()`（后者只在 Server Component / Server Action / Route Handler 里用）。
2. **Async Request APIs**：`cookies()`、`headers()`、`draftMode()`、`params`、`searchParams` 全部是 Promise，必须 `await`；同步访问已彻底移除。`cookies().set()/delete()` 只能在 Server Function / Route Handler 里调用（不能用于 Server Component 渲染期）。
3. **类型化 props 助手**：`PageProps<'/route'>`、`LayoutProps<'/route'>`、`RouteContext`（`npx next typegen` 生成）。脚手架 `layout.tsx` 已用 `LayoutProps<"/">`。
4. **Turbopack 默认启用**（dev + build 均默认）。配置在顶层 `turbopack`（不再是 `experimental.turbopack`）；Tailwind 4 通过 `next.config.ts` 里的 `turbopack.rules` 接入。
5. **`next lint` 已移除**，直接用 `eslint`。
6. **`revalidateTag` 现要求第二个参数**（cacheLife profile）。本项目用 `revalidatePath` 做缓存失效；Server Action 里可用 `updateTag`/`refresh` 实现 read-your-writes。
7. **`images.domains` 已弃用** → 用 `images.remotePatterns`。远程商品图（picsum.photos）若走 `next/image` 需配置 remotePatterns。
8. `serverExternalPackages` 仍有效，但本项目基本无需配置：`@prisma/client` 已在 Next 内置自动外部化清单，`bcryptjs`/`jose` 是纯 JS 可直接打包。

## 数据模型（prisma/schema.prisma）

金额一律 `Int`（单位：分），UI 用 `formatPrice()` 转 `¥xx.xx`，避免 SQLite 浮点精度问题。

**SQLite 不支持 Prisma enum**（报错 P1012），所以角色/订单状态/会员等级一律用 `String` 字段 + 默认值，取值在应用层用 TypeScript 联合类型约束：

- `User.role`：`"USER" | "ADMIN"`（默认 `"USER"`）
- `Order.status`：`"PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED"`（默认 `"PENDING"`）
- `User.memberLevel` / `Order.memberLevel`：`"NORMAL" | "XINYUE1" | "XINYUE2" | "XINYUE3"`（默认 `"NORMAL"`）

模型与关键字段：
- `User`：`email`(unique)、`name`、`passwordHash`、`role`、`memberLevel`、`totalSpent`（累计下单原价，分）
- `Category`：`name`、`slug`(unique)、`description`
- `Product`：`name`、`slug`(unique)、`description`、`price`(分)、`stock`、`imageUrl`、`isActive`(软下架)、`categoryId`
- `CartItem`：`userId`+`productId` 唯一、`quantity`
- `Order`：`orderNumber`(unique)、`userId`、`status`、`subtotalAmount`(折前)、`totalAmount`(折后)、`memberLevel`(下单时等级快照)
- `OrderItem`：`orderId`、`productId`、`productName`+`price`（下单快照）、`quantity`

级联策略：`User→CartItem`、`Product→CartItem` 用 `Cascade`；`User→Order`、`Product→OrderItem` 用 `Restrict`（保护订单历史）。后台删除商品默认走 `isActive=false` 软下架，硬删仅无 OrderItem 关联时允许（捕获 Prisma `P2003` 返回友好提示）。

## 目录结构

```
prisma/schema.prisma, seed.ts
src/
├── proxy.ts                # 路由门禁（Next 16 替代 middleware）
├── app/
│   ├── layout.tsx, globals.css, page.tsx
│   ├── (shop)/             # 前台：products(列表/详情)、cart、checkout、orders
│   ├── (auth)/             # login、register
│   └── admin/              # 后台：仪表盘、products、categories、orders
├── components/{ui,layout,products,cart,orders,forms}/
└── lib/
    ├── prisma.ts           # PrismaClient 单例
    ├── auth.ts             # 会话签发/校验、requireUser/requireAdmin
    ├── utils.ts            # cn()/formatPrice()/slugify()
    ├── constants.ts        # 订单状态机、PAGE_SIZE
    ├── membership.ts       # 会员等级配置、折扣计算、等级判定
    ├── order.ts            # generateOrderNumber()、状态迁移判断
    ├── validations/        # zod schema（auth/product/category/cart/order）
    └── actions/            # Server Actions：auth/cart/order/admin
```

## 架构约定

- `app/**/page.tsx` 默认 Server Component，只做数据读取与渲染；含交互的组件标 `"use client"` 并调用 Server Action。Server Action 统一放 `src/lib/actions/**`（文件顶部 `"use server"`）。
- 数据访问统一走 `src/lib/prisma.ts`（PrismaClient 单例）。
- **认证（自定义）**：bcrypt 哈希密码 + jose 签 HS256 JWT，存 httpOnly cookie（name `session`）。`src/lib/auth.ts` 提供 `createSession`/`getSession`/`requireUser`/`requireAdmin`。`auth.ts` 与 `prisma.ts` 顶部 `import "server-only"`。
- **路由保护**：粗粒度门禁在 `src/proxy.ts`（公开 / 需登录 `/cart /checkout /orders` / 需 ADMIN `/admin`）；真正的数据权限在 Server Action 内用 `requireUser`/`requireAdmin` + `userId` 作用域二次校验。
- **商品浏览**：服务端按 `searchParams`（`q`/`category`/`page`/`sort`）构造 Prisma `where`；搜索用 GET 表单，分类用 `/products?category=slug` 链接。
- **购物车**：登录后可用。`addToCart` 用 `upsert` 累加并 `min(累计, stock)` 封顶；`updateQuantity`/`removeItem` 用 `updateMany`/`deleteMany` 严格按 `{id, userId}` 限定作用域。
- **下单（核心）**：`createOrder` 在 `prisma.$transaction` 内做「条件扣库存（`updateMany` 判 `count` 防超卖）→ 建订单（写 OrderItem 快照 + subtotal/total/memberLevel）→ 清空购物车 → 累计 `totalSpent` 并重算会员等级」。金额折后 `totalAmount = Math.round(subtotalAmount × discountRate)`。
- **会员折扣**：门槛与折扣在 `src/lib/membership.ts`。`totalSpent` 累计**下单原价**（折前小计），下单时升级、只作用于后续订单（本单按升级前等级算）。折扣：¥8000→0.98、¥80000→0.95、¥800000→0.90。取消订单不回退累计。
- **订单状态机**（`src/lib/constants.ts`）：`PENDING→PAID/CANCELLED`、`PAID→SHIPPED`（后台）、`SHIPPED→DELIVERED`（用户）。取消回补库存；`payOrder` 用 `updateMany` 的 `count===0` 判定无权/状态已变。
- **表单校验**：zod 4，schema 集中放 `lib/validations/`，统一 `safeParse` + `fieldErrors`（`flatten().fieldErrors`），配合 `useActionState`。
- **seed（幂等 upsert）**：账号 `admin@example.com`/`admin123`（ADMIN）、`user@example.com`/`user123`、`vip@example.com`/`vip123`（XINYUE2）；4 个分类、12 个商品（图用 `picsum.photos` 占位）。

## 环境变量（`.env`，已被 gitignore）

- `DATABASE_URL="file:./dev.db?connection_limit=1"`（SQLite 文件相对 `schema.prisma` 生成在 `prisma/dev.db`）
- `AUTH_SECRET`（≥32 字节随机串）

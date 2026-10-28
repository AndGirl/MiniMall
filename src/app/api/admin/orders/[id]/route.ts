import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUS_TRANSITIONS, isOrderStatus, type OrderStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

// PUT /api/admin/orders/[id] — 更新订单状态（校验状态机，取消回补库存）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const target = body.status;
  if (!isOrderStatus(target)) {
    return NextResponse.json({ error: "状态不合法" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  const from = order.status as OrderStatus;
  const allowed = ORDER_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(target)) {
    return NextResponse.json({ error: "不允许的状态变更" }, { status: 400 });
  }

  // 条件更新锁定「读取时的状态」，防止并发下覆盖已变更状态（TOCTOU）
  if (target === "CANCELLED") {
    // 取消回补库存：事务内先条件置为已取消，命中才回补
    const restored = await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id, status: from },
        data: { status: "CANCELLED" },
      });
      if (result.count === 0) {
        return false; // 状态已被并发变更，跳过回补
      }
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return true;
    });
    if (!restored) {
      return NextResponse.json({ error: "订单状态已变更，请刷新" }, { status: 400 });
    }
  } else {
    const result = await prisma.order.updateMany({
      where: { id, status: from },
      data: { status: target },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "订单状态已变更，请刷新" }, { status: 400 });
    }
  }

  const updated = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

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

  const allowed = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus];
  if (!allowed.includes(target)) {
    return NextResponse.json({ error: "不允许的状态变更" }, { status: 400 });
  }

  // 取消时回补库存（用条件更新防重复取消导致重复回补）
  if (target === "CANCELLED") {
    await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      });
      if (result.count === 0) {
        return; // 已被取消，跳过回补
      }
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });
  } else {
    await prisma.order.update({ where: { id }, data: { status: target } });
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

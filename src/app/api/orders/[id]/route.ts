import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/orders/[id] — 订单详情
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.userId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json(order);
}

// PUT /api/orders/[id] — 模拟支付（PENDING → PAID）
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  const result = await prisma.order.updateMany({
    where: { id, userId: session.userId, status: "PENDING" },
    data: { status: "PAID" },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "订单不存在或状态已变更" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  return NextResponse.json(order);
}

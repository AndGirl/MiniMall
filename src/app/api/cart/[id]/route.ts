import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/cart/[id] — 修改数量
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "数量不合法" }, { status: 400 });
  }

  const item = await prisma.cartItem.findFirst({
    where: { id, userId: session.userId },
    include: { product: true },
  });
  if (!item) {
    return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
  }

  if (quantity > item.product.stock) {
    return NextResponse.json({ error: "库存不足" }, { status: 400 });
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: { quantity },
    include: { product: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/cart/[id] — 删除某项
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  const result = await prisma.cartItem.deleteMany({
    where: { id, userId: session.userId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

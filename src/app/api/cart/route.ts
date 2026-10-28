import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/cart — 获取当前用户购物车
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
}

// POST /api/cart — 加入购物车（productId + quantity）
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  const quantity = Number(body.quantity ?? 1);

  if (!productId) {
    return NextResponse.json({ error: "缺少商品 ID" }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "数量不合法" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return NextResponse.json({ error: "商品不存在或已下架" }, { status: 404 });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
  });
  const newQuantity = (existing?.quantity ?? 0) + quantity;

  if (newQuantity > product.stock) {
    return NextResponse.json({ error: "库存不足" }, { status: 400 });
  }

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: session.userId, productId } },
    update: { quantity: newQuantity },
    create: { userId: session.userId, productId, quantity: newQuantity },
  });

  return NextResponse.json(item, { status: 201 });
}

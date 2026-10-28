import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getDiscountRate, getMemberLevelBySpent, isMemberLevel, MEMBER_LEVELS } from "@/lib/membership";
import { generateOrderNumber } from "@/lib/order";
import { prisma } from "@/lib/prisma";

// GET /api/orders — 我的订单列表
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// POST /api/orders — 从购物车创建订单（事务：建订单 → 扣库存 → 清空购物车 → 累计升级）
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 401 });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });

  const validItems = cartItems.filter((item) => item.product.isActive);
  if (validItems.length === 0) {
    return NextResponse.json({ error: "购物车为空" }, { status: 400 });
  }

  // 快失败预检：库存不足时返回具体商品
  for (const item of validItems) {
    if (item.quantity > item.product.stock) {
      return NextResponse.json(
        { error: `库存不足：${item.product.name}（仅剩 ${item.product.stock} 件）` },
        { status: 400 },
      );
    }
  }

  // 计算金额：本单按升级前会员等级折扣
  const level = isMemberLevel(user.memberLevel) ? user.memberLevel : MEMBER_LEVELS.NORMAL;
  const subtotalAmount = validItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const totalAmount = Math.round(subtotalAmount * getDiscountRate(level));
  const orderNumber = generateOrderNumber();

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 条件扣库存（防并发超卖）
      for (const item of validItems) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new Error(`库存不足：${item.product.name}`);
        }
      }

      // 创建订单 + 明细快照
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: "PENDING",
          subtotalAmount,
          totalAmount,
          memberLevel: user.memberLevel,
          items: {
            create: validItems.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // 清空购物车
      await tx.cartItem.deleteMany({ where: { userId: user.id } });

      // 累计下单原价并重算会员等级（升级只作用于后续订单）
      const newTotalSpent = user.totalSpent + subtotalAmount;
      await tx.user.update({
        where: { id: user.id },
        data: { totalSpent: newTotalSpent, memberLevel: getMemberLevelBySpent(newTotalSpent) },
      });

      return created;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("库存不足")) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}

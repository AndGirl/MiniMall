import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/orders — 所有订单列表
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: {
      items: true,
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

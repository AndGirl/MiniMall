import { Prisma } from "@prisma/client";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/categories/[id] — 删除分类（校验无商品）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  const { id } = await params;

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json({ error: "该分类下还有商品，无法删除" }, { status: 400 });
  }

  try {
    await prisma.category.delete({ where: { id } });
  } catch (e) {
    // 并发创建商品时，前置 count 检查可能失效，靠外键约束兜底
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "该分类下还有商品，无法删除" }, { status: 400 });
    }
    throw e;
  }

  return NextResponse.json({ success: true });
}

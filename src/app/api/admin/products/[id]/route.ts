import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/admin/products/[id] — 更新商品
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const priceYuan = Number(body.price);
  const stock = Number(body.stock);
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
  const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;

  if (!name) {
    return NextResponse.json({ error: "请输入商品名称" }, { status: 400 });
  }
  if (!Number.isFinite(priceYuan) || priceYuan <= 0 || priceYuan * 100 > 2147483647) {
    return NextResponse.json({ error: "价格不合法（超出范围）" }, { status: 400 });
  }
  if (!Number.isInteger(stock) || stock < 0 || stock > 2147483647) {
    return NextResponse.json({ error: "库存不合法" }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "请选择分类" }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      description: description || null,
      price: Math.round(priceYuan * 100),
      stock,
      imageUrl: imageUrl || null,
      categoryId,
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return NextResponse.json(product);
}

// DELETE /api/admin/products/[id] — 软下架
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  const { id } = await params;

  const product = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(product);
}

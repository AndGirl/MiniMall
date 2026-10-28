import { randomBytes } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// GET /api/admin/products — 商品列表（含下架，支持搜索/分类/分页）
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const search = sp.get("search") ?? undefined;
  const category = sp.get("category") ?? undefined;
  const page = Math.max(1, Math.floor(Number(sp.get("page") ?? "1") || 1));

  const where = {
    ...(search ? { name: { contains: search } } : {}),
    ...(category ? { category: { slug: category } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / PAGE_SIZE) });
}

// POST /api/admin/products — 创建商品
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

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

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "分类不存在" }, { status: 400 });
  }

  // slug 自动生成并去重
  let slug = slugify(name);
  if (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${slug}-${randomBytes(2).toString("hex")}`;
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description: description || null,
      price: Math.round(priceYuan * 100),
      stock,
      imageUrl: imageUrl || null,
      categoryId,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

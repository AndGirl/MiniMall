import { randomBytes } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// GET /api/admin/categories — 分类列表（含商品数量）
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(categories);
}

// POST /api/admin/categories — 创建分类
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

  if (!name) {
    return NextResponse.json({ error: "请输入分类名称" }, { status: 400 });
  }

  // slug 自动生成并去重
  let slug = slugify(name);
  if (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${slug}-${randomBytes(2).toString("hex")}`;
  }

  const category = await prisma.category.create({
    data: { name, slug, description: description || null },
  });

  return NextResponse.json(category, { status: 201 });
}

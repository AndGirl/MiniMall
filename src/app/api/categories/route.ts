import { NextResponse } from "next/server";

import { getCategories } from "@/lib/queries";

// GET /api/categories — 分类列表（含上架商品数量）
export async function GET() {
  const categories = await getCategories();
  return NextResponse.json(categories);
}

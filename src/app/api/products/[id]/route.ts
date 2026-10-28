import { NextRequest, NextResponse } from "next/server";

import { getProductById } from "@/lib/queries";

// GET /api/products/[id] — 商品详情（含分类）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product || !product.isActive) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  return NextResponse.json(product);
}

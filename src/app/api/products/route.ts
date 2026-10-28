import { NextRequest, NextResponse } from "next/server";

import { getProducts } from "@/lib/queries";

// GET /api/products — 商品列表（search/category/page，每页 9 条）
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const search = sp.get("search") ?? undefined;
  const category = sp.get("category") ?? undefined;
  const page = Number(sp.get("page") ?? "1") || 1;

  const result = await getProducts({ search, category, page });

  return NextResponse.json(result);
}

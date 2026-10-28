import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { PAGE_SIZE } from "./constants";

export type ProductListParams = {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};

// 商品列表（支持搜索、分类筛选、分页）
export async function getProducts(params: ProductListParams = {}) {
  const { search, category } = params;
  const page = Math.max(1, Math.floor(Number(params.page) || 1));
  const pageSize = Math.max(1, Math.floor(Number(params.pageSize) || PAGE_SIZE));

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(search
      ? { OR: [{ name: { contains: search } }, { description: { contains: search } }] }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// 商品详情（按 id，含分类）
export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
}

// 商品详情（按 slug，含分类）
export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
}

// 分类列表（含上架商品数量）
export async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
}

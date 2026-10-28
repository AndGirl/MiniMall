import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCategories, getProducts } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

type HomeSearchParams = Promise<{
  q?: string | string[];
  category?: string | string[];
  page?: string | string[];
}>;

// 取重复 query 参数的第一个值
function firstParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

// 构建保留现有筛选条件的分页/分类链接
function buildHref(base: { q?: string; category?: string; page?: string }) {
  const params = new URLSearchParams();
  if (base.q) params.set("q", base.q);
  if (base.category) params.set("category", base.category);
  if (base.page && base.page !== "1") params.set("page", base.page);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export default async function Home({ searchParams }: { searchParams: HomeSearchParams }) {
  const sp = await searchParams;
  const q = firstParam(sp.q);
  const category = firstParam(sp.category);
  const page = Number(firstParam(sp.page) || "1") || 1;

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getProducts({ search: q || undefined, category: category || undefined, page }),
    getCategories(),
  ]);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">商品列表</h1>

        {/* 搜索框 */}
        <form method="get" className="mb-4 flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="搜索商品名称或描述"
            className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-white transition-colors hover:bg-zinc-700">
            搜索
          </button>
        </form>

        {/* 分类标签 */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={buildHref({ q })}
            className={`rounded-full px-3 py-1 text-sm ${
              category ? "bg-zinc-100" : "bg-zinc-900 text-white"
            }`}
          >
            全部
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildHref({ q, category: c.slug })}
              className={`rounded-full px-3 py-1 text-sm ${
                category === c.slug ? "bg-zinc-900 text-white" : "bg-zinc-100"
              }`}
            >
              {c.name}（{c._count.products}）
            </Link>
          ))}
        </div>

        {/* 商品网格 */}
        {products.length === 0 ? (
          <p className="py-12 text-center text-zinc-500">没有找到相关商品</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group block overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-zinc-100">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">
                      暂无图片
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-zinc-500">{p.category.name}</p>
                  <p className="mt-2 text-lg font-semibold text-red-600">
                    {formatPrice(p.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            {page > 1 ? (
              <Link
                href={buildHref({ q, category, page: String(page - 1) })}
                className="rounded border px-4 py-2"
              >
                上一页
              </Link>
            ) : (
              <span className="rounded border px-4 py-2 text-zinc-300">上一页</span>
            )}
            <span className="text-sm text-zinc-600">
              第 {page} / {totalPages} 页（共 {total} 件）
            </span>
            {page < totalPages ? (
              <Link
                href={buildHref({ q, category, page: String(page + 1) })}
                className="rounded border px-4 py-2"
              >
                下一页
              </Link>
            ) : (
              <span className="rounded border px-4 py-2 text-zinc-300">下一页</span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

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
      <main className="mx-auto w-full max-w-7xl px-4 py-10">
        <h1 className="mb-8 font-display text-3xl font-bold tracking-tight">商品列表</h1>

        {/* 搜索框 */}
        <form method="get" className="mb-6 flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="搜索商品名称或描述"
            className="flex-1 rounded-lg border border-line bg-white px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2.5 text-white transition-colors hover:bg-primary-deep"
          >
            搜索
          </button>
        </form>

        {/* 分类标签 */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={buildHref({ q })}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              category
                ? "border-line bg-white text-muted hover:border-primary/40 hover:text-ink"
                : "border-primary bg-primary text-white"
            }`}
          >
            全部
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildHref({ q, category: c.slug })}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                category === c.slug
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-muted hover:border-primary/40 hover:text-ink"
              }`}
            >
              {c.name}（{c._count.products}）
            </Link>
          ))}
        </div>

        {/* 商品网格 */}
        {products.length === 0 ? (
          <p className="py-16 text-center text-muted">没有找到相关商品</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group block overflow-hidden rounded-lg border border-line bg-white transition-colors hover:border-primary/40"
              >
                <div className="relative aspect-square overflow-hidden bg-line/40">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted/70">
                      暂无图片
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="mt-0.5 text-sm text-muted">{p.category.name}</p>
                  <p className="mt-3 font-display text-lg font-semibold text-accent">
                    {formatPrice(p.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            {page > 1 ? (
              <Link
                href={buildHref({ q, category, page: String(page - 1) })}
                className="rounded-lg border border-line bg-white px-4 py-2 transition-colors hover:border-primary/40"
              >
                上一页
              </Link>
            ) : (
              <span className="rounded-lg border border-line px-4 py-2 text-muted/40">上一页</span>
            )}
            <span className="text-sm text-muted">
              第 {page} / {totalPages} 页（共 {total} 件）
            </span>
            {page < totalPages ? (
              <Link
                href={buildHref({ q, category, page: String(page + 1) })}
                className="rounded-lg border border-line bg-white px-4 py-2 transition-colors hover:border-primary/40"
              >
                下一页
              </Link>
            ) : (
              <span className="rounded-lg border border-line px-4 py-2 text-muted/40">下一页</span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

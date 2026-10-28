import Image from "next/image";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/products/AddToCartButton";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getProductBySlug } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));

  if (!product || !product.isActive) {
    notFound();
  }

  const inStock = product.stock > 0;

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* 商品大图 */}
          <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-line/40">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted/70">
                暂无图片
              </div>
            )}
          </div>

          {/* 商品信息 */}
          <div className="space-y-4">
            <p className="text-sm text-muted">{product.category.name}</p>
            <h1 className="font-display text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="font-display text-3xl font-semibold text-accent">
              {formatPrice(product.price)}
            </p>
            <p className="text-muted">{product.description ?? "暂无描述"}</p>
            <p className="text-sm text-muted">库存：{product.stock} 件</p>

            <AddToCartButton productId={product.id} slug={product.slug} inStock={inStock} />
          </div>
        </div>
      </main>
    </div>
  );
}

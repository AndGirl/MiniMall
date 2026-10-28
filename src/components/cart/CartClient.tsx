"use client";

import type { Prisma } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatPrice } from "@/lib/utils";

type CartItemWithProduct = Prisma.CartItemGetPayload<{ include: { product: true } }>;

// 购物车列表与交互（+/-、删除）
export function CartClient({ initialItems }: { initialItems: CartItemWithProduct[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  async function updateQuantity(id: string, quantity: number) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/cart/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "操作失败");
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(id: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "删除失败");
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "下单失败");
        return;
      }
      router.push(`/orders/${data.id}`);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="py-12 text-center text-muted">购物车是空的</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-accent">{error}</p>}
      <ul className="divide-y divide-line rounded-lg border border-line bg-white">
        {items.map((item) => {
          const outOfStock = item.quantity > item.product.stock;
          const lineTotal = item.product.price * item.quantity;
          return (
            <li key={item.id} className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-line/40">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted/70">
                    暂无图片
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="font-medium text-ink">{item.product.name}</p>
                <p className="text-sm text-muted">{formatPrice(item.product.price)}</p>
                {outOfStock && <p className="text-xs text-accent">库存不足</p>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={loading || item.quantity <= 1}
                  className="h-8 w-8 rounded border border-line disabled:opacity-40"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={loading || item.quantity >= item.product.stock}
                  className="h-8 w-8 rounded border border-line disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <div className="w-24 text-right font-display font-medium text-ink">
                {formatPrice(lineTotal)}
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={loading}
                className="text-sm text-accent disabled:opacity-40"
              >
                删除
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between">
        <span className="text-lg">
          总价：<span className="font-display font-semibold text-accent">{formatPrice(total)}</span>
        </span>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className="rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-deep disabled:opacity-50"
        >
          {loading ? "提交中..." : "提交订单"}
        </button>
      </div>
    </div>
  );
}

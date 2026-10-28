"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 加入购物车按钮（详情页）
export function AddToCartButton({
  productId,
  slug,
  inStock,
}: {
  productId: string;
  slug: string;
  inStock: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAdd() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push(`/login?next=/products/${slug}`);
        return;
      }
      if (!res.ok) {
        setMessage(data.error ?? "加入失败");
        return;
      }
      setMessage("已加入购物车");
    } catch {
      setMessage("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleAdd}
        disabled={!inStock || loading}
        className="rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-deep disabled:bg-line disabled:text-muted/50"
      >
        {loading ? "加入中..." : inStock ? "加入购物车" : "已售罄"}
      </button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}

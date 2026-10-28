"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 模拟支付按钮（PENDING → PAID）
export function PayButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "PUT" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "支付失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-deep disabled:opacity-50"
      >
        {loading ? "支付中..." : "模拟支付"}
      </button>
      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  );
}

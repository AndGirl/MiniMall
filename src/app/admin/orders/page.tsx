"use client";

import { useEffect, useState } from "react";

import { getOrderStatusLabel } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: { email: string; name: string };
  items: { productName: string; quantity: number }[];
};

// 订单管理页
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/orders");
    if (res.ok) {
      setOrders(await res.json());
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "操作失败");
        return;
      }
      await load();
    } catch {
      setError("网络错误");
    }
  }

  // 根据当前状态返回可用的流转操作
  function actions(order: AdminOrder) {
    const buttons: { label: string; status: string }[] = [];
    if (order.status === "PAID") buttons.push({ label: "发货", status: "SHIPPED" });
    if (order.status === "SHIPPED") buttons.push({ label: "完成", status: "COMPLETED" });
    if (["PENDING", "PAID", "SHIPPED"].includes(order.status)) {
      buttons.push({ label: "取消", status: "CANCELLED" });
    }
    return buttons;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">订单管理</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">订单号</th>
            <th className="p-2">用户</th>
            <th className="p-2">金额</th>
            <th className="p-2">状态</th>
            <th className="p-2">时间</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="p-2">{o.orderNumber}</td>
              <td className="p-2">
                {o.user.name}（{o.user.email}）
              </td>
              <td className="p-2">{formatPrice(o.totalAmount)}</td>
              <td className="p-2">{getOrderStatusLabel(o.status)}</td>
              <td className="p-2">{new Date(o.createdAt).toLocaleString("zh-CN")}</td>
              <td className="p-2 space-x-2">
                {actions(o).map((a) => (
                  <button
                    key={a.status}
                    onClick={() => updateStatus(o.id, a.status)}
                    className="text-blue-600 hover:underline"
                  >
                    {a.label}
                  </button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

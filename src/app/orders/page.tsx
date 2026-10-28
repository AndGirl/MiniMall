import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { getSession } from "@/lib/auth";
import { getOrderStatusLabel } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

// 我的订单列表
export default async function OrdersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">我的订单</h1>
        {orders.length === 0 ? (
          <p className="py-12 text-center text-zinc-500">暂无订单</p>
        ) : (
          <ul className="divide-y rounded border">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-zinc-500">
                      {order.createdAt.toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-500">
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <span className="font-semibold text-red-600">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

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
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">我的订单</h1>
        {orders.length === 0 ? (
          <p className="py-12 text-center text-muted">暂无订单</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-line/30"
                >
                  <div>
                    <p className="font-medium text-ink">{order.orderNumber}</p>
                    <p className="text-sm text-muted">
                      {order.createdAt.toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted">
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <span className="font-display font-semibold text-accent">
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

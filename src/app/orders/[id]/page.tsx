import { notFound, redirect } from "next/navigation";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { PayButton } from "@/components/orders/PayButton";
import { getSession } from "@/lib/auth";
import { getOrderStatusLabel } from "@/lib/constants";
import { isMemberLevel, MEMBER_LEVEL_CONFIG } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

// 订单详情
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/orders");
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.userId },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  const discountAmount = order.subtotalAmount - order.totalAmount;
  const levelLabel = isMemberLevel(order.memberLevel)
    ? MEMBER_LEVEL_CONFIG[order.memberLevel].label
    : order.memberLevel;

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">订单详情</h1>
          <span className="text-sm text-zinc-500">{getOrderStatusLabel(order.status)}</span>
        </div>

        <div className="mb-6 space-y-1 rounded border p-4 text-sm text-zinc-500">
          <p>订单号：{order.orderNumber}</p>
          <p>下单时间：{order.createdAt.toLocaleString("zh-CN")}</p>
          <p>会员等级：{levelLabel}</p>
        </div>

        <ul className="mb-6 divide-y rounded border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-zinc-500">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mb-6 space-y-1 rounded border p-4">
          <div className="flex justify-between">
            <span>商品小计</span>
            <span>{formatPrice(order.subtotalAmount)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-zinc-500">
              <span>会员优惠</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>应付</span>
            <span className="text-red-600">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        {order.status === "PENDING" && <PayButton orderId={order.id} />}
      </main>
    </div>
  );
}

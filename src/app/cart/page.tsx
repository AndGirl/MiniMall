import { redirect } from "next/navigation";

import { CartClient } from "@/components/cart/CartClient";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 购物车页（需登录）
export default async function CartPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/cart");
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">购物车</h1>
        <CartClient initialItems={items} />
      </main>
    </div>
  );
}

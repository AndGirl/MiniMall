import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

// 后台布局：验证 ADMIN 角色
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/admin");
  }
  if (session.role !== ROLES.ADMIN) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-48 shrink-0 border-r p-4">
        <h2 className="mb-4 font-bold">后台管理</h2>
        <nav className="space-y-2 text-sm">
          <Link href="/admin/products" className="block hover:underline">
            商品管理
          </Link>
          <Link href="/admin/orders" className="block hover:underline">
            订单管理
          </Link>
          <Link href="/admin/categories" className="block hover:underline">
            分类管理
          </Link>
          <Link href="/" className="block hover:underline">
            返回前台
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

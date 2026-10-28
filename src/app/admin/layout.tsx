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
      <aside className="w-48 shrink-0 border-r border-line bg-white">
        <h2 className="mb-6 px-2 font-display text-lg font-bold tracking-tight">后台管理</h2>
        <nav className="space-y-1 text-sm text-muted">
          <Link
            href="/admin/products"
            className="block rounded px-3 py-2 transition-colors hover:bg-line/40 hover:text-ink"
          >
            商品管理
          </Link>
          <Link
            href="/admin/orders"
            className="block rounded px-3 py-2 transition-colors hover:bg-line/40 hover:text-ink"
          >
            订单管理
          </Link>
          <Link
            href="/admin/categories"
            className="block rounded px-3 py-2 transition-colors hover:bg-line/40 hover:text-ink"
          >
            分类管理
          </Link>
          <Link
            href="/"
            className="block rounded px-3 py-2 transition-colors hover:bg-line/40 hover:text-ink"
          >
            返回前台
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

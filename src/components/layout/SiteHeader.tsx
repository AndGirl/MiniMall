import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { LogoutButton } from "./LogoutButton";

// 前台公共页头（根据登录状态显示不同入口）
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-ink">
          Mini Mall
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/cart" className="transition-colors hover:text-ink">
            购物车
          </Link>
          {user ? (
            <>
              {user.role === ROLES.ADMIN && (
                <Link href="/admin/products" className="transition-colors hover:text-ink">
                  后台管理
                </Link>
              )}
              <span className="text-ink">{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="transition-colors hover:text-ink">
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-4 py-1.5 text-white transition-colors hover:bg-primary-deep"
              >
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

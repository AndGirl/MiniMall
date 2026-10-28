import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { LogoutButton } from "./LogoutButton";

// 前台公共页头（根据登录状态显示不同入口）
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold">
          Mini Mall
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/cart" className="hover:underline">
            购物车
          </Link>
          {user ? (
            <>
              {user.role === ROLES.ADMIN && (
                <Link href="/admin/products" className="hover:underline">
                  后台管理
                </Link>
              )}
              <span>{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                登录
              </Link>
              <Link href="/register" className="hover:underline">
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

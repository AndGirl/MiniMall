import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

// 前台公共页头（根据登录状态显示不同入口）
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold">
          Mini Mall
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
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

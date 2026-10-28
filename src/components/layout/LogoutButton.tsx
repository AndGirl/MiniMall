"use client";

import { useRouter } from "next/navigation";

// 退出登录按钮
export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  return (
    <button type="button" onClick={handleLogout} className="transition-colors hover:text-ink">
      退出
    </button>
  );
}

import { NextRequest, NextResponse } from "next/server";

import { isRole, setSession, verifyPassword } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

// 内存级登录限流（按邮箱），重启/热重载后重置；多实例部署需换成 Redis 等共享存储
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

// POST /api/auth/login — 登录
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
  }

  const now = Date.now();
  const attempt = loginAttempts.get(email);
  if (attempt && attempt.lockedUntil > now) {
    return NextResponse.json({ error: "尝试次数过多，请稍后再试" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // 统一错误文案，不区分「用户不存在」和「密码错误」
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    const count = (attempt ? attempt.count : 0) + 1;
    if (count >= MAX_ATTEMPTS) {
      loginAttempts.set(email, { count: 0, lockedUntil: now + LOCK_MS });
    } else {
      loginAttempts.set(email, { count, lockedUntil: 0 });
    }
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }

  // 登录成功，清除失败记录
  loginAttempts.delete(email);

  const role: Role = isRole(user.role) ? user.role : ROLES.USER;
  await setSession(user.id, role);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}

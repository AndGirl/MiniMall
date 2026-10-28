import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";

import { hashPassword, setSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

// POST /api/auth/register — 注册
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "密码至少 8 位" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "请输入用户名" }, { status: 400 });
  }
  if (name.length > 50) {
    return NextResponse.json({ error: "用户名不能超过 50 个字符" }, { status: 400 });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
  }

  const user = await prisma.user
    .create({
      data: { email, name, passwordHash: await hashPassword(password) },
    })
    .catch((e: unknown) => {
      // 并发注册同一邮箱时，前置的 findUnique 查重可能都被绕过，靠唯一索引兜底
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return null;
      }
      throw e;
    });

  if (!user) {
    return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
  }

  await setSession(user.id, ROLES.USER);

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name },
    { status: 201 },
  );
}

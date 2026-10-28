import "server-only";

import { PrismaClient } from "@prisma/client";

// 开发环境热重载时复用同一个 PrismaClient 实例，避免重复创建连接
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

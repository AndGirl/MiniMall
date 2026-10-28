import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [adminHash, userHash, vipHash] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("user123", 10),
    bcrypt.hash("vip123", 10),
  ]);

  // Users
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@example.com",
      name: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Test User",
      passwordHash: userHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "vip@example.com" },
    update: { memberLevel: "XINYUE2", totalSpent: 8000000 },
    create: {
      email: "vip@example.com",
      name: "VIP User",
      passwordHash: vipHash,
      memberLevel: "XINYUE2",
      totalSpent: 8000000,
    },
  });

  // Categories
  const categories = [
    { name: "数码电子", slug: "electronics", description: "手机、电脑与数码配件" },
    { name: "服饰", slug: "clothing", description: "服装与鞋帽" },
    { name: "图书", slug: "books", description: "图书与出版物" },
    { name: "家居", slug: "home", description: "家居与生活用品" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // Products
  const products = [
    { name: "智能手机 Pro", slug: "smartphone-pro", description: "旗舰配置，6.7 英寸屏幕", price: 199900, stock: 50, category: "electronics" },
    { name: "无线蓝牙耳机", slug: "wireless-earbuds", description: "主动降噪，长续航", price: 49900, stock: 100, category: "electronics" },
    { name: "机械键盘", slug: "mechanical-keyboard", description: "87 键，热插拔轴体", price: 29900, stock: 80, category: "electronics" },
    { name: "4K 显示器", slug: "4k-monitor", description: "27 英寸，IPS 面板", price: 129900, stock: 30, category: "electronics" },
    { name: "纯棉 T 恤", slug: "cotton-tshirt", description: "舒适透气，多色可选", price: 7900, stock: 200, category: "clothing" },
    { name: "牛仔外套", slug: "denim-jacket", description: "经典版型，耐磨面料", price: 19900, stock: 60, category: "clothing" },
    { name: "运动鞋", slug: "sneakers", description: "缓震透气，适合跑步", price: 29900, stock: 90, category: "clothing" },
    { name: "深入理解计算机系统", slug: "csapp-book", description: "CSAPP 经典教材", price: 12900, stock: 150, category: "books" },
    { name: "三体全集", slug: "three-body-trilogy", description: "刘慈欣科幻三部曲", price: 8800, stock: 120, category: "books" },
    { name: "北欧风落地灯", slug: "floor-lamp", description: "简约设计，暖光照明", price: 39900, stock: 40, category: "home" },
    { name: "记忆棉枕头", slug: "memory-pillow", description: "慢回弹，护颈舒适", price: 15900, stock: 70, category: "home" },
    { name: "陶瓷马克杯", slug: "ceramic-mug", description: "简约纯色，容量 350ml", price: 3900, stock: 200, category: "home" },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        stock: p.stock,
        imageUrl: `https://picsum.photos/seed/${p.slug}/600/600`,
        category: { connect: { slug: p.category } },
      },
    });
  }

  console.log("Seed complete");
  console.log("  Admin: admin@example.com / admin123 (ADMIN)");
  console.log("  User:  user@example.com / user123 (NORMAL)");
  console.log("  VIP:   vip@example.com / vip123 (XINYUE2, 9.5 折)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

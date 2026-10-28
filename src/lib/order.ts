import { randomBytes } from "crypto";

// 生成订单号：ORD-yyyyMMdd-随机6位hex
export function generateOrderNumber(): string {
  const now = new Date();
  const yyyyMMdd = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  return `ORD-${yyyyMMdd}-${randomBytes(3).toString("hex")}`;
}

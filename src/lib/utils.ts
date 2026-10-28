import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 合并 Tailwind class，自动去重冲突的样式
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// 金额（分）格式化为人民币字符串，如 199900 -> ¥1999.00
export function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

// 将名称转换为 URL 友好的 slug（保留中文、字母和数字）
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w一-龥-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

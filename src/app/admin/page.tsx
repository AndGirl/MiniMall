import { redirect } from "next/navigation";

// 后台首页：重定向到商品管理
export default function AdminIndexPage() {
  redirect("/admin/products");
}

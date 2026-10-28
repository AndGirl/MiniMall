"use client";

import { useEffect, useState, type FormEvent } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { products: number };
};

// 分类管理页
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/categories");
    if (res.ok) {
      setCategories(await res.json());
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "创建失败");
        return;
      }
      setName("");
      setDescription("");
      await load();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(c: Category) {
    if (!confirm(`确定删除「${c.name}」吗？`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "删除失败");
        return;
      }
      await load();
    } catch {
      setError("网络错误");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold tracking-tight">分类管理</h1>
      {error && <p className="text-sm text-accent">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line bg-white p-4">
        <h2 className="font-bold">新增分类</h2>
        <div>
          <label className="mb-1 block text-sm">名称</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-line bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">描述</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-deep disabled:opacity-50"
        >
          {loading ? "创建中..." : "创建"}
        </button>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="p-2">名称</th>
            <th className="p-2">Slug</th>
            <th className="p-2">商品数</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b border-line">
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.slug}</td>
              <td className="p-2">{c._count.products}</td>
              <td className="p-2">
                <button onClick={() => handleDelete(c)} className="text-accent hover:underline">
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

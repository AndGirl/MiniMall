"use client";

import { useEffect, useState, type FormEvent } from "react";

import { formatPrice } from "@/lib/utils";

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string;
  category: Category;
};

// 商品管理页
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function load() {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/categories"),
    ]);
    if (pRes.ok) {
      const data = await pRes.json();
      setProducts(data.products);
    }
    if (cRes.ok) {
      setCategories(await cRes.json());
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setImageUrl("");
    setCategoryId("");
    setIsActive(true);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setDescription(p.description ?? "");
    setPrice(String(p.price / 100));
    setStock(String(p.stock));
    setImageUrl(p.imageUrl ?? "");
    setCategoryId(p.categoryId);
    setIsActive(p.isActive);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      imageUrl,
      categoryId,
      isActive,
    };
    try {
      const res = await fetch(
        editing ? `/api/admin/products/${editing.id}` : "/api/admin/products",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      setShowForm(false);
      await load();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`确定下架「${p.name}」吗？`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "下架失败");
        return;
      }
      await load();
    } catch {
      setError("网络错误");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <button onClick={openCreate} className="rounded bg-zinc-900 px-4 py-2 text-white">
          新增商品
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded border p-4">
          <h2 className="font-bold">{editing ? "编辑商品" : "新增商品"}</h2>
          <div>
            <label className="mb-1 block text-sm">名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">价格（元）</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">库存</label>
              <input
                type="number"
                step="1"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full rounded border px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm">图片 URL</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full rounded border px-3 py-2"
            >
              <option value="">请选择</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="text-sm">上架</span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded border px-4 py-2">
              取消
            </button>
          </div>
        </form>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">名称</th>
            <th className="p-2">分类</th>
            <th className="p-2">价格</th>
            <th className="p-2">库存</th>
            <th className="p-2">状态</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.category.name}</td>
              <td className="p-2">{formatPrice(p.price)}</td>
              <td className="p-2">{p.stock}</td>
              <td className="p-2">{p.isActive ? "上架" : "已下架"}</td>
              <td className="p-2 space-x-2">
                <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline">
                  编辑
                </button>
                {p.isActive && (
                  <button onClick={() => handleDelete(p)} className="text-red-600 hover:underline">
                    下架
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

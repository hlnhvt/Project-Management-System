# 📋 AeroTask — Hướng dẫn phát triển & Quy chuẩn kỹ thuật

> Tài liệu này tổng hợp các quy tắc, mẫu code và lưu ý kỹ thuật cần tuân thủ khi **tạo mới hoặc cập nhật** bất kỳ chức năng nào trong hệ thống AeroTask.

---

## 📁 Cấu trúc dự án

```
src/
├── app/
│   ├── page.js                  # Dashboard
│   ├── tasks/page.js            # Quản lý Công việc
│   ├── use-cases/page.js        # Quản lý Use Cases
│   ├── admin/
│   │   ├── users/page.js        # Quản lý Thành viên (Admin only)
│   │   └── roles/page.js        # Quản lý Phân quyền (Admin only)
│   └── login/page.js
├── components/
│   ├── DashboardLayout.js       # Layout bọc ngoài tất cả trang (trừ login)
│   └── Sidebar.js               # Thanh điều hướng + theme switcher
├── context/
│   └── AuthContext.js           # Quản lý Auth, quyền hạn, retry
└── lib/
    └── supabase.js              # Supabase client + withTimeout + getUserPermissions
```

---

## 🔐 Hệ thống Phân quyền (RBAC)

### Quy tắc quan trọng nhất
**Khi tạo mới một chức năng, BẮT BUỘC phải thực hiện đủ 4 bước sau:**

---

### Bước 1 — Thêm resource vào `RESOURCES` array (`admin/roles/page.js`)

```js
// src/app/admin/roles/page.js
// QUAN TRỌNG: Khi thêm chức năng mới, hãy bổ sung entry mới vào đây
const RESOURCES = [
  { key: 'tasks',     name: 'Quản lý Công việc (Tasks)',     desc: '...' },
  { key: 'use_cases', name: 'Quản lý Use Cases (Use Cases)', desc: '...' },
  { key: 'users',     name: 'Quản lý Thành viên (Users)',    desc: '...' },
  { key: 'roles',     name: 'Quản lý Phân quyền (Roles)',    desc: '...' },
  // ← Thêm chức năng mới vào đây
  { key: 'ten_chuc_nang', name: 'Tên hiển thị', desc: 'Mô tả ngắn gọn' },
];
```

---

### Bước 2 — Thêm permission mặc định khi tạo Role mới (`admin/roles/page.js`)

Trong hàm `handleCreateRole`, thêm resource mới vào cả **2 chỗ** (mock và Supabase thực):

```js
// Chế độ mock (preview)
const defaultPerms = [
  { id: 'p-' + Math.random(), role_id: newRoleId, resource: 'tasks',          can_view: false, ... },
  { id: 'p-' + Math.random(), role_id: newRoleId, resource: 'use_cases',      can_view: false, ... },
  { id: 'p-' + Math.random(), role_id: newRoleId, resource: 'users',          can_view: false, ... },
  { id: 'p-' + Math.random(), role_id: newRoleId, resource: 'roles',          can_view: false, ... },
  // ← Thêm dòng mới ở đây
  { id: 'p-' + Math.random(), role_id: newRoleId, resource: 'ten_chuc_nang',  can_view: false, can_create: false, can_update: false, can_delete: false },
];

// Supabase thực tế
const defaultPerms = [
  { role_id: newRoleData.id, resource: 'tasks',         can_view: false, ... },
  { role_id: newRoleData.id, resource: 'use_cases',     can_view: false, ... },
  { role_id: newRoleData.id, resource: 'users',         can_view: false, ... },
  { role_id: newRoleData.id, resource: 'roles',         can_view: false, ... },
  // ← Thêm dòng mới ở đây
  { role_id: newRoleData.id, resource: 'ten_chuc_nang', can_view: false, can_create: false, can_update: false, can_delete: false },
];
```

---

### Bước 3 — Áp dụng kiểm tra quyền trong trang chức năng mới

```js
// Đầu component — lấy hasPermission từ useAuth
const { hasPermission } = useAuth();

// Khai báo các biến quyền (đặt sau useEffect fetch data)
const canCreate = hasPermission('ten_chuc_nang', 'create') || !isSupabaseConfigured;
const canUpdate = hasPermission('ten_chuc_nang', 'update') || !isSupabaseConfigured;
const canDelete = hasPermission('ten_chuc_nang', 'delete') || !isSupabaseConfigured;

// Ẩn/hiện nút theo quyền trong JSX
{canCreate && <button onClick={handleOpenAddModal}>Tạo mới</button>}
{canUpdate && <button onClick={handleOpenEditModal}>Chỉnh sửa</button>}
{canDelete && <button onClick={handleDelete}>Xóa</button>}
```

> **Lưu ý:** `hasPermission` trong `AuthContext.js` đã có **Admin bypass** — Admin luôn trả về `true` cho mọi quyền, không cần cấu hình DB:
> ```js
> const hasPermission = (resource, action) => {
>   if (role?.name === 'Admin') return true; // Admin luôn có toàn quyền
>   if (!permissions || !permissions[resource]) return false;
>   return !!permissions[resource][action];
> };
> ```

---

### Bước 4 — Chạy SQL migration trên Supabase

Thêm quyền cho tất cả role hiện có trong DB (thay `'ten_chuc_nang'` bằng key thực):

```sql
INSERT INTO public.permissions (role_id, resource, can_view, can_create, can_update, can_delete) VALUES
('a1111111-1111-1111-1111-111111111111', 'ten_chuc_nang', TRUE,  TRUE,  TRUE,  TRUE),   -- Admin
('b2222222-2222-2222-2222-222222222222', 'ten_chuc_nang', TRUE,  TRUE,  TRUE,  FALSE),  -- Manager
('c3333333-3333-3333-3333-333333333333', 'ten_chuc_nang', TRUE,  FALSE, FALSE, FALSE),  -- Developer
('d4444444-4444-4444-4444-444444444444', 'ten_chuc_nang', TRUE,  TRUE,  TRUE,  TRUE)    -- Business Analyst
ON CONFLICT (role_id, resource) DO NOTHING;
```

> **Cách chạy:** Supabase Dashboard → SQL Editor → Paste → Run  
> `ON CONFLICT DO NOTHING` an toàn, có thể chạy nhiều lần.

---

### UUID cố định của các Role trong hệ thống

| Role | UUID |
|------|------|
| Admin | `a1111111-1111-1111-1111-111111111111` |
| Manager | `b2222222-2222-2222-2222-222222222222` |
| Developer | `c3333333-3333-3333-3333-333333333333` |
| Business Analyst | `d4444444-4444-4444-4444-444444444444` |

---

## 🎨 Quy chuẩn UI — Popup / Modal

### Backdrop (nền phía sau popup)
Tất cả popup phải dùng **nền mờ sáng**, không dùng đen:

```jsx
// ✅ ĐÚNG — nền mờ nhạt
<div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={closeModal} />

// ❌ SAI — nền đen đậm
<div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeModal} />
```

### Cấu trúc chuẩn của một Modal

```jsx
{isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
    {/* Backdrop mờ sáng */}
    <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

    {/* Panel nội dung */}
    <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-250 dark:border-slate-800 shadow-2xl p-6 relative z-10 bg-white/95 dark:bg-slate-900/95 animate-scale-up">
      {/* Nút đóng */}
      <button
        onClick={() => setIsModalOpen(false)}
        className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5 select-none">
        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Tiêu đề</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-550">Mô tả ngắn</p>
        </div>
      </div>

      {/* Nội dung */}
      ...

      {/* Footer buttons */}
      <div className="pt-4 border-t border-slate-150 dark:border-slate-855 flex gap-3">
        <button className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 text-xs font-bold cursor-pointer">
          Hủy
        </button>
        <button className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer">
          Lưu
        </button>
      </div>
    </div>
  </div>
)}
```

---

## ⏱️ Xử lý Database Timeout (Supabase Free Tier)

Supabase free tier thường "ngủ" sau thời gian không hoạt động. **Mọi truy vấn DB đều phải dùng `withTimeout`:**

```js
import { supabase, withTimeout } from '@/lib/supabase';

// ✅ ĐÚNG
const { data, error } = await withTimeout(
  supabase.from('ten_bang').select('*'),
  8500 // timeout 8.5 giây (mặc định)
);

// ❌ SAI — có thể treo vô hạn
const { data, error } = await supabase.from('ten_bang').select('*');
```

### Mẫu fetch data chuẩn với retry

```js
const fetchData = async () => {
  try {
    setLoading(true);
    setError('');

    const { data, error } = await withTimeout(
      supabase.from('ten_bang').select('*').order('created_at', { ascending: false })
    );

    if (error) throw error;
    if (data) setItems(data);

  } catch (err) {
    console.error('Lỗi tải dữ liệu:', err);
    setError(err.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
  } finally {
    setLoading(false);
  }
};
```

### Banner lỗi + nút Thử lại (bắt buộc có trong mọi trang)

```jsx
{error && (
  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex items-center justify-between gap-4">
    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">{error}</p>
    <button
      onClick={fetchData}
      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
    >
      Thử lại
    </button>
  </div>
)}
```

---

## 🧩 Mẫu trang chức năng chuẩn

```jsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';

export default function TenChucNangPage() {
  const { hasPermission } = useAuth();

  // State dữ liệu
  const [items, setItems] = useState([]);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quyền thao tác
  const canCreate = hasPermission('ten_chuc_nang', 'create') || !isSupabaseConfigured;
  const canUpdate = hasPermission('ten_chuc_nang', 'update') || !isSupabaseConfigured;
  const canDelete = hasPermission('ten_chuc_nang', 'delete') || !isSupabaseConfigured;

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('placeholder')) {
      setIsSupabaseConfigured(false);
      setLoading(false);
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error } = await withTimeout(
        supabase.from('ten_bang').select('*')
      );
      if (error) throw error;
      if (data) setItems(data);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Banner lỗi */}
        {error && (
          <div className="...">
            <p>{error}</p>
            <button onClick={fetchData}>Thử lại</button>
          </div>
        )}

        {/* Nút hành động — ẩn theo quyền */}
        {canCreate && <button onClick={handleOpenAddModal}>Tạo mới</button>}

        {/* Bảng dữ liệu */}
        {loading ? <LoadingSkeleton /> : <DataTable items={items} />}
      </div>
    </DashboardLayout>
  );
}
```

---

## 🗺️ Thêm mục mới vào Sidebar

Khi tạo trang mới, thêm vào `navItems` trong `src/components/Sidebar.js`:

```js
const navItems = [
  { name: 'Tổng quan',   href: '/',            icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Developer'] },
  { name: 'Công việc',   href: '/tasks',        icon: CheckSquare,     roles: ['Admin', 'Manager', 'Developer'] },
  { name: 'Use Cases',   href: '/use-cases',    icon: FileText,        roles: ['Admin', 'Manager', 'Developer', 'Business Analyst'] },
  { name: 'Thành viên',  href: '/admin/users',  icon: Users,           roles: ['Admin'] },
  { name: 'Phân quyền',  href: '/admin/roles',  icon: ShieldCheck,     roles: ['Admin'] },
  // ← Thêm mục mới vào đây
  { name: 'Tên mục mới', href: '/duong-dan',    icon: TenIcon,         roles: ['Admin', 'Manager'] },
];
```

> `roles` là danh sách các role được thấy mục này trong sidebar.

---

## 🗄️ Thêm bảng mới vào Supabase

Mỗi bảng mới cần: **Tạo bảng → Bật RLS → Tạo Policies → Insert seed data**

```sql
-- 1. Tạo bảng
CREATE TABLE IF NOT EXISTS public.ten_bang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ... các cột
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bật RLS
ALTER TABLE public.ten_bang ENABLE ROW LEVEL SECURITY;

-- 3. Tạo Policies
CREATE POLICY "read ten_bang" ON public.ten_bang FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "insert ten_bang" ON public.ten_bang FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "update ten_bang" ON public.ten_bang FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "delete ten_bang" ON public.ten_bang FOR DELETE TO authenticated USING (TRUE);

-- 4. Thêm permission cho các role (theo Bước 4 ở mục Phân quyền)
INSERT INTO public.permissions (role_id, resource, can_view, can_create, can_update, can_delete) VALUES
('a1111111-1111-1111-1111-111111111111', 'ten_bang', TRUE, TRUE, TRUE, TRUE),
...
ON CONFLICT (role_id, resource) DO NOTHING;
```

---

## ✅ Checklist khi tạo chức năng mới

- [ ] Tạo file `src/app/ten-chuc-nang/page.js` với mẫu chuẩn
- [ ] Dùng `withTimeout()` cho mọi truy vấn Supabase
- [ ] Có banner lỗi + nút Thử lại
- [ ] Lấy `hasPermission` từ `useAuth()` và khai báo `canCreate/canUpdate/canDelete`
- [ ] Ẩn/hiện các nút theo quyền
- [ ] Thêm route vào `navItems` trong `Sidebar.js` với đúng `roles`
- [ ] Thêm resource vào `RESOURCES` array trong `admin/roles/page.js`
- [ ] Thêm resource vào `defaultPerms` trong `handleCreateRole` (cả mock lẫn Supabase)
- [ ] Chạy SQL INSERT permissions trên Supabase SQL Editor
- [ ] Backdrop của tất cả modal dùng `bg-slate-500/15 backdrop-blur-md`
- [ ] Build kiểm tra: `npm run build`

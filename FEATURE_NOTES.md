# Lưu ý hệ thống — Khi thêm mới hoặc cập nhật chức năng

> File này dành cho AI assistant. Đọc trước khi triển khai BẤT KỲ thay đổi nào.
> Tài liệu chi tiết hơn: `DEVELOPMENT_GUIDE.md`

---

## 1. Ngữ cảnh dự án

**AeroTask** — hệ thống quản lý dự án nội bộ.  
Stack: **Next.js 16** · **React 19** · **Supabase** · **Tailwind CSS v4** · **Lucide React**

> **CẢNH BÁO:** Đây là **Next.js 16** — có breaking changes so với các phiên bản trước. Đọc `node_modules/next/dist/docs/` trước khi dùng API nào chưa chắc.

---

## 2. Quy tắc bắt buộc — Không được bỏ qua

### 2.1 Phân quyền (RBAC) — BẮT BUỘC 4 bước khi tạo chức năng mới

| Bước | File cần sửa | Việc cần làm |
|------|-------------|--------------|
| 1 | `src/app/admin/roles/page.js` | Thêm resource vào `RESOURCES` array |
| 2 | `src/app/admin/roles/page.js` | Thêm vào `defaultPerms` trong `handleCreateRole` (cả mock lẫn Supabase) |
| 3 | `src/app/[chuc-nang]/page.js` | Dùng `hasPermission()` và ẩn/hiện nút theo quyền |
| 4 | Supabase SQL Editor | Chạy `INSERT INTO permissions` cho 4 role hiện có |

UUID cố định của 4 role:
- Admin: `a1111111-1111-1111-1111-111111111111`
- Manager: `b2222222-2222-2222-2222-222222222222`
- Developer: `c3333333-3333-3333-3333-333333333333`
- Business Analyst: `d4444444-4444-4444-4444-444444444444`

### 2.2 Supabase — Luôn dùng `withTimeout()`

```js
// ✅ ĐÚNG
const { data, error } = await withTimeout(supabase.from('bang').select('*'));

// ❌ SAI — treo vô hạn khi Supabase free tier "ngủ"
const { data, error } = await supabase.from('bang').select('*');
```

### 2.3 Modal backdrop — Luôn dùng màu mờ sáng

```jsx
// ✅ ĐÚNG
<div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={closeModal} />

// ❌ SAI
<div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
```

### 2.4 Sidebar — Thêm mục mới vào `navItems`

File: `src/components/Sidebar.js`  
Có hai cách kiểm soát hiển thị mục menu:

```js
// Cách 1 — Role-based (hardcode theo tên role)
{ name: 'Công việc', href: '/tasks', icon: CheckSquare, roles: ['Admin', 'Manager', 'Developer'] }

// Cách 2 — Permission-based (theo quyền DB, linh hoạt hơn)
{ name: 'Thành viên', href: '/admin/users', icon: Users, permission: { resource: 'users', action: 'view' } }
```

> Dùng **permission-based** cho các trang có thể cấp quyền linh hoạt cho nhiều role khác nhau.  
> Admin luôn thấy tất cả mục (Admin bypass trong `hasPermission`).

---

## 3. Checklist nhanh — Tạo chức năng mới

```
□ Tạo src/app/[ten-chuc-nang]/page.js  (dùng mẫu chuẩn trong DEVELOPMENT_GUIDE.md)
□ Kiểm tra Supabase config (isSupabaseConfigured) trước khi fetch
□ Wrap mọi query bằng withTimeout()
□ Thêm banner lỗi + nút "Thử lại"
□ Khai báo canCreate / canUpdate / canDelete từ hasPermission()
□ Ẩn nút hành động theo quyền trong JSX
□ Thêm vào navItems (Sidebar.js) với roles phù hợp
□ Thêm vào RESOURCES array (admin/roles/page.js)
□ Thêm vào defaultPerms — cả mock lẫn Supabase (admin/roles/page.js)
□ Chạy SQL INSERT permissions trên Supabase (nếu có DB)
□ Nếu thêm bảng DB mới: CREATE TABLE → ENABLE RLS → CREATE POLICY
□ npm run build — kiểm tra không có lỗi
```

---

## 4. Checklist nhanh — Cập nhật chức năng hiện có

```
□ Đọc file hiện tại trước khi sửa
□ Nếu sửa logic phân quyền: kiểm tra cả Admin bypass lẫn chế độ preview
□ Nếu thêm cột DB: cập nhật SELECT query + cập nhật mock data (preview mode)
□ Nếu thêm trường form: validate cả client lẫn khi submit
□ Nếu sửa UI modal: giữ đúng cấu trúc backdrop + panel (DEVELOPMENT_GUIDE.md §UI)
□ npm run build — kiểm tra không có lỗi
```

---

## 5. Kiến trúc cần nhớ

```
src/
├── app/[trang]/page.js      — mỗi trang đều là 'use client', bọc trong DashboardLayout
├── components/
│   ├── DashboardLayout.js   — layout chính, phải bọc mọi trang (trừ login)
│   └── Sidebar.js           — navItems có roles[], phải thêm mục mới tại đây
├── context/AuthContext.js   — hasPermission(), role, user — lấy qua useAuth()
└── lib/supabase.js          — supabase client + withTimeout() + getUserPermissions()
```

**Admin bypass:** `hasPermission()` luôn trả `true` nếu `role.name === 'Admin'`.  
**Preview mode:** Khi `NEXT_PUBLIC_SUPABASE_URL` chưa cấu hình → dùng mock data, set `isSupabaseConfigured = false`.

---

## 6. Những lỗi hay gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| Query treo không trả về | Thiếu `withTimeout()` | Bọc lại bằng `withTimeout()` |
| Nút thao tác hiển thị nhưng không có quyền | Thiếu kiểm tra `canCreate/canUpdate/canDelete` | Thêm `{canXxx && <button>}` |
| Role mới không thấy chức năng | Thiếu bước 1–2 RBAC | Thêm resource vào RESOURCES + defaultPerms |
| Modal nền đen đậm | Dùng `bg-black/75` | Đổi thành `bg-slate-500/15 backdrop-blur-md` |
| Build lỗi import | Next.js 16 breaking change | Đọc docs trong `node_modules/next/dist/docs/` |

# AeroTask — Hệ Thống Quản Lý Tiến Độ Công Việc Team

Hệ thống quản lý công việc và tiến độ nội bộ (Kanban Board) được xây dựng trên nền tảng **Next.js (App Router)**, styled bằng **Tailwind CSS v4**, và sử dụng **Supabase** làm Cơ sở dữ liệu và Xác thực.

Hệ thống được thiết kế đặc biệt theo mô hình bảo mật: **không cho phép đăng ký công khai**, chỉ cho phép tài khoản quản trị (Admin) tạo tài khoản cho thành viên, đồng thời hỗ trợ **phân quyền động chi tiết đến từng chức năng và thao tác (Xem, Thêm, Sửa, Xóa)**.

---

## 🚀 Tính Năng Nổi Bật

1. **Dashboard Tổng Quan Hiện Đại**:
   - Giao diện Dark theme sang trọng dạng Glassmorphic với hiệu ứng phát sáng chuyển động tinh tế.
   - Thống kê thời gian thực số lượng công việc (Cần làm, Đang làm, Chờ duyệt, Hoàn thành).
   - Hiển thị tóm tắt danh sách quyền hạn động của tài khoản hiện tại.
2. **Bảng Công Việc Kanban Chuyên Nghiệp (`/tasks`)**:
   - Phân loại công việc theo 4 cột trạng thái: *Cần làm*, *Đang làm*, *Chờ duyệt*, *Đã xong*.
   - Phân quyền động: Tự động ẩn/hiển thị hoặc vô hiệu hóa các nút Thêm mới, Sửa, Xóa tương ứng với quyền của tài khoản.
   - Hỗ trợ gán người thực hiện (Assignee), ngày hạn chót và độ ưu tiên trực quan.
3. **Cấp Tài Khoản Thành Viên Bảo Mật (`/admin/users`)**:
   - Dành riêng cho Admin. Sử dụng **Supabase Auth Admin API** thông qua API Route an toàn ở Server side để tạo tài khoản mới bằng mật khẩu chỉ định sẵn, bảo mật tuyệt đối mã thông báo hệ thống (Service Role Key).
   - Tự động kích hoạt (Confirm email) để thành viên đăng nhập được ngay lập tức.
4. **Ma Trận Phân Quyền Chi Tiết (`/admin/roles`)**:
   - Dành riêng cho Admin. Cho phép tích chọn trực tiếp ma trận quyền CRUD (Xem, Thêm, Sửa, Xóa) cho từng vai trò (Admin, Manager, Developer) trên từng chức năng hệ thống (Tasks, Users, Roles).
   - Dữ liệu quyền lưu trực tiếp trong DB và cập nhật tức thì trên toàn hệ thống.
5. **Chế Độ Xem Trước Tiện Lợi (Preview Mode)**:
   - Khi chưa điền Supabase credentials, ứng dụng **tự động chuyển sang chế độ Xem trước với dữ liệu mô phỏng hoàn chỉnh**.
   - Bạn có thể đăng nhập thử, tạo công việc ảo, đổi trạng thái Kanban, thêm tài khoản và sửa phân quyền giả lập ngay trên giao diện để trải nghiệm trước!

---

## 🛠️ Hướng Dẫn Cài Đặt Chi Tiết

### Bước 1: Khởi Tạo Database Trên Supabase
1. Đăng nhập vào [Supabase](https://supabase.com/) và tạo một dự án (Project) mới miễn phí.
2. Tại thanh menu bên trái, truy cập vào mục **SQL Editor**.
3. Nhấn **New Query**, mở file [supabase_schema.sql](file:///d:/CPLQG/Project-Management-System/supabase_schema.sql) trong dự án này, sao chép toàn bộ code và dán vào SQL Editor của Supabase.
4. Nhấn **Run** để khởi tạo các bảng (`roles`, `permissions`, `profiles`, `tasks`), bật RLS policies, gán dữ liệu seed ban đầu và thiết lập triggers.

### Bước 2: Cấu Hình Biến Môi Trường
1. Sao chép file `.env.local.example` thành `.env.local` ở thư mục gốc:
   ```bash
   cp .env.local.example .env.local
   ```
2. Trên Supabase Dashboard, vào **Settings** -> **API**, sao chép các khóa tương ứng và điền vào `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = API anon key (khóa công khai)
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role secret key (khóa bí mật bảo mật cao ở server)

### Bước 3: Khởi Tạo Tài Khoản Quản Trị (Admin) Đầu Tiên
Vì hệ thống khóa chức năng đăng ký, bạn cần tạo tài khoản Admin đầu tiên trực tiếp từ Supabase để đăng nhập:
1. Trên Supabase Dashboard, truy cập mục **Authentication** -> **Users** -> Nhấn **Add User** -> **Create User**.
2. Nhập Email và Mật khẩu cho tài khoản Admin của bạn.
3. Nhấn **SQL Editor**, chạy đoạn code ngắn sau để gán quyền Admin cho tài khoản vừa tạo:
   ```sql
   -- Thay thế 'id-tai-khoan-vua-tao' bằng UUID của user bạn vừa thêm trong bảng Auth.users
   UPDATE public.profiles 
   SET role_id = 'a1111111-1111-1111-1111-111111111111' 
   WHERE id = 'id-tai-khoan-vua-tao';
   ```
4. Đăng nhập vào hệ thống bằng tài khoản Admin này để bắt đầu cấp tài khoản cho các thành viên khác!

---

## 💻 Hướng Dẫn Chạy Dự Án Cục Bộ

1. Cài đặt các gói phụ thuộc (NPM dependencies):
   ```bash
   npm install
   ```
2. Chạy ứng dụng ở môi trường phát triển (Development mode):
   ```bash
   npm run dev
   ```
3. Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

**Tài khoản thử nghiệm mặc định ở chế độ Xem trước (Preview Mode):**
- Tài khoản Admin: `admin@company.com` / Mật khẩu: bất kỳ
- Tài khoản Manager: `manager@company.com` / Mật khẩu: bất kỳ
- Tài khoản Developer: `dev1@company.com` / Mật khẩu: bất kỳ

---

## 📂 Danh Sách File Quan Trọng Trong Dự Án

- [supabase_schema.sql](file:///d:/CPLQG/Project-Management-System/supabase_schema.sql): Cấu trúc database, trigger và dữ liệu mẫu phân quyền.
- [src/lib/supabase.js](file:///d:/CPLQG/Project-Management-System/src/lib/supabase.js): Thiết lập kết nối client và server admin.
- [src/context/AuthContext.js](file:///d:/CPLQG/Project-Management-System/src/context/AuthContext.js): Điều phối phiên làm việc, quyền hạn và định tuyến.
- [src/components/Sidebar.js](file:///d:/CPLQG/Project-Management-System/src/components/Sidebar.js): Thanh điều hướng động theo phân quyền người dùng.
- [src/app/page.js](file:///d:/CPLQG/Project-Management-System/src/app/page.js): Dashboard thống kê và kiểm tra quyền hạn.
- [src/app/tasks/page.js](file:///d:/CPLQG/Project-Management-System/src/app/tasks/page.js): Bảng Kanban công việc phân quyền Thêm/Sửa/Xóa.
- [src/app/admin/users/page.js](file:///d:/CPLQG/Project-Management-System/src/app/admin/users/page.js): Admin cấp và quản lý tài khoản thành viên.
- [src/app/admin/roles/page.js](file:///d:/CPLQG/Project-Management-System/src/app/admin/roles/page.js): Admin chỉnh sửa ma trận phân quyền chi tiết.
- [src/app/api/admin/create-user/route.js](file:///d:/CPLQG/Project-Management-System/src/app/api/admin/create-user/route.js): API tạo user an toàn bằng Service Role Key.

-- =========================================================================
-- HỆ THỐNG QUẢN LÝ TIẾN ĐỘ CÔNG VIỆC TEAM - SUPABASE DATABASE SCHEMA
-- =========================================================================
-- Hướng dẫn: Sao chép toàn bộ nội dung file này và dán vào phần "SQL Editor"
-- trên trang quản trị dự án Supabase của bạn, sau đó nhấn "Run".
-- =========================================================================

-- 1. Xóa các bảng cũ nếu đã tồn tại để tránh xung đột (Thứ tự xóa ngược với khóa ngoại)
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- 2. Tạo bảng Roles (Vai trò người dùng trong hệ thống)
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật tính năng Row Level Security (RLS) cho roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 3. Tạo bảng Permissions (Cấu hình quyền hạn chi tiết cho từng vai trò trên từng chức năng)
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    resource TEXT NOT NULL, -- ví dụ: 'tasks', 'users', 'roles'
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, resource)
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- 4. Tạo bảng Profiles (Thông tin bổ sung của tài khoản, liên kết với auth.users)
-- Có cột manager_id trỏ đến chính bảng profiles đại diện cho quan hệ cấp trên - cấp dưới (cây cha con)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    role_id UUID REFERENCES public.roles(id),
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Tạo bảng Tasks (Công việc của nhóm)
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- DỮ LIỆU BAN ĐẦU (SEED DATA)
-- =========================================================================

-- Tạo các vai trò mặc định: Admin, Manager, Developer, Business Analyst
INSERT INTO public.roles (id, name, description) VALUES
('a1111111-1111-1111-1111-111111111111', 'Admin', 'Toàn quyền quản trị hệ thống, quản lý tài khoản và phân quyền'),
('b2222222-2222-2222-2222-222222222222', 'Manager', 'Quản lý dự án, phân công công việc và theo dõi tiến độ'),
('c3333333-3333-3333-3333-333333333333', 'Developer', 'Xem công việc được giao và cập nhật tiến độ công việc'),
('d4444444-4444-4444-4444-444444444444', 'Business Analyst', 'Xem tài liệu nghiệp vụ, tạo và chỉnh sửa công việc phân tích yêu cầu');

-- Gán quyền chi tiết cho vai trò Admin (Toàn quyền)
INSERT INTO public.permissions (role_id, resource, can_view, can_create, can_update, can_delete) VALUES
('a1111111-1111-1111-1111-111111111111', 'tasks', TRUE, TRUE, TRUE, TRUE),
('a1111111-1111-1111-1111-111111111111', 'users', TRUE, TRUE, TRUE, TRUE),
('a1111111-1111-1111-1111-111111111111', 'roles', TRUE, TRUE, TRUE, TRUE);

-- Gán quyền chi tiết cho vai trò Manager (Toàn quyền trên tasks, chỉ xem users)
INSERT INTO public.permissions (role_id, resource, can_view, can_create, can_update, can_delete) VALUES
('b2222222-2222-2222-2222-222222222222', 'tasks', TRUE, TRUE, TRUE, TRUE),
('b2222222-2222-2222-2222-222222222222', 'users', TRUE, FALSE, FALSE, FALSE),
('b2222222-2222-2222-2222-222222222222', 'roles', FALSE, FALSE, FALSE, FALSE);

-- Gán quyền chi tiết cho vai trò Developer (Chỉ xem và cập nhật task)
INSERT INTO public.permissions (role_id, resource, can_view, can_create, can_update, can_delete) VALUES
('c3333333-3333-3333-3333-333333333333', 'tasks', TRUE, FALSE, TRUE, FALSE),
('c3333333-3333-3333-3333-333333333333', 'users', TRUE, FALSE, FALSE, FALSE),
('c3333333-3333-3333-3333-333333333333', 'roles', FALSE, FALSE, FALSE, FALSE);

-- Gán quyền chi tiết cho vai trò Business Analyst (Xem, Thêm, Sửa tasks; chỉ Xem users)
INSERT INTO public.permissions (role_id, resource, can_view, can_create, can_update, can_delete) VALUES
('d4444444-4444-4444-4444-444444444444', 'tasks', TRUE, TRUE, TRUE, FALSE),
('d4444444-4444-4444-4444-444444444444', 'users', TRUE, FALSE, FALSE, FALSE),
('d4444444-4444-4444-4444-444444444444', 'roles', FALSE, FALSE, FALSE, FALSE);


-- =========================================================================
-- CHÍNH SÁCH BẢO MẬT ROW LEVEL SECURITY (RLS POLICIES)
-- =========================================================================

-- Cho phép đọc bảng đối với user đã đăng nhập
CREATE POLICY "Allow authenticated users to read roles" ON public.roles
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated users to insert roles" ON public.roles
    FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Allow authenticated users to update roles" ON public.roles
    FOR UPDATE TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated users to delete roles" ON public.roles
    FOR DELETE TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated users to read permissions" ON public.permissions
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated users to insert permissions" ON public.permissions
    FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Allow authenticated users to update permissions" ON public.permissions
    FOR UPDATE TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated users to delete permissions" ON public.permissions
    FOR DELETE TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
    FOR SELECT TO authenticated USING (TRUE);

-- Chỉ cho phép cập nhật profile của chính mình
CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Cho phép đọc công việc đối với mọi user đã đăng nhập
CREATE POLICY "Allow authenticated users to read tasks" ON public.tasks
    FOR SELECT TO authenticated USING (TRUE);

-- Cho phép thực hiện các thao tác viết trên tasks đối với các tài khoản đã đăng nhập
CREATE POLICY "Allow authenticated users to insert tasks" ON public.tasks
    FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Allow authenticated users to update tasks" ON public.tasks
    FOR UPDATE TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated users to delete tasks" ON public.tasks
    FOR DELETE TO authenticated USING (TRUE);

-- Cho phép toàn quyền cho vai trò dịch vụ (service_role) - để Next.js API Routes chạy an toàn
CREATE POLICY "Allow service_role full access on roles" ON public.roles USING (TRUE);
CREATE POLICY "Allow service_role full access on permissions" ON public.permissions USING (TRUE);
CREATE POLICY "Allow service_role full access on profiles" ON public.profiles USING (TRUE);
CREATE POLICY "Allow service_role full access on tasks" ON public.tasks USING (TRUE);


-- =========================================================================
-- TRÂU CHUYỂN ĐỔI TỰ ĐỘNG (TRIGGERS) CHO PROFILES
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role_id, manager_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(
      (new.raw_user_meta_data->>'role_id')::uuid,
      'c3333333-3333-3333-3333-333333333333' -- Mặc định Developer
    ),
    (new.raw_user_meta_data->>'manager_id')::uuid -- Gán quản lý trực tiếp từ user metadata
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================================================================
-- BẢNG LƯU TRỮ USE CASES & TRANSACTIONS
-- =========================================================================

-- Tạo bảng Use Cases
CREATE TABLE IF NOT EXISTS public.use_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Đơn giản', 'Trung bình', 'Phức tạp')),
    bmt TEXT NOT NULL CHECK (bmt IN ('B', 'M', 'T')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS cho use_cases
ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;

-- Tạo bảng Transactions của Use Case
CREATE TABLE IF NOT EXISTS public.use_case_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    use_case_id UUID REFERENCES public.use_cases(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS cho use_case_transactions
ALTER TABLE public.use_case_transactions ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- CHÍNH SÁCH BẢO MẬT (RLS POLICIES) CHO USE CASES & TRANSACTIONS
-- =========================================================================

-- Quyền cho use_cases
CREATE POLICY "Allow authenticated users to read use_cases" ON public.use_cases FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Allow authenticated users to insert use_cases" ON public.use_cases FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Allow authenticated users to update use_cases" ON public.use_cases FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Allow authenticated users to delete use_cases" ON public.use_cases FOR DELETE TO authenticated USING (TRUE);

-- Quyền cho use_case_transactions
CREATE POLICY "Allow authenticated users to read use_case_transactions" ON public.use_case_transactions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Allow authenticated users to insert use_case_transactions" ON public.use_case_transactions FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Allow authenticated users to update use_case_transactions" ON public.use_case_transactions FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "Allow authenticated users to delete use_case_transactions" ON public.use_case_transactions FOR DELETE TO authenticated USING (TRUE);

-- Quyền cho service_role
CREATE POLICY "Allow service_role full access on use_cases" ON public.use_cases USING (TRUE);
CREATE POLICY "Allow service_role full access on use_case_transactions" ON public.use_case_transactions USING (TRUE);


-- =========================================================================
-- MIGRATION: THÊM PHÂN QUYỀN USE CASES CHO CÁC VAI TRÒ HIỆN CÓ
-- Chạy đoạn này nếu database đã tồn tại (không chạy lại toàn bộ schema)
-- =========================================================================

-- Thêm quyền use_cases cho từng role (dùng INSERT ... ON CONFLICT DO NOTHING để tránh lỗi trùng lặp)
INSERT INTO public.permissions (role_id, resource, can_view, can_create, can_update, can_delete)
SELECT 
  r.id,
  'use_cases',
  CASE r.name
    WHEN 'Admin'            THEN TRUE
    WHEN 'Manager'          THEN TRUE
    WHEN 'Developer'        THEN TRUE
    WHEN 'Business Analyst' THEN TRUE
    ELSE FALSE
  END AS can_view,
  CASE r.name
    WHEN 'Admin'            THEN TRUE
    WHEN 'Manager'          THEN TRUE
    WHEN 'Developer'        THEN FALSE
    WHEN 'Business Analyst' THEN TRUE
    ELSE FALSE
  END AS can_create,
  CASE r.name
    WHEN 'Admin'            THEN TRUE
    WHEN 'Manager'          THEN TRUE
    WHEN 'Developer'        THEN FALSE
    WHEN 'Business Analyst' THEN TRUE
    ELSE FALSE
  END AS can_update,
  CASE r.name
    WHEN 'Admin'            THEN TRUE
    WHEN 'Manager'          THEN FALSE
    WHEN 'Developer'        THEN FALSE
    WHEN 'Business Analyst' THEN TRUE
    ELSE FALSE
  END AS can_delete
FROM public.roles r
ON CONFLICT (role_id, resource) DO NOTHING;

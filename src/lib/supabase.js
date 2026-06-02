import { createClient } from '@supabase/supabase-js';

// Sử dụng URL giả lập làm fallback để tránh lỗi biên dịch "supabaseUrl is required" khi build tĩnh
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : 'https://placeholder-project.supabase.co';

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_public_key'
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : 'placeholder-anon-key';

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key'
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : '';

// 1. Supabase Client dành cho Client-side (Trình duyệt) - sử dụng Anon Key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});


// 2. Supabase Admin Client dành cho Server-side (API Routes/Server Actions) - sử dụng Service Role Key
// Chỉ khởi tạo khi đang chạy trên môi trường Server (có khóa Service Key)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Hàm hỗ trợ lấy chi tiết quyền hạn của một người dùng dựa trên vai trò của họ.
 * Thao tác này được tối ưu hóa để có thể chạy cả ở Client-side hoặc Server-side.
 */
export async function getUserPermissions(userId) {
  try {
    // Lấy thông tin profile và role_id của user (có timeout 10s)
    const { data: profile, error: profileError } = await withTimeout(
      supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('id', userId)
        .single(),
      30000
    );

    if (profileError || !profile) {
      console.error('Lỗi khi lấy thông tin Profile:', profileError);
      return { role: null, permissions: [] };
    }

    // Lấy danh sách các quyền hạn được gán cho role_id đó (có timeout 10s)
    const { data: permissions, error: permissionsError } = await withTimeout(
      supabase
        .from('permissions')
        .select('*')
        .eq('role_id', profile.role_id),
      30000
    );

    if (permissionsError) {
      console.error('Lỗi khi lấy danh sách Permissions:', permissionsError);
      return { role: profile.roles, permissions: [] };
    }

    return {
      role: profile.roles,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      },
      permissions: permissions.reduce((acc, p) => {
        acc[p.resource] = {
          view: p.can_view,
          create: p.can_create,
          update: p.can_update,
          delete: p.can_delete,
        };
        return acc;
      }, {}),
    };
  } catch (err) {
    return { role: null, permissions: [], _timedOut: true };
  }
}

/**
 * Trình bao bọc đặt giới hạn thời gian (timeout) cho các Promise/truy vấn,
 * ngăn ngừa ứng dụng bị treo vô hạn khi mạng chậm hoặc database đang khởi động (ngủ).
 */
export function withTimeout(promise, ms = 30000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Yêu cầu hết thời gian phản hồi (Timeout). Máy chủ cơ sở dữ liệu có thể đang ngủ và đang được khởi động lại. Vui lòng bấm nút Thử lại hoặc tải lại trang.'));
    }, ms);
  });
  
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
}

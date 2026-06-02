import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    // 1. Kiểm tra cấu hình phím bảo mật Supabase Service Role Key
    if (!supabaseAdmin) {
      // Nếu chưa cấu hình, cho phép chế độ xem trước (Preview Mode) trả về dữ liệu mô phỏng thành công
      const body = await request.json();
      return NextResponse.json({
        success: true,
        isPreviewMode: true,
        user: {
          id: 'mock-' + Math.random().toString(36).substr(2, 9),
          email: body.email,
          user_metadata: {
            full_name: body.full_name,
            role_id: body.role_id,
            manager_id: body.manager_id || null,
          },
          created_at: new Date().toISOString(),
        },
        message: 'Đang chạy ở chế độ Xem trước. Tài khoản mô phỏng được tạo thành công!',
      });
    }

    // 2. Xác minh người yêu cầu (Requester) có phải Admin không
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Lấy thông tin user từ token gửi lên
    const { data: { user: requester }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !requester) {
      return NextResponse.json({ error: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401 });
    }

    // Kiểm tra vai trò của requester trong DB
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, roles(*)')
      .eq('id', requester.id)
      .single();

    if (profileError || !profile || profile.roles?.name !== 'Admin') {
      return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này. Chỉ dành cho Admin.' }, { status: 403 });
    }

    // 3. Đọc dữ liệu tài khoản mới cần tạo từ Request Body
    const { email, password, full_name, role_id, manager_id } = await request.json();

    if (!email || !password || !full_name || !role_id) {
      return NextResponse.json({ error: 'Vui lòng cung cấp đầy đủ thông tin: Email, Mật khẩu, Họ tên và Vai trò.' }, { status: 400 });
    }

    // 4. Thực hiện tạo tài khoản bằng Supabase Auth Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Tự động xác thực email để đăng nhập được ngay
      user_metadata: {
        full_name,
        role_id,
        manager_id: manager_id || null,
      },
    });


    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Trả về thành công
    return NextResponse.json({
      success: true,
      user: newUser.user,
      message: 'Tạo tài khoản thành viên thành công!',
    });

  } catch (error) {
    console.error('Lỗi nghiêm trọng API create-user:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống nội bộ.' }, { status: 500 });
  }
}

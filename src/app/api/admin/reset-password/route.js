import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        isPreviewMode: true,
        message: 'Đang chạy ở chế độ Xem trước. Mật khẩu mô phỏng đã được đặt lại thành công!',
      });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requester }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !requester) {
      return NextResponse.json({ error: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, roles(*)')
      .eq('id', requester.id)
      .single();

    if (profileError || !profile || !['Admin', 'Manager'].includes(profile.roles?.name)) {
      return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này.' }, { status: 403 });
    }

    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json({ error: 'Thiếu thông tin yêu cầu.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công!',
    });

  } catch (error) {
    console.error('Lỗi API reset-password:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống nội bộ.' }, { status: 500 });
  }
}

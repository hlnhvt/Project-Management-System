import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin, withTimeout } from '@/lib/supabase';

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        isPreviewMode: true,
        message: 'Đang chạy ở chế độ Xem trước. Thông báo mô phỏng đã được gửi thành công!',
      });
    }

    // Verify caller is authenticated
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requester }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !requester) {
      return NextResponse.json({ error: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401 });
    }

    // Check caller is Admin or Manager
    const { data: profile } = await withTimeout(
      supabase.from('profiles').select('*, roles(name)').eq('id', requester.id).single()
    );
    if (!profile || !['Admin', 'Manager'].includes(profile.roles?.name)) {
      return NextResponse.json({ error: 'Bạn không có quyền gửi thông báo.' }, { status: 403 });
    }

    const { title, body, targetType, targetRoleId, targetUserIds } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Tiêu đề thông báo không được để trống.' }, { status: 400 });
    }

    // Insert notification record
    const { data: notification, error: notifError } = await withTimeout(
      supabaseAdmin.from('notifications').insert({
        title: title.trim(),
        body: body?.trim() || null,
        sender_id: requester.id,
      }).select().single()
    );
    if (notifError) {
      return NextResponse.json({ error: 'Không thể tạo thông báo.' }, { status: 500 });
    }

    // Resolve recipient IDs
    let recipientIds = [];
    if (targetType === 'all') {
      const { data: profiles } = await withTimeout(
        supabaseAdmin.from('profiles').select('id')
      );
      recipientIds = (profiles || []).map(p => p.id);
    } else if (targetType === 'role' && targetRoleId) {
      const { data: profiles } = await withTimeout(
        supabaseAdmin.from('profiles').select('id').eq('role_id', targetRoleId)
      );
      recipientIds = (profiles || []).map(p => p.id);
    } else if (targetType === 'user' && Array.isArray(targetUserIds) && targetUserIds.length) {
      recipientIds = targetUserIds;
    }

    if (recipientIds.length === 0) {
      await supabaseAdmin.from('notifications').delete().eq('id', notification.id);
      return NextResponse.json({ error: 'Không tìm thấy người nhận nào.' }, { status: 400 });
    }

    // Insert all recipients
    const { error: recipError } = await withTimeout(
      supabaseAdmin.from('notification_recipients').insert(
        recipientIds.map(rid => ({
          notification_id: notification.id,
          recipient_id: rid,
          is_read: false,
        }))
      )
    );
    if (recipError) {
      return NextResponse.json({ error: 'Không thể gửi thông báo đến người nhận.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Đã gửi thông báo đến ${recipientIds.length} người nhận.`,
      notification,
    });

  } catch (error) {
    console.error('Lỗi API notifications/create:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống nội bộ.' }, { status: 500 });
  }
}

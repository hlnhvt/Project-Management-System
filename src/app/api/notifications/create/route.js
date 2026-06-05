import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin, withTimeout } from '@/lib/supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const IS_CONFIGURED = !!(
  SUPABASE_URL && SUPABASE_URL !== 'your_supabase_project_url'
);

// Tạo client dùng JWT của user (thay thế khi không có service role key)
function createUserClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request) {
  try {
    if (!IS_CONFIGURED) {
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

    // Ưu tiên dùng supabaseAdmin (service role), fallback sang user-scoped client
    const dbClient = supabaseAdmin || createUserClient(token);

    const { data: profile } = await withTimeout(
      supabase.from('profiles').select('*, roles(name)').eq('id', requester.id).single()
    );

    const { title, body, targetType, targetRoleId, targetUserIds, actionUrl } = await request.json();

    // Gửi đến tất cả hoặc theo role → chỉ Admin/Manager mới được phép
    if (targetType !== 'user' && (!profile || !['Admin', 'Manager'].includes(profile.roles?.name))) {
      return NextResponse.json({ error: 'Bạn không có quyền gửi thông báo.' }, { status: 403 });
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Tiêu đề thông báo không được để trống.' }, { status: 400 });
    }

    // Insert notification record
    const { data: notification, error: notifError } = await withTimeout(
      dbClient.from('notifications').insert({
        title: title.trim(),
        body: body?.trim() || null,
        sender_id: requester.id,
        action_url: actionUrl || null,
      }).select().single()
    );
    if (notifError) {
      console.error('[notifications/create] insert notification error:', notifError);
      return NextResponse.json({ error: 'Không thể tạo thông báo.', detail: notifError.message }, { status: 500 });
    }

    // Resolve recipient IDs
    let recipientIds = [];
    if (targetType === 'all') {
      const { data: profiles } = await withTimeout(
        dbClient.from('profiles').select('id')
      );
      recipientIds = (profiles || []).map(p => p.id);
    } else if (targetType === 'role' && targetRoleId) {
      const { data: profiles } = await withTimeout(
        dbClient.from('profiles').select('id').eq('role_id', targetRoleId)
      );
      recipientIds = (profiles || []).map(p => p.id);
    } else if (targetType === 'user' && Array.isArray(targetUserIds) && targetUserIds.length) {
      recipientIds = targetUserIds;
    }

    if (recipientIds.length === 0) {
      await dbClient.from('notifications').delete().eq('id', notification.id);
      return NextResponse.json({ error: 'Không tìm thấy người nhận nào.' }, { status: 400 });
    }

    // Insert all recipients
    const { error: recipError } = await withTimeout(
      dbClient.from('notification_recipients').insert(
        recipientIds.map(rid => ({
          notification_id: notification.id,
          recipient_id: rid,
          is_read: false,
        }))
      )
    );
    if (recipError) {
      console.error('[notifications/create] insert recipients error:', recipError);
      return NextResponse.json({ error: 'Không thể gửi thông báo đến người nhận.', detail: recipError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Đã gửi thông báo đến ${recipientIds.length} người nhận.`,
      notification,
    });

  } catch (error) {
    console.error('Lỗi API notifications/create:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống nội bộ.', detail: error.message }, { status: 500 });
  }
}

import { supabase } from './supabase';

/**
 * Gửi thông báo hệ thống tới một người dùng cụ thể.
 * Gọi API /api/notifications/create với Bearer token của user hiện tại.
 * Silent fail — notification không phải chức năng critical.
 *
 * @param {{ title: string, body: string, recipientId: string, senderId?: string }} opts
 */
export async function sendNotification({ title, body, recipientId, senderId }) {
  if (!recipientId) return;
  // Không gửi self-notification
  if (senderId && recipientId === senderId) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title,
        body,
        targetType: 'user',
        targetUserIds: [recipientId],
      }),
    });
  } catch {
    // Silently ignore — không ảnh hưởng luồng chính
  }
}

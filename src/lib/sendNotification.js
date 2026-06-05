import { supabase } from './supabase';

export async function sendNotification({ title, body, recipientId, senderId, actionUrl }) {
  console.log('[sendNotification] called →', { recipientId, senderId, title });

  if (!recipientId) {
    console.warn('[sendNotification] skip: no recipientId');
    return;
  }
  if (senderId && recipientId === senderId) {
    console.warn('[sendNotification] skip: self-notification');
    return;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.warn('[sendNotification] skip: no active session');
      return;
    }
    console.log('[sendNotification] calling API…');

    const res = await fetch('/api/notifications/create', {
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
        actionUrl: actionUrl || null,
      }),
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[sendNotification] API error', res.status, resData);
    } else if (resData.isPreviewMode) {
      console.warn('[sendNotification] preview mode — not saved (check SUPABASE_SERVICE_ROLE_KEY)');
    } else {
      console.log('[sendNotification] success →', resData.message);
    }
  } catch (err) {
    console.error('[sendNotification] exception:', err);
  }
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BellOff, X, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, withTimeout } from '@/lib/supabase';
import notifStore from '@/lib/notifStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const IS_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
);

let _bellChannelSeq = 0;

const PREVIEW_ITEMS = [
  { id: 'pr1', is_read: false, notifications: { id: 'n1', title: 'Chào mừng đến với Projexa!', body: '<p>Hệ thống quản lý dự án nội bộ đã <strong>sẵn sàng</strong> phục vụ bạn.</p><ul><li>Kiểm tra các công việc được giao</li><li>Cập nhật nhật ký hàng ngày</li></ul>', created_at: new Date().toISOString() } },
  { id: 'pr2', is_read: false, notifications: { id: 'n2', title: 'Sprint 3 đã được khởi động', body: '<p>Sprint 3 của dự án CPLQG vừa được tạo và bắt đầu từ hôm nay.</p>', created_at: new Date(Date.now() - 3600000).toISOString() } },
  { id: 'pr3', is_read: true,  notifications: { id: 'n3', title: 'Cập nhật tính năng hệ thống', body: '<p>Phiên bản mới đã được triển khai với nhiều cải tiến về giao diện.</p>', created_at: new Date(Date.now() - 86400000).toISOString() } },
];

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000)    return 'Vừa xong';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function NotificationBell() {
  const { user }   = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen]           = useState(false);
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [detailItem, setDetailItem]   = useState(null);
  const [toast, setToast]             = useState(null);
  // toastKey forces progress-bar animation to restart on each new toast
  const [toastKey, setToastKey]       = useState(0);
  const dropdownRef   = useRef(null);
  const toastTimerRef = useRef(null);

  const unreadCount = items.filter(r => !r.is_read).length;

  const fetchItems = useCallback(async () => {
    if (!user) return;
    if (!IS_CONFIGURED) { setItems(PREVIEW_ITEMS); return; }
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('notification_recipients')
          .select('id, is_read, notifications(id, title, body, action_url, created_at)')
          .eq('recipient_id', user.id)
          .order('created_at', { referencedTable: 'notifications', ascending: false })
          .limit(15)
      );
      if (error) { console.error('[NotificationBell] fetchItems error:', error); }
      else {
        console.log('[NotificationBell] fetchItems data:', data?.length, 'items', data);
        setItems(data || []);
      }
    } catch (err) { console.error('[NotificationBell] fetchItems exception:', err); }
    setLoading(false);
  }, [user]);

  const showToast = useCallback((rec) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(rec);
    setToastKey(k => k + 1);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Sync unread count vào store để Sidebar và các component khác dùng chung
  useEffect(() => {
    notifStore.set(items.filter(r => !r.is_read).length);
  }, [items]);

  useEffect(() => {
    if (!user || !IS_CONFIGURED) return;
    const name = `notif-bell-${user.id}-${++_bellChannelSeq}`;
    const channel = supabase
      .channel(name)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_recipients',
        filter: `recipient_id=eq.${user.id}`,
      }, async (payload) => {
        fetchItems();
        // Fetch chi tiết thông báo mới để hiển thị toast
        try {
          const { data } = await withTimeout(
            supabase
              .from('notification_recipients')
              .select('id, is_read, notifications(id, title, body, action_url, created_at)')
              .eq('id', payload.new.id)
              .single()
          );
          if (data?.notifications) showToast(data);
        } catch {}
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchItems, showToast]);

  // Cleanup timer khi unmount
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  // Đóng dropdown khi click ngoài (trừ khi modal chi tiết đang mở)
  useEffect(() => {
    if (!isOpen || detailItem) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, detailItem]);

  const markAllRead = async () => {
    const ids = items.filter(r => !r.is_read).map(r => r.id);
    if (!ids.length) return;
    setItems(prev => prev.map(r => ({ ...r, is_read: true })));
    if (!IS_CONFIGURED) return;
    await withTimeout(
      supabase.from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', ids)
    ).catch(() => {});
  };

  const markOneRead = useCallback(async (id) => {
    setItems(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
    if (!IS_CONFIGURED) return;
    await withTimeout(
      supabase.from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
    ).catch(() => {});
  }, []);

  const openDetail = (rec) => {
    setDetailItem(rec);
    if (!rec.is_read) markOneRead(rec.id);
  };

  const openToastDetail = () => {
    if (!toast) return;
    const actionUrl = toast.notifications?.action_url;
    dismissToast();
    if (actionUrl) {
      if (actionUrl.includes('/daily-logs')) {
        const params = new URLSearchParams(actionUrl.split('?')[1] || '');
        const gotoDate = params.get('goto_date');
        if (gotoDate) localStorage.setItem('aerotask_goto_log_date', gotoDate);
        const viewingUserId = params.get('viewing_user_id');
        if (viewingUserId) localStorage.setItem('aerotask_viewing_user_id', viewingUserId);
      }
      setIsOpen(false);
      router.push(actionUrl.split('?')[0]);
    } else {
      openDetail(toast);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* ── Bell button ───────────────────────────────────────────────── */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className="relative p-3.5 rounded-2xl bg-white dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white shadow-lg shadow-slate-200/80 dark:shadow-black/40 border border-slate-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Thông báo"
        >
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-bell-shake' : ''}`} />
          {unreadCount > 0 && (
            <span className="animate-badge-pop absolute -top-2 -right-2 min-w-[22px] h-[22px] bg-rose-500 text-white text-[11px] font-black rounded-full flex items-center justify-center px-1 leading-none shadow-md shadow-rose-500/40 ring-2 ring-white dark:ring-gray-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* ── Dropdown panel ────────────────────────────────────────────── */}
        {isOpen && (
          <div className="absolute right-0 bottom-full mb-3 w-80 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-none z-[100] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Thông báo</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full border border-rose-500/20">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Đọc tất cả
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <BellOff className="h-8 w-8 text-slate-300 dark:text-gray-600" />
                  <p className="text-xs text-slate-400 dark:text-gray-500">Chưa có thông báo nào</p>
                </div>
              ) : (
                items.map(rec => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => openDetail(rec)}
                    className={`w-full text-left flex gap-3 px-4 py-3 border-b border-slate-100 dark:border-gray-800/60 last:border-0 transition-colors cursor-pointer ${
                      !rec.is_read
                        ? 'bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-gray-800/30'
                    }`}
                  >
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!rec.is_read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-snug ${!rec.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-400'}`}>
                        {rec.notifications?.title}
                      </p>
                      {rec.notifications?.body && (
                        <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5 line-clamp-2 leading-snug">
                          {stripHtml(rec.notifications.body)}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-300 dark:text-gray-600 mt-1">
                        {timeAgo(rec.notifications?.created_at)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-gray-800 bg-slate-50/80 dark:bg-gray-950/40">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 block text-center transition-colors"
              >
                Xem tất cả thông báo →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast thông báo mới ────────────────────────────────────────────── */}
      {toast && (
        <div key={toastKey} className="fixed bottom-24 right-6 z-[150] w-80 animate-toast-in">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl shadow-slate-300/40 dark:shadow-black/60 overflow-hidden">
            {/* Progress bar tự thu hẹp trong 5s */}
            <div className="h-1 bg-indigo-500 animate-shrink-x" />
            <div
              className="flex gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors"
              onClick={openToastDetail}
            >
              <div className="shrink-0 mt-0.5 h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                  Thông báo mới
                </p>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug truncate">
                  {toast.notifications?.title}
                </p>
                {toast.notifications?.body && (
                  <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5 line-clamp-2 leading-snug">
                    {stripHtml(toast.notifications.body)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); dismissToast(); }}
                className="shrink-0 self-start p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification detail modal ──────────────────────────────────────── */}
      {detailItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-500/15 backdrop-blur-md"
            onClick={() => setDetailItem(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-up">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-snug pt-0.5">
                {detailItem.notifications?.title}
              </h2>
              <button
                onClick={() => setDetailItem(null)}
                className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {detailItem.notifications?.body ? (
                <div
                  className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed rich-content"
                  dangerouslySetInnerHTML={{ __html: detailItem.notifications.body }}
                />
              ) : (
                <p className="text-sm text-slate-400 dark:text-gray-500 italic">Không có nội dung chi tiết.</p>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-gray-800 bg-slate-50/80 dark:bg-gray-950/40 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-gray-500">
                {timeAgo(detailItem.notifications?.created_at)}
              </span>
              <Link
                href="/notifications"
                onClick={() => { setDetailItem(null); setIsOpen(false); }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Xem tất cả →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import SimpleRichEditor from '@/components/SimpleRichEditor';
import { supabase, withTimeout } from '@/lib/supabase';
import {
  Bell,
  BellOff,
  CheckCheck,
  Plus,
  X,
  Send,
  Users,
  Shield,
  User,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';

const IS_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
);

let _pageChannelSeq = 0;

const MOCK_NOTIF_LIST = [
  { id: 'pr1', is_read: false, notifications: { id: 'n1', title: 'Chào mừng đến với Projexa!', body: 'Hệ thống quản lý dự án nội bộ Projexa đã sẵn sàng phục vụ bạn. Liên hệ quản trị viên nếu cần hỗ trợ.', created_at: new Date().toISOString(), sender_profile: { full_name: 'Admin' } } },
  { id: 'pr2', is_read: false, notifications: { id: 'n2', title: 'Sprint 3 đã được khởi động', body: 'Sprint 3 của dự án CPLQG vừa được tạo và bắt đầu từ ngày 02/06/2026. Kiểm tra danh sách công việc được giao.', created_at: new Date(Date.now() - 3600000).toISOString(), sender_profile: { full_name: 'Nguyễn Văn A (Manager)' } } },
  { id: 'pr3', is_read: true, notifications: { id: 'n3', title: 'Cập nhật tính năng hệ thống', body: 'Phiên bản 1.2.0 đã được triển khai với nhiều cải tiến về giao diện, thống kê và phân quyền.', created_at: new Date(Date.now() - 86400000).toISOString(), sender_profile: { full_name: 'Admin' } } },
  { id: 'pr4', is_read: true, notifications: { id: 'n4', title: 'Nhắc nhở: Cập nhật nhật ký hàng ngày', body: null, created_at: new Date(Date.now() - 172800000).toISOString(), sender_profile: { full_name: 'Nguyễn Văn A (Manager)' } } },
];

const MOCK_ROLES_LIST = [
  { id: 'b2222222-2222-2222-2222-222222222222', name: 'Manager' },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'Developer' },
  { id: 'd4444444-4444-4444-4444-444444444444', name: 'Business Analyst' },
];

const MOCK_USERS_LIST = [
  { id: 'u1', full_name: 'Nguyễn Văn A', roles: { name: 'Manager' } },
  { id: 'u2', full_name: 'Trần Thị B', roles: { name: 'Developer' } },
  { id: 'u3', full_name: 'Lê Văn C', roles: { name: 'Developer' } },
  { id: 'u4', full_name: 'Phạm Thị D', roles: { name: 'Business Analyst' } },
];

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000)    return 'Vừa xong';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanBodyHtml(html) {
  if (!html) return null;
  return stripHtml(html) ? html : null;
}

export default function NotificationsPage() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('notifications', 'create');

  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [detailItem, setDetailItem]           = useState(null);

  // Create modal
  const [showModal, setShowModal]             = useState(false);
  const [modalKey, setModalKey]               = useState(0);
  const [createTitle, setCreateTitle]         = useState('');
  const [createBody, setCreateBody]           = useState('');
  const [targetType, setTargetType]           = useState('all');
  const [targetRoleId, setTargetRoleId]       = useState('');
  const [targetUserIds, setTargetUserIds]     = useState([]);
  const [rolesList, setRolesList]             = useState([]);
  const [usersList, setUsersList]             = useState([]);
  const [userSearch, setUserSearch]           = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [createError, setCreateError]         = useState('');
  const [createSuccess, setCreateSuccess]     = useState('');
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const unreadCount = items.filter(r => !r.is_read).length;

  // ── Fetch notifications ────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      if (!IS_CONFIGURED) {
        setItems(MOCK_NOTIF_LIST);
        setLoading(false);
        return;
      }
      const { data, error: err } = await withTimeout(
        supabase
          .from('notification_recipients')
          .select('id, is_read, notifications(id, title, body, created_at, profiles!sender_id(full_name))')
          .eq('recipient_id', user.id)
          .order('created_at', { referencedTable: 'notifications', ascending: false })
          .limit(50)
      );
      if (err) throw err;
      setItems(data || []);
    } catch {
      setError('Không thể tải danh sách thông báo. Vui lòng thử lại.');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime: refresh on new notification
  // Unique channel name per effect invocation prevents StrictMode double-subscribe error.
  useEffect(() => {
    if (!user || !IS_CONFIGURED) return;
    const name = `notif-page-${user.id}-${++_pageChannelSeq}`;
    const channel = supabase
      .channel(name)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_recipients',
        filter: `recipient_id=eq.${user.id}`,
      }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllRead = async () => {
    const ids = items.filter(r => !r.is_read).map(r => r.id);
    if (!ids.length) return;
    setItems(prev => prev.map(r => ({ ...r, is_read: true })));
    if (!IS_CONFIGURED) return;
    await withTimeout(
      supabase
        .from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', ids)
    ).catch(() => {});
  };

  const markOneRead = async (id) => {
    setItems(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
    if (!IS_CONFIGURED) return;
    await withTimeout(
      supabase
        .from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
    ).catch(() => {});
  };

  // ── Open detail ────────────────────────────────────────────────────────────
  const openDetail = (rec) => {
    setDetailItem(rec);
    if (!rec.is_read) markOneRead(rec.id);
  };

  // ── Open create modal + fetch roles/users ─────────────────────────────────
  const openCreateModal = async () => {
    setCreateTitle('');
    setCreateBody('');
    setTargetType('all');
    setTargetRoleId('');
    setTargetUserIds([]);
    setUserSearch('');
    setCreateError('');
    setCreateSuccess('');
    setModalKey(k => k + 1);
    setShowModal(true);

    if (!IS_CONFIGURED) {
      setRolesList(MOCK_ROLES_LIST);
      setUsersList(MOCK_USERS_LIST);
      return;
    }
    setLoadingRecipients(true);
    try {
      const [{ data: roles }, { data: profiles }] = await Promise.all([
        withTimeout(supabase.from('roles').select('id, name').order('name')),
        withTimeout(supabase.from('profiles').select('id, full_name, roles(name)').order('full_name')),
      ]);
      setRolesList((roles || []).filter(r => r.name !== 'Admin'));
      setUsersList(profiles || []);
    } catch {}
    setLoadingRecipients(false);
  };

  const toggleUser = (id) => {
    setTargetUserIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Submit create notification ─────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createTitle.trim()) { setCreateError('Vui lòng nhập tiêu đề thông báo.'); return; }
    if (targetType === 'role' && !targetRoleId) { setCreateError('Vui lòng chọn vai trò nhận thông báo.'); return; }
    if (targetType === 'user' && targetUserIds.length === 0) { setCreateError('Vui lòng chọn ít nhất một thành viên.'); return; }

    setSubmitting(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      if (!IS_CONFIGURED) {
        await new Promise(r => setTimeout(r, 600));
        setCreateSuccess('Thông báo mô phỏng đã được gửi thành công! (Chế độ Xem trước)');
        setSubmitting(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: createTitle.trim(),
          body: cleanBodyHtml(createBody),
          targetType,
          targetRoleId: targetType === 'role' ? targetRoleId : null,
          targetUserIds: targetType === 'user' ? targetUserIds : [],
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error || 'Không thể gửi thông báo.');
      } else {
        setCreateSuccess(json.message || 'Thông báo đã được gửi thành công!');
        fetchNotifications();
      }
    } catch {
      setCreateError('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.');
    }
    setSubmitting(false);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const filteredUsers = usersList.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Bell className="h-6 w-6 text-indigo-500" />
              Thông báo
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đọc tất cả
              </button>
            )}
            {canCreate && (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tạo thông báo
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm flex-1">{error}</span>
            <button onClick={fetchNotifications} className="flex items-center gap-1 text-xs font-semibold hover:underline">
              <RefreshCw className="h-3.5 w-3.5" /> Thử lại
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Đang tải thông báo...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-slate-400 dark:text-gray-500">
              <BellOff className="h-10 w-10 opacity-40" />
              <p className="text-sm font-medium">Chưa có thông báo nào</p>
            </div>
          ) : (
            items.map((rec) => {
              const notif = rec.notifications;
              const senderName = notif?.profiles?.full_name || notif?.sender_profile?.full_name || null;
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => openDetail(rec)}
                  className={`w-full text-left flex gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0 transition-colors cursor-pointer ${
                    !rec.is_read
                      ? 'bg-indigo-50/40 dark:bg-indigo-900/10 hover:bg-indigo-100/40 dark:hover:bg-indigo-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'
                  }`}
                >
                  {/* Unread dot */}
                  <div className="mt-2 shrink-0">
                    <div className={`h-2 w-2 rounded-full ${!rec.is_read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug ${!rec.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-gray-300'}`}>
                      {notif?.title}
                    </p>
                    {notif?.body && (
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                        {stripHtml(notif.body)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 dark:text-gray-500">
                        {timeAgo(notif?.created_at)}
                      </span>
                      {senderName && (
                        <>
                          <span className="text-slate-300 dark:text-gray-700">·</span>
                          <span className="text-[11px] text-slate-400 dark:text-gray-500">Từ: {senderName}</span>
                        </>
                      )}
                      {!rec.is_read && (
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-full">Mới</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Create Notification Modal ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10">
                  <Send className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Tạo thông báo mới</h2>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1">
              <form id="create-notif-form" onSubmit={handleCreate}>
                <div className="px-6 py-5 space-y-5">

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Tiêu đề <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createTitle}
                      onChange={e => setCreateTitle(e.target.value)}
                      placeholder="Nhập tiêu đề thông báo..."
                      maxLength={200}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Body — rich text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Nội dung <span className="text-slate-400 font-normal normal-case">(tùy chọn)</span>
                    </label>
                    <SimpleRichEditor
                      key={modalKey}
                      value={createBody}
                      onChange={setCreateBody}
                      placeholder="Nhập nội dung chi tiết thông báo..."
                      minHeight={110}
                    />
                  </div>

                  {/* Target type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Gửi đến
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'all',  label: 'Tất cả thành viên', icon: Users },
                        { value: 'role', label: 'Theo vai trò',       icon: Shield },
                        { value: 'user', label: 'Thành viên cụ thể', icon: User },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => { setTargetType(value); setTargetRoleId(''); setTargetUserIds([]); }}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            targetType === value
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-center leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role selector */}
                  {targetType === 'role' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Chọn vai trò <span className="text-rose-500">*</span>
                      </label>
                      {loadingRecipients ? (
                        <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                        </div>
                      ) : (
                        <select
                          value={targetRoleId}
                          onChange={e => setTargetRoleId(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          <option value="">-- Chọn vai trò --</option>
                          {rolesList.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* User selector */}
                  {targetType === 'user' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Chọn thành viên <span className="text-rose-500">*</span>
                        {targetUserIds.length > 0 && (
                          <span className="ml-1.5 font-normal normal-case text-indigo-600 dark:text-indigo-400">
                            ({targetUserIds.length} đã chọn)
                          </span>
                        )}
                      </label>
                      {loadingRecipients ? (
                        <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                        </div>
                      ) : (
                        <>
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Tìm kiếm thành viên..."
                              value={userSearch}
                              onChange={e => setUserSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                          </div>
                          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                            {filteredUsers.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-4">Không tìm thấy thành viên</p>
                            ) : (
                              filteredUsers.map(u => (
                                <label
                                  key={u.id}
                                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={targetUserIds.includes(u.id)}
                                    onChange={() => toggleUser(u.id)}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-800 dark:text-white truncate">{u.full_name}</p>
                                    {u.roles?.name && (
                                      <p className="text-[10px] text-slate-400 dark:text-gray-500">{u.roles.name}</p>
                                    )}
                                  </div>
                                </label>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Alerts */}
                  {createError && (
                    <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-600 dark:text-rose-400 text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{createError}</span>
                    </div>
                  )}
                  {createSuccess && (
                    <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-600 dark:text-emerald-400 text-xs">
                      <CheckCheck className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{createSuccess}</span>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {createSuccess ? 'Đóng' : 'Hủy'}
              </button>
              {!createSuccess && (
                <button
                  type="submit"
                  form="create-notif-form"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Gửi thông báo</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Notification detail modal ──────────────────────────────────── */}
      {detailItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-500/15 backdrop-blur-md"
            onClick={() => setDetailItem(null)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-bold text-slate-800 dark:text-white leading-snug pt-0.5">
                {detailItem.notifications?.title}
              </h2>
              <button
                onClick={() => setDetailItem(null)}
                className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
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

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/20 flex items-center justify-between text-xs text-slate-400 dark:text-gray-500">
              <span>{timeAgo(detailItem.notifications?.created_at)}</span>
              {(detailItem.notifications?.profiles?.full_name || detailItem.notifications?.sender_profile?.full_name) && (
                <span>Từ: {detailItem.notifications?.profiles?.full_name || detailItem.notifications?.sender_profile?.full_name}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

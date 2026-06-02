'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';
import {
  User, Mail, Shield, Calendar, Edit2, Check, X, Loader2,
  FolderKanban, ShieldAlert, RefreshCw, Camera,
} from 'lucide-react';
import { MOCK_PROJECTS } from '@/lib/mockData';

// Mock project_members
const MOCK_PROJECT_MEMBERS = [
  { project_id: MOCK_PROJECTS[0]?.id, project: MOCK_PROJECTS[0] },
  { project_id: MOCK_PROJECTS[1]?.id, project: MOCK_PROJECTS[1] },
];

export default function ProfilePage() {
  const { user, profile, role } = useAuth();

  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit full_name state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      setMyProjects(MOCK_PROJECT_MEMBERS.filter(m => m.project));
      setLoading(false);
      return;
    }
    fetchMyProjects();
  }, [user]);

  const fetchMyProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const { data, error: err } = await withTimeout(
        supabase
          .from('project_members')
          .select('project_id, projects(id, name, code, status)')
          .eq('user_id', user.id)
      );
      if (err) throw err;
      setMyProjects((data || []).map(m => ({ ...m, project: m.projects })));
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách dự án.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setEditName(profile?.full_name || '');
    setSaveError('');
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const handleSaveName = async () => {
    if (!editName.trim()) { setSaveError('Tên không được để trống.'); return; }
    if (editName.trim() === profile?.full_name) { setIsEditing(false); return; }
    setSaving(true);
    setSaveError('');
    try {
      if (!isSupabaseConfigured) {
        // Mock: just show success
        setSaveSuccess(true);
        setTimeout(() => { setSaveSuccess(false); setIsEditing(false); }, 1200);
        return;
      }
      const { error: err } = await withTimeout(
        supabase.from('profiles').update({ full_name: editName.trim() }).eq('id', user.id)
      );
      if (err) throw err;
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); setIsEditing(false); }, 1200);
    } catch (err) {
      setSaveError(err.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const statusBadge = (status) => {
    const map = {
      'Đang thực hiện': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
      'Hoàn thành':     'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      'Tạm dừng':       'bg-amber-500/10  text-amber-600  dark:text-amber-400  border border-amber-500/20',
      'Lên kế hoạch':   'bg-slate-500/10  text-slate-600  dark:text-slate-400  border border-slate-500/20',
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${map[status] || map['Lên kế hoạch']}`}>
        {status || 'Lên kế hoạch'}
      </span>
    );
  };

  const roleBadgeClass = () => {
    if (role?.name === 'Admin')    return 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20';
    if (role?.name === 'Manager')  return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-100 bg-clip-text text-transparent">
            Thông tin cá nhân
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Xem và chỉnh sửa thông tin tài khoản của bạn.
          </p>
        </div>

        {/* Profile card */}
        <div className="bg-white dark:bg-gray-950/60 border border-slate-200 dark:border-gray-900 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            {/* Avatar */}
            <div className="relative shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-24 w-24 rounded-2xl border-2 border-slate-200 dark:border-gray-800 object-cover shadow"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-extrabold text-3xl text-white shadow-lg shadow-indigo-500/20 select-none">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 w-full">

              {/* Full name row */}
              <div className="flex items-center gap-2 mb-1">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') cancelEdit(); }}
                      autoFocus
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-gray-900 border border-indigo-400 dark:border-indigo-500 rounded-xl text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-gray-900 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                      {profile?.full_name || user?.email || '—'}
                    </h2>
                    <button
                      onClick={startEdit}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer shrink-0"
                      title="Chỉnh sửa tên"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>

              {saveError && (
                <p className="text-xs text-rose-500 mb-1">{saveError}</p>
              )}
              {saveSuccess && (
                <p className="text-xs text-emerald-500 mb-1">Đã cập nhật thành công!</p>
              )}

              {/* Role badge */}
              <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wide ${roleBadgeClass()}`}>
                {role?.name || 'Developer'}
              </span>

              {/* Details grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user?.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Tham gia: {formatDate(user?.created_at)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Vai trò: {role?.name || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate text-[11px] font-mono text-slate-400">ID: {user?.id?.slice(0, 18)}…</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-indigo-500" />
              Dự án đang tham gia
            </h2>
            {isSupabaseConfigured && (
              <button
                onClick={fetchMyProjects}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                title="Tải lại"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs p-4 rounded-2xl flex items-center gap-2 mb-4">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
              <button onClick={fetchMyProjects} className="ml-auto underline cursor-pointer">Thử lại</button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : myProjects.length === 0 ? (
            <div className="bg-slate-50 dark:bg-gray-950/40 border border-slate-200 dark:border-gray-900 rounded-2xl p-8 text-center">
              <FolderKanban className="h-10 w-10 text-slate-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-500">Bạn chưa được tham gia dự án nào.</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Admin hoặc Manager có thể thêm bạn vào dự án.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myProjects.map((m) => {
                const proj = m.project;
                if (!proj) return null;
                return (
                  <div
                    key={m.project_id}
                    className="bg-white dark:bg-gray-950/60 border border-slate-200 dark:border-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <FolderKanban className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">{proj.code}</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{proj.name}</p>
                        </div>
                      </div>
                      {statusBadge(proj.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

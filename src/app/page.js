'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardList,
  Zap,
  Database,
  ArrowRight,
  Sparkles,
  X,
  Eye,
  User,
  Shield,
  FolderKanban,
  CalendarDays,
  FileText,
  Loader2,
  SlidersHorizontal,
  ChevronRight,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

const MOCK_STATS = {
  total: 12, todo: 4, in_progress: 3, review: 2, done: 3
};

const MOCK_MEMBERS = [
  { id: '1', full_name: 'Nguyễn Văn Admin' },
  { id: '2', full_name: 'Trần Thị Manager' },
  { id: '3', full_name: 'Phạm Minh Developer' },
  { id: '4', full_name: 'Lê Hoàng Coder' },
];

const MOCK_RECENT_TASKS = [
  { id: '1', code: 'DEMO-001', title: 'Thiết kế giao diện Dashboard hệ thống', status: 'in_progress', priority: 'high', due_date: '2026-06-05', assigned_to: '3', reported_to: '2', description: 'Tạo mockup và style CSS hoàn chỉnh cho trang Dashboard của hệ thống.' },
  { id: '2', code: 'DEMO-002', title: 'Cấu hình Supabase Database & RLS policies', status: 'done', priority: 'high', due_date: '2026-06-01', assigned_to: '1', reported_to: '2', description: 'Thiết lập các bảng, cấu hình RLS và seed dữ liệu phân quyền ban đầu.' },
  { id: '3', code: 'DEMO-003', title: 'Viết tài liệu hướng dẫn bàn giao mã nguồn', status: 'todo', priority: 'low', due_date: '2026-06-10', assigned_to: '4', reported_to: '2', description: 'Tạo file README chi tiết hướng dẫn chạy và cấu hình các biến môi trường.' },
  { id: '4', code: 'DEMO-004', title: 'Tối ưu hóa các API Routes tạo tài khoản', status: 'review', priority: 'medium', due_date: '2026-06-03', assigned_to: '3', reported_to: '1', description: 'Viết API POST /api/admin/create-user để admin tạo tài khoản qua service role key.' },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, role, permissions } = useAuth();

  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [stats, setStats] = useState(MOCK_STATS);
  const [recentTasks, setRecentTasks] = useState(MOCK_RECENT_TASKS);
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [projects, setProjects] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [error, setError] = useState('');

  // Task detail popup
  const [viewTask, setViewTask] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [taskRelatedLogs, setTaskRelatedLogs] = useState([]);
  const [taskRelatedLogsLoading, setTaskRelatedLogsLoading] = useState(false);

  // Log summary popup
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [viewLog, setViewLog] = useState(null);
  const [logApproving, setLogApproving] = useState(false);

  const isAdmin = role?.name === 'Admin';
  const isManagerOrAdmin = isAdmin || role?.name === 'Manager';

  const fetchDashboardData = async () => {
    try {
      setLoadingDb(true);
      setError('');

      const [profilesRes, tasksRes, projectsRes] = await Promise.all([
        withTimeout(supabase.from('profiles').select('id, full_name')),
        withTimeout(supabase.from('tasks').select('*').order('created_at', { ascending: false })),
        withTimeout(supabase.from('projects').select('id, code, name')),
      ]);

      if (!profilesRes.error && profilesRes.data) setMembers(profilesRes.data);
      if (!projectsRes.error && projectsRes.data) setProjects(projectsRes.data);

      if (!tasksRes.error && tasksRes.data) {
        const tasks = tasksRes.data;
        setStats({
          total: tasks.length,
          todo: tasks.filter(t => t.status === 'todo').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          review: tasks.filter(t => t.status === 'review').length,
          done: tasks.filter(t => t.status === 'done').length,
        });
        setRecentTasks(tasks.slice(0, 5));
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Dashboard:', err);
      setError(err.message || 'Không thể đồng bộ dữ liệu Dashboard. Vui lòng bấm thử lại.');
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      setLoadingDb(false);
      return;
    }

    fetchDashboardData();
  }, []);

  const handleOpenTaskView = async (task) => {
    setViewTask(task);
    setTaskRelatedLogs([]);
    setIsViewModalOpen(true);

    if (!isSupabaseConfigured || !user) return;

    setTaskRelatedLogsLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('daily_logs')
          .select('id, log_date, title, content, is_approved, approved_at, profiles:approved_by(full_name)')
          .eq('task_id', task.id)
          .eq('user_id', user.id)
          .order('log_date', { ascending: false })
      );
      if (!error && data) setTaskRelatedLogs(data.map(d => ({ ...d, approved_by_name: d.profiles?.full_name || null })));
    } catch (err) {
      console.error('Lỗi tải nhật ký:', err);
    } finally {
      setTaskRelatedLogsLoading(false);
    }
  };

  const navigateToLog = (logDate) => {
    localStorage.setItem('aerotask_goto_log_date', logDate);
    router.push('/daily-logs');
  };

  const handleOpenLogModal = (log) => {
    setViewLog(log);
    setIsLogModalOpen(true);
  };

  const handleApproveLog = async () => {
    if (!viewLog) return;
    setLogApproving(true);
    const approvedData = {
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by_name: profile?.full_name || 'Quản lý',
    };
    try {
      if (isSupabaseConfigured) {
        const { error } = await withTimeout(
          supabase.from('daily_logs').update({
            is_approved: true,
            approved_by: user?.id || null,
            approved_at: approvedData.approved_at,
          }).eq('id', viewLog.id)
        );
        if (error) throw error;
      }
      const updated = { ...viewLog, ...approvedData };
      setViewLog(updated);
      setTaskRelatedLogs(prev => prev.map(l => l.id === viewLog.id ? updated : l));
    } catch (err) {
      alert('Không thể phê duyệt: ' + err.message);
    } finally {
      setLogApproving(false);
    }
  };

  const getMemberName = (id) => members.find(m => m.id === id)?.full_name || '—';

  const getStatusStyle = (status) => {
    switch (status) {
      case 'todo':        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
      case 'in_progress': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'review':      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'done':        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default:            return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'todo':        return 'Chờ làm';
      case 'in_progress': return 'Đang làm';
      case 'review':      return 'Chờ duyệt';
      case 'done':        return 'Hoàn thành';
      default:            return status;
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':   return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
      case 'medium': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
      case 'low':    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
      default:       return 'bg-slate-500/15 text-slate-500 dark:text-slate-400';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Supabase Missing Configuration Banner */}
        {!isSupabaseConfigured && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30">
                <Database className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  Chế độ xem trước (Preview Mode) đang bật
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-amber-400/90 leading-relaxed max-w-3xl">
                  Bạn chưa cấu hình biến môi trường kết nối Supabase trong file <code className="bg-slate-100 dark:bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-300 dark:border-amber-500/20 text-xs font-mono text-slate-800 dark:text-amber-400">.env.local</code>.
                  Hệ thống đang hiển thị **dữ liệu mô phỏng đẹp mắt** để bạn trải nghiệm giao diện và các tính năng tương tác.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    Bước 1: Chạy file <code className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">supabase_schema.sql</code> trên Supabase SQL Editor
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    Bước 2: Điền các Key vào <code className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">.env.local</code> và khởi động lại
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error alert with retry option */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in select-none">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              Thử tải lại ngay
            </button>
          </div>
        )}

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 p-6 rounded-3xl shadow-sm dark:shadow-none relative overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                Tổng quan công việc
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Xin chào, {profile?.full_name || 'Thành viên'}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Hôm nay là một ngày tuyệt vời để hoàn thành mục tiêu. Dưới đây là tiến độ tổng quan của nhóm.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-inner">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Vai trò</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">{role?.name || 'Developer'}</span>
            </div>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: 'Tổng công việc', value: stats.total, icon: ClipboardList, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
            { title: 'Chờ thực hiện', value: stats.todo, icon: Clock, color: 'text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20' },
            { title: 'Đang triển khai', value: stats.in_progress, icon: Zap, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20 animate-pulse-subtle' },
            { title: 'Đang chờ duyệt', value: stats.review, icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { title: 'Đã hoàn thành', value: stats.done, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-700 shadow-sm transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors uppercase tracking-wider">{stat.title}</span>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${stat.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{stat.value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent tasks */}
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-850 p-6 lg:col-span-2 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Công việc tiêu biểu</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Nhấn vào từng công việc để xem chi tiết</p>
              </div>
              <Link href="/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold flex items-center gap-1 group transition-colors cursor-pointer">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {recentTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleOpenTaskView(task)}
                  className="w-full text-left py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-100/40 dark:hover:bg-slate-900/20 px-2 rounded-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      task.status === 'done' ? 'bg-emerald-500' :
                      task.status === 'in_progress' ? 'bg-indigo-500' :
                      task.status === 'review' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate hover:text-indigo-600 dark:hover:text-white transition-colors">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getStatusStyle(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                        {task.code && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-semibold">{task.code}</span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          Hạn: {task.due_date || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${getPriorityStyle(task.priority)}`}>
                    {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Vừa' : 'Thấp'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick permissions card */}
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-850 p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Quyền Hạn Của Bạn</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Kiểm tra chi tiết các thao tác bạn được phép thực hiện</p>
              </div>

              <div className="space-y-3.5">
                {[
                  { name: 'Quản lý Công việc (Tasks)', key: 'tasks' },
                  { name: 'Quản lý Thành viên (Users)', key: 'users' },
                  { name: 'Quản lý Phân quyền (Roles)', key: 'roles' },
                ].map((item, idx) => {
                  const perms = permissions?.[item.key] || { view: false, create: false, update: false, delete: false };
                  const displayPerms = !isSupabaseConfigured
                    ? role?.name === 'Admin'
                      ? { view: true, create: true, update: true, delete: true }
                      : role?.name === 'Manager'
                        ? { view: true, create: true, update: true, delete: true, ...(item.key === 'users' ? { create: false, update: false, delete: false } : item.key === 'roles' ? { view: false, create: false, update: false, delete: false } : {}) }
                        : { view: true, create: false, update: item.key === 'tasks', delete: false, ...(item.key === 'roles' ? { view: false } : {}) }
                    : perms;

                  return (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">{item.name}</span>
                      <div className="flex gap-2">
                        {[
                          { label: 'Xem', val: displayPerms.view },
                          { label: 'Thêm', val: displayPerms.create },
                          { label: 'Sửa', val: displayPerms.update },
                          { label: 'Xóa', val: displayPerms.delete },
                        ].map((act, aIdx) => (
                          <span
                            key={aIdx}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${act.val
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                              : 'bg-slate-100 dark:bg-slate-950/60 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-900/60'
                            }`}
                          >
                            {act.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal block">
                Nếu cần thay đổi quyền hạn này, vui lòng yêu cầu tài khoản **Admin** cập nhật trong thẻ "Phân quyền".
              </span>
            </div>
          </div>
        </div>

        {/* Task Detail Modal */}
        {isViewModalOpen && viewTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsViewModalOpen(false)} />
            <div className="relative z-10 w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">

              {/* Header */}
              <div className="flex items-start gap-3 p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Eye className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {viewTask.code && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {viewTask.code}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">{viewTask.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {(() => {
                      const col = {
                        todo: ['Cần làm', 'bg-slate-500/10 text-slate-500 border-slate-500/20'],
                        in_progress: ['Đang làm', 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'],
                        review: ['Chờ duyệt', 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'],
                        done: ['Đã xong', 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'],
                      }[viewTask.status] || ['—', ''];
                      return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${col[1]}`}>{col[0]}</span>;
                    })()}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                      viewTask.priority === 'high' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                      viewTask.priority === 'medium' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                      {viewTask.priority === 'high' ? 'Ưu tiên Cao' : viewTask.priority === 'medium' ? 'Ưu tiên Vừa' : 'Ưu tiên Thấp'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href="/tasks"
                    className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                    title="Tới trang Công việc"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Link>
                  <button onClick={() => setIsViewModalOpen(false)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-5">
                {/* Description */}
                {viewTask.description && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mô tả</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{viewTask.description}</p>
                  </div>
                )}

                {/* Meta info */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <User className="h-3 w-3" /> Người được giao
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold uppercase shrink-0 text-indigo-600 dark:text-indigo-400">
                        {getMemberName(viewTask.assigned_to)?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{getMemberName(viewTask.assigned_to)}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Người được báo cáo
                    </p>
                    <div className="flex items-center gap-2">
                      {viewTask.reported_to ? (
                        <>
                          <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold uppercase shrink-0 text-amber-600 dark:text-amber-400">
                            {getMemberName(viewTask.reported_to)?.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{getMemberName(viewTask.reported_to)}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Chưa chọn</span>
                      )}
                    </div>
                  </div>

                  {viewTask.due_date && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Hạn hoàn thành
                      </p>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {new Date(viewTask.due_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                  )}

                  {viewTask.project_id && (() => {
                    const proj = projects.find(p => p.id === viewTask.project_id);
                    return proj ? (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <FolderKanban className="h-3 w-3" /> Dự án
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/15">{proj.code}</span>
                          {proj.name}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Related daily logs */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Nhật ký của bạn liên quan đến công việc này
                  </p>
                  {taskRelatedLogsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                    </div>
                  ) : !isSupabaseConfigured ? (
                    <p className="text-xs text-slate-400 italic py-2">Tính năng này yêu cầu kết nối Supabase.</p>
                  ) : taskRelatedLogs.length === 0 ? (
                    <div className="py-6 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <FileText className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Chưa có nhật ký nào được gắn với công việc này.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {taskRelatedLogs.map(log => (
                        <button
                          key={log.id}
                          type="button"
                          onClick={() => handleOpenLogModal(log)}
                          className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              {new Date(log.log_date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {log.is_approved ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">Đã duyệt</span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">Chờ duyệt</span>
                              )}
                              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">Xem tóm tắt →</span>
                            </div>
                          </div>
                          {log.title && <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">{log.title}</p>}
                          {log.content && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed"
                               dangerouslySetInnerHTML={{ __html: log.content.replace(/<[^>]+>/g, ' ').trim() }} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Modal: Tóm tắt nhật ký */}
      {isLogModalOpen && viewLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsLogModalOpen(false)} />
          <div className="relative z-10 w-full max-w-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-up">

            {/* Header */}
            <div className="flex items-start gap-3 p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {new Date(viewLog.log_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  {viewLog.is_approved ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">✓ Đã duyệt</span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">Chờ phê duyệt</span>
                  )}
                </div>
                {viewLog.title && <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{viewLog.title}</h3>}
              </div>
              <button onClick={() => setIsLogModalOpen(false)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Approval info */}
            <div className="px-5 pt-4 shrink-0">
              {viewLog.is_approved ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Đã được phê duyệt bởi <strong>{viewLog.approved_by_name || '—'}</strong>
                    {viewLog.approved_at && ` vào ${new Date(viewLog.approved_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Nhật ký này chưa được phê duyệt.</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {viewLog.content ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: viewLog.content }}
                />
              ) : (
                <p className="text-sm text-slate-400 italic">Không có nội dung.</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-5 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                {isManagerOrAdmin && !viewLog.is_approved && (
                  <button
                    onClick={handleApproveLog}
                    disabled={logApproving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {logApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                    Phê duyệt nhật ký
                  </button>
                )}
              </div>
              <button
                onClick={() => { setIsLogModalOpen(false); navigateToLog(viewLog.log_date); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                Xem chi tiết nhật ký
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </DashboardLayout>
  );
}

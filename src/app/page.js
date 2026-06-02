'use client';

import { useEffect, useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

// Dữ liệu mock phục vụ chế độ xem trước (khi chưa cấu hình Supabase keys)
const MOCK_STATS = {
  total: 12,
  todo: 4,
  in_progress: 3,
  review: 2,
  done: 3
};

const MOCK_RECENT_TASKS = [
  { id: '1', title: 'Thiết kế giao diện Dashboard hệ thống', status: 'in_progress', priority: 'high', due_date: '2026-06-05' },
  { id: '2', title: 'Cấu hình Supabase Database & RLS policies', status: 'done', priority: 'high', due_date: '2026-06-01' },
  { id: '3', title: 'Viết tài liệu hướng dẫn bàn giao mã nguồn', status: 'todo', priority: 'low', due_date: '2026-06-10' },
  { id: '4', title: 'Tối ưu hóa các API Routes tạo tài khoản', status: 'review', priority: 'medium', due_date: '2026-06-03' },
];

export default function Dashboard() {
  const { profile, role, permissions } = useAuth();
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [stats, setStats] = useState(MOCK_STATS);
  const [recentTasks, setRecentTasks] = useState(MOCK_RECENT_TASKS);
  const [loadingDb, setLoadingDb] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Kiểm tra xem Supabase đã được cấu hình các biến môi trường chưa
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      setLoadingDb(false);
      return;
    }

    // Nếu đã cấu hình, thử tải dữ liệu thực tế từ Supabase
    const fetchDashboardData = async () => {
      try {
        setLoadingDb(true);
        setError('');
        // 1. Tải danh sách công việc
        const { data: tasks, error: tasksError } = await withTimeout(
          supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false })
        );

        if (!tasksError && tasks) {
          const newStats = {
            total: tasks.length,
            todo: tasks.filter(t => t.status === 'todo').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            review: tasks.filter(t => t.status === 'review').length,
            done: tasks.filter(t => t.status === 'done').length,
          };
          setStats(newStats);
          setRecentTasks(tasks.slice(0, 5));
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu thực tế Supabase:', err);
        setError(err.message || 'Không thể đồng bộ dữ liệu Dashboard thực tế. Vui lòng bấm thử lại.');
      } finally {
        setLoadingDb(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'todo': return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
      case 'in_progress': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'review': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'done': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'todo': return 'Chờ làm';
      case 'in_progress': return 'Đang làm';
      case 'review': return 'Chờ duyệt';
      case 'done': return 'Hoàn thành';
      default: return status;
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
      case 'medium': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
      case 'low': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
      default: return 'bg-slate-500/15 text-slate-500 dark:text-slate-400';
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
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Dashboard Overview
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
          {/* Recent Activity / Assigned tasks */}
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-850 p-6 lg:col-span-2 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Công việc tiêu biểu</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Danh sách các đầu mục công việc mới cập nhật trên hệ thống</p>
              </div>
              <Link href="/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold flex items-center gap-1 group transition-colors cursor-pointer">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {recentTasks.map((task) => (
                <div key={task.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-100/40 dark:hover:bg-slate-900/20 px-2 rounded-xl transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-indigo-500' : task.status === 'review' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate hover:text-indigo-600 dark:hover:text-white transition-colors">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getStatusStyle(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          Hạn chót: {task.due_date || 'Không có'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${getPriorityStyle(task.priority)}`}>
                    {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Vừa' : 'Thấp'}
                  </span>
                </div>
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
                  // Nếu chưa cấu hình Supabase, gán quyền mặc định dựa trên role để demo đẹp
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

      </div>
    </DashboardLayout>
  );
}

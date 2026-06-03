'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, withTimeout } from '@/lib/supabase';
import {
  BarChart2, Trophy, Medal, Award, AlertCircle, CheckCircle,
  Clock, TrendingUp, Users, Calendar, RefreshCw, Loader2,
  ShieldAlert, Target, Activity, X, User, CalendarDays,
  FolderKanban, ChevronRight, FileText, History, Info,
} from 'lucide-react';

// ─── Preview-mode mock data ────────────────────────────────────────────────────

const _MOCK_MEMBERS = [
  { id: 'm1', full_name: 'Nguyễn Văn Admin' },
  { id: 'm2', full_name: 'Trần Thị Manager' },
  { id: 'm3', full_name: 'Phạm Minh Developer' },
  { id: 'm4', full_name: 'Lê Hoàng Coder' },
];

const _MOCK_TASKS = [
  { id: 't1',  code: 'DEMO-001', title: 'Thiết kế giao diện Dashboard',       description: 'Tạo mockup và style CSS hoàn chỉnh cho Dashboard.',                 status: 'done',        priority: 'high',   due_date: '2026-05-20', assigned_to: 'm1' },
  { id: 't2',  code: 'DEMO-002', title: 'Cấu hình cơ sở dữ liệu Supabase',   description: 'Thiết lập bảng, RLS và seed dữ liệu phân quyền ban đầu.',          status: 'done',        priority: 'medium', due_date: '2026-05-28', assigned_to: 'm1' },
  { id: 't3',  code: 'DEMO-003', title: 'Tích hợp xác thực người dùng',       description: 'Kết nối NextAuth với Supabase Auth và middleware bảo vệ route.',    status: 'in_progress', priority: 'high',   due_date: '2026-06-10', assigned_to: 'm1' },
  { id: 't4',  code: 'DEMO-004', title: 'Viết API quản lý công việc',          description: 'REST API CRUD cho module Tasks với phân quyền RBAC.',              status: 'done',        priority: 'high',   due_date: '2026-05-25', assigned_to: 'm2' },
  { id: 't5',  code: 'DEMO-005', title: 'Kiểm thử phân quyền RBAC',           description: 'Viết test cases cho ma trận quyền hạn toàn hệ thống.',             status: 'review',      priority: 'medium', due_date: '2026-05-30', assigned_to: 'm2' },
  { id: 't6',  code: 'DEMO-006', title: 'Cập nhật tài liệu hướng dẫn',        description: 'Viết README, DEVELOPMENT_GUIDE và API documentation.',             status: 'todo',        priority: 'low',    due_date: '2026-05-27', assigned_to: 'm2' },
  { id: 't7',  code: 'DEMO-007', title: 'Xây dựng Kanban Board',              description: 'Drag-and-drop task cards theo 4 cột trạng thái.',                   status: 'done',        priority: 'high',   due_date: '2026-05-22', assigned_to: 'm3' },
  { id: 't8',  code: 'DEMO-008', title: 'Phát triển module Nhật ký hàng ngày', description: 'CRUD nhật ký với rich-text editor và phê duyệt.',                  status: 'in_progress', priority: 'high',   due_date: '2026-05-31', assigned_to: 'm3' },
  { id: 't9',  code: 'DEMO-009', title: 'Tối ưu hiệu năng truy vấn DB',       description: 'Thêm index và refactor các query N+1 phức tạp.',                   status: 'in_progress', priority: 'medium', due_date: '2026-06-08', assigned_to: 'm3' },
  { id: 't10', code: 'DEMO-010', title: 'Triển khai CI/CD Pipeline',           description: 'Cấu hình GitHub Actions tự động chạy build và deploy lên Vercel.', status: 'review',      priority: 'high',   due_date: '2026-06-05', assigned_to: 'm3' },
  { id: 't11', code: 'DEMO-011', title: 'Phân tích yêu cầu Use Case mới',     description: 'Thu thập và tài liệu hóa các UC từ stakeholder.',                  status: 'todo',        priority: 'medium', due_date: '2026-06-15', assigned_to: 'm4' },
  { id: 't12', code: 'DEMO-012', title: 'Sửa lỗi hiển thị trên mobile',       description: 'Fix responsive layout cho màn hình nhỏ hơn 375px.',                status: 'todo',        priority: 'low',    due_date: '2026-05-29', assigned_to: 'm4' },
];

const _MOCK_EXTENSIONS = [
  { id: 'e1', task_id: 't5',  changes: 'Hạn hoàn thành: 2026-05-25 → 2026-05-30', changed_at: '2026-05-24T10:00:00Z' },
  { id: 'e2', task_id: 't6',  changes: 'Hạn hoàn thành: 2026-05-20 → 2026-05-27', changed_at: '2026-05-19T14:00:00Z' },
  { id: 'e3', task_id: 't8',  changes: 'Hạn hoàn thành: 2026-05-28 → 2026-05-31', changed_at: '2026-05-27T09:00:00Z' },
  { id: 'e4', task_id: 't8',  changes: 'Hạn hoàn thành: 2026-05-31 → 2026-06-02', changed_at: '2026-05-30T16:00:00Z' },
  { id: 'e5', task_id: 't12', changes: 'Hạn hoàn thành: 2026-05-25 → 2026-05-29', changed_at: '2026-05-24T11:00:00Z' },
];

const _MOCK_TASK_HISTORY = [
  { id: 'h1',  task_id: 't1',  changed_by: 'Nguyễn Văn Admin',   changed_at: '2026-05-10T08:00:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h2',  task_id: 't1',  changed_by: 'Trần Thị Manager',   changed_at: '2026-05-15T09:30:00Z', action: 'update', changes: 'Trạng thái: Cần làm → Đang làm' },
  { id: 'h3',  task_id: 't1',  changed_by: 'Nguyễn Văn Admin',   changed_at: '2026-05-20T14:00:00Z', action: 'update', changes: 'Trạng thái: Đang làm → Đã xong' },
  { id: 'h4',  task_id: 't4',  changed_by: 'Trần Thị Manager',   changed_at: '2026-05-10T10:00:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h5',  task_id: 't4',  changed_by: 'Trần Thị Manager',   changed_at: '2026-05-25T16:00:00Z', action: 'update', changes: 'Trạng thái: Chờ duyệt → Đã xong' },
  { id: 'h6',  task_id: 't7',  changed_by: 'Nguyễn Văn Admin',   changed_at: '2026-05-12T08:00:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h7',  task_id: 't7',  changed_by: 'Phạm Minh Developer', changed_at: '2026-05-18T11:00:00Z', action: 'update', changes: 'Trạng thái: Cần làm → Đang làm; Độ ưu tiên: Vừa → Cao' },
  { id: 'h8',  task_id: 't7',  changed_by: 'Trần Thị Manager',   changed_at: '2026-05-22T15:00:00Z', action: 'update', changes: 'Trạng thái: Chờ duyệt → Đã xong' },
  { id: 'h9',  task_id: 't8',  changed_by: 'Nguyễn Văn Admin',   changed_at: '2026-05-14T09:00:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h10', task_id: 't8',  changed_by: 'Phạm Minh Developer', changed_at: '2026-05-27T10:00:00Z', action: 'update', changes: 'Hạn hoàn thành: 2026-05-28 → 2026-05-31' },
  { id: 'h11', task_id: 't8',  changed_by: 'Phạm Minh Developer', changed_at: '2026-05-30T14:00:00Z', action: 'update', changes: 'Hạn hoàn thành: 2026-05-31 → 2026-06-02' },
  { id: 'h12', task_id: 't12', changed_by: 'Trần Thị Manager',   changed_at: '2026-05-20T08:30:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h13', task_id: 't12', changed_by: 'Trần Thị Manager',   changed_at: '2026-05-24T09:00:00Z', action: 'update', changes: 'Hạn hoàn thành: 2026-05-25 → 2026-05-29' },
];

const _MOCK_DETAIL_LOGS = [
  { id: 'dl1', task_id: 't1',  author_name: 'Nguyễn Văn Admin',    log_date: '2026-05-15', title: 'Thiết kế layout Dashboard cơ bản',   is_approved: true  },
  { id: 'dl2', task_id: 't1',  author_name: 'Nguyễn Văn Admin',    log_date: '2026-05-19', title: 'Hoàn thiện responsive và dark mode',  is_approved: true  },
  { id: 'dl3', task_id: 't4',  author_name: 'Trần Thị Manager',    log_date: '2026-05-18', title: 'Viết API CRUD Tasks + middleware',     is_approved: true  },
  { id: 'dl4', task_id: 't7',  author_name: 'Phạm Minh Developer', log_date: '2026-05-16', title: 'Khởi tạo cấu trúc Kanban Board',      is_approved: true  },
  { id: 'dl5', task_id: 't7',  author_name: 'Phạm Minh Developer', log_date: '2026-05-20', title: 'Thêm nút chuyển trạng thái task',     is_approved: false },
  { id: 'dl6', task_id: 't8',  author_name: 'Phạm Minh Developer', log_date: '2026-05-28', title: 'Xây dựng rich-text editor nhật ký',   is_approved: true  },
  { id: 'dl7', task_id: 't8',  author_name: 'Phạm Minh Developer', log_date: '2026-06-01', title: 'Thêm tính năng phê duyệt nhật ký',    is_approved: false },
  { id: 'dl8', task_id: 't12', author_name: 'Lê Hoàng Coder',      log_date: '2026-05-27', title: 'Phân tích lỗi responsive mobile',     is_approved: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeScore({ total, done, overdue, extensions }) {
  if (total === 0) return null;
  const completionPts = (done / total) * 50;
  const timelinessPts = Math.max(0, 30 - overdue * 10);
  const extensionPts  = Math.max(0, 20 - extensions * 4);
  return Math.min(100, Math.round(completionPts + timelinessPts + extensionPts));
}

function scoreBadge(score) {
  if (score === null) return { label: 'Chưa có dữ liệu', cls: 'bg-slate-100 dark:bg-slate-900 text-slate-400' };
  if (score >= 85) return { label: 'Xuất sắc',      cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' };
  if (score >= 70) return { label: 'Tốt',            cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'   };
  if (score >= 55) return { label: 'Khá',            cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'               };
  if (score >= 40) return { label: 'Trung bình',     cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'       };
  return                   { label: 'Cần cải thiện', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'           };
}

function scoreBarColor(score) {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-indigo-500';
  if (score >= 55) return 'bg-sky-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

function pct(n, d) { return d === 0 ? 0 : Math.round((n / d) * 100); }

function extractDates(changes) {
  const segment = changes.split(';').find(s => s.includes('Hạn hoàn thành')) || '';
  const m = segment.match(/Hạn hoàn thành:\s*(\S+)\s*→\s*(\S+)/);
  return m ? { from: m[1], to: m[2] } : null;
}

const STATUS_META = {
  todo:        { label: 'Cần làm',   cls: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  in_progress: { label: 'Đang làm',  cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  review:      { label: 'Chờ duyệt', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  done:        { label: 'Đã xong',   cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
};

const PRIORITY_META = {
  high:   { label: 'Cao',  cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/10' },
  medium: { label: 'Vừa',  cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/10' },
  low:    { label: 'Thấp', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/10' },
};

function computeScoreDetail({ total, done, overdue, extensions }) {
  if (total === 0) return null;
  const completionPts = Math.round((done / total) * 50 * 10) / 10;
  const timelinessPts = Math.max(0, 30 - overdue * 10);
  const extensionPts  = Math.max(0, 20 - extensions * 4);
  return { completionPts, timelinessPts, extensionPts };
}

function Tooltip({ text, children }) {
  return (
    <span className="relative group/tip inline-flex items-center gap-0.5 cursor-help">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-2.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-[10px] leading-snug pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 shadow-xl z-[60] text-left whitespace-normal">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
      </span>
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const { user, role } = useAuth();
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [tasks, setTasks]           = useState([]);
  const [members, setMembers]       = useState([]);
  const [extensions, setExtensions] = useState([]);

  // Task list popup state
  const [taskListModal, setTaskListModal] = useState(null); // { title, accentColor, tasks[] }
  // Member performance detail popup
  const [memberDetailModal, setMemberDetailModal] = useState(null); // memberStats entry
  const [memberDetailTab,   setMemberDetailTab]   = useState('done');
  // Task detail popup state
  const [detailTask,            setDetailTask]            = useState(null);
  const [detailHistory,         setDetailHistory]         = useState([]);
  const [detailHistoryLoading,  setDetailHistoryLoading]  = useState(false);
  const [detailLogs,            setDetailLogs]            = useState([]);
  const [detailLogsLoading,     setDetailLogsLoading]     = useState(false);

  const isAdmin          = role?.name === 'Admin';
  const isManagerOrAdmin = isAdmin || role?.name === 'Manager';

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { data: mData, error: mErr } = await withTimeout(
        supabase.from('profiles').select('id, full_name')
      );
      if (mErr) throw mErr;

      let taskQuery = supabase.from('tasks')
        .select('id, code, title, description, status, priority, due_date, assigned_to');
      if (!isManagerOrAdmin) taskQuery = taskQuery.eq('assigned_to', user.id);
      const { data: tData, error: tErr } = await withTimeout(taskQuery);
      if (tErr) throw tErr;

      const { data: hData } = await withTimeout(
        supabase.from('task_history')
          .select('id, task_id, changes, changed_at')
          .ilike('changes', '%Hạn hoàn thành%')
          .order('changed_at', { ascending: false })
          .limit(300)
      );

      setMembers(mData || []);
      setTasks(tData || []);
      setExtensions(hData || []);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      setMembers(_MOCK_MEMBERS);
      setTasks(_MOCK_TASKS);
      setExtensions(_MOCK_EXTENSIONS);
      setLoading(false);
      return;
    }
    fetchData();
  }, [user, role]);

  // ── Computed stats ─────────────────────────────────────────────────────────

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const totalStats = useMemo(() => {
    const total   = tasks.length;
    const done    = tasks.filter(t => t.status === 'done').length;
    const ip      = tasks.filter(t => t.status === 'in_progress').length;
    const review  = tasks.filter(t => t.status === 'review').length;
    const todo    = tasks.filter(t => t.status === 'todo').length;
    const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < today).length;
    const high    = tasks.filter(t => t.priority === 'high').length;
    const medium  = tasks.filter(t => t.priority === 'medium').length;
    const low     = tasks.filter(t => t.priority === 'low').length;
    return { total, done, inProgress: ip, review, todo, overdue, high, medium, low };
  }, [tasks, today]);

  const memberStats = useMemo(() => {
    const list = isManagerOrAdmin ? members : members.filter(m => m.id === user?.id);
    return list.map(member => {
      const mt         = tasks.filter(t => t.assigned_to === member.id);
      const total      = mt.length;
      const done       = mt.filter(t => t.status === 'done').length;
      const inProgress = mt.filter(t => t.status === 'in_progress').length;
      const review     = mt.filter(t => t.status === 'review').length;
      const todo       = mt.filter(t => t.status === 'todo').length;
      const overdue    = mt.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < today).length;
      const ext        = extensions.filter(h => mt.some(t => t.id === h.task_id)).length;
      const score      = computeScore({ total, done, overdue, extensions: ext });
      return { member, total, done, inProgress, review, todo, overdue, extensions: ext, score };
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [members, tasks, extensions, isManagerOrAdmin, user?.id, today]);

  // ── Helpers for opening popups ─────────────────────────────────────────────

  const openDoneList = () => {
    const doneTasks = tasks.filter(t => t.status === 'done');
    setTaskListModal({ title: 'Công việc đã hoàn thành', accentColor: 'emerald', tasks: doneTasks });
    setDetailTask(null);
  };

  const openOverdueList = () => {
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < today);
    setTaskListModal({ title: 'Công việc đang quá hạn', accentColor: 'rose', tasks: overdueTasks });
    setDetailTask(null);
  };

  const openTotalList = () => {
    setTaskListModal({ title: 'Tất cả công việc', accentColor: 'slate', tasks });
    setDetailTask(null);
  };

  const openInProgressList = () => {
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'review');
    setTaskListModal({ title: 'Công việc đang thực hiện', accentColor: 'indigo', tasks: inProgressTasks });
    setDetailTask(null);
  };

  const closeListModal = () => { setTaskListModal(null); setDetailTask(null); };

  const openDetail = async (task) => {
    setDetailTask(task);
    setDetailHistory([]);
    setDetailLogs([]);

    if (!isSupabaseConfigured) {
      setDetailHistory(_MOCK_TASK_HISTORY.filter(h => h.task_id === task.id));
      setDetailLogs(_MOCK_DETAIL_LOGS.filter(l => l.task_id === task.id));
      return;
    }

    setDetailHistoryLoading(true);
    setDetailLogsLoading(true);
    try {
      const [histRes, logsRes] = await Promise.all([
        withTimeout(
          supabase.from('task_history')
            .select('id, changed_at, action, changes, profiles:changed_by_id(full_name)')
            .eq('task_id', task.id)
            .order('changed_at', { ascending: false })
        ),
        withTimeout(
          supabase.from('daily_logs')
            .select('id, log_date, title, is_approved, profiles:user_id(full_name)')
            .eq('task_id', task.id)
            .order('log_date', { ascending: false })
        ),
      ]);
      if (!histRes.error && histRes.data)
        setDetailHistory(histRes.data.map(h => ({ ...h, changed_by: h.profiles?.full_name || 'Ẩn danh' })));
      if (!logsRes.error && logsRes.data)
        setDetailLogs(logsRes.data.map(l => ({ ...l, author_name: l.profiles?.full_name || '—' })));
    } catch (err) {
      console.error('Lỗi tải chi tiết task:', err);
    } finally {
      setDetailHistoryLoading(false);
      setDetailLogsLoading(false);
    }
  };

  const getMemberName = (id) => members.find(m => m.id === id)?.full_name || 'Chưa phân công';

  // ── UI ────────────────────────────────────────────────────────────────────

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm">Đang tải dữ liệu thống kê...</span>
      </div>
    </DashboardLayout>
  );

  const overviewCards = [
    {
      label: 'Tổng công việc',
      value: totalStats.total,
      icon: Target,
      color: 'text-slate-600 dark:text-slate-300',
      bg: 'bg-slate-500/10',
      onClick: totalStats.total > 0 ? openTotalList : null,
    },
    {
      label: 'Đã hoàn thành',
      value: totalStats.done,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      onClick: totalStats.done > 0 ? openDoneList : null,
    },
    {
      label: 'Đang thực hiện',
      value: totalStats.inProgress + totalStats.review,
      icon: Clock,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10',
      onClick: (totalStats.inProgress + totalStats.review) > 0 ? openInProgressList : null,
    },
    {
      label: 'Quá hạn',
      value: totalStats.overdue,
      icon: AlertCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
      onClick: totalStats.overdue > 0 ? openOverdueList : null,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Thống kê & Hiệu suất
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Tổng quan tình hình công việc và xếp hạng hiệu suất thành viên
            </p>
          </div>
          {isSupabaseConfigured && (
            <button onClick={fetchData} title="Làm mới"
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer shrink-0">
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs p-4 rounded-2xl flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button onClick={fetchData} className="ml-auto underline cursor-pointer">Thử lại</button>
          </div>
        )}

        {/* ── Overview cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewCards.map(({ label, value, icon: Icon, color, bg, onClick }) => (
            <div
              key={label}
              onClick={onClick || undefined}
              className={`bg-white dark:bg-gray-950/60 border border-slate-200 dark:border-gray-900 rounded-2xl p-5 shadow-sm transition-all duration-200
                ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-700 group' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
                <div className={`h-8 w-8 rounded-xl ${bg} flex items-center justify-center shrink-0 transition-transform ${onClick ? 'group-hover:scale-110' : ''}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
              <div className="flex items-center justify-between mt-1">
                {totalStats.total > 0 && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-600">
                    {pct(value, totalStats.total)}% tổng số
                  </p>
                )}
                {onClick && value > 0 && (
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    Xem danh sách <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Distribution charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Status chart */}
          <div className="bg-white dark:bg-gray-950/60 border border-slate-200 dark:border-gray-900 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-500" />
              Phân bổ theo trạng thái
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Cần làm',   value: totalStats.todo,       color: 'bg-slate-400 dark:bg-slate-600' },
                { label: 'Đang làm',  value: totalStats.inProgress, color: 'bg-indigo-500' },
                { label: 'Chờ duyệt', value: totalStats.review,     color: 'bg-amber-500' },
                { label: 'Đã xong',   value: totalStats.done,       color: 'bg-emerald-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${pct(value, totalStats.total)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-6 text-right shrink-0">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority chart */}
          <div className="bg-white dark:bg-gray-950/60 border border-slate-200 dark:border-gray-900 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Phân bổ theo mức độ ưu tiên
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Cao',   value: totalStats.high,   color: 'bg-rose-500' },
                { label: 'Vừa',  value: totalStats.medium, color: 'bg-amber-500' },
                { label: 'Thấp', value: totalStats.low,    color: 'bg-slate-400 dark:bg-slate-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${pct(value, totalStats.total)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-6 text-right shrink-0">{value}</span>
                </div>
              ))}
            </div>
            {totalStats.overdue > 0 && (
              <button
                onClick={openOverdueList}
                className="mt-4 w-full flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors cursor-pointer group"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span><strong>{totalStats.overdue}</strong> công việc đang quá hạn cần xử lý</span>
                <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>

        {/* ── Member task breakdown (admin/manager only) ── */}
        {isManagerOrAdmin && (
          <div className="bg-white dark:bg-gray-950/60 border border-slate-200 dark:border-gray-900 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Tiến độ từng thành viên
            </h3>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {[
                { label: 'Đã xong',   cls: 'bg-emerald-500' },
                { label: 'Chờ duyệt', cls: 'bg-amber-400' },
                { label: 'Đang làm',  cls: 'bg-indigo-400' },
                { label: 'Cần làm',   cls: 'bg-slate-300 dark:bg-slate-700' },
              ].map(({ label, cls }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-5">
              {memberStats.map(({ member, total, done, inProgress, review, todo, overdue }) => (
                <div key={member.id}>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        {member.full_name.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{member.full_name}</span>
                      {overdue > 0 && (
                        <button
                          onClick={() => {
                            const memberOverdue = tasks.filter(t => t.assigned_to === member.id && t.status !== 'done' && t.due_date && new Date(t.due_date) < today);
                            setTaskListModal({ title: `Công việc quá hạn — ${member.full_name}`, accentColor: 'rose', tasks: memberOverdue });
                            setDetailTask(null);
                          }}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] font-bold shrink-0 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          <AlertCircle className="h-2.5 w-2.5" />{overdue} quá hạn
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-600 shrink-0">{done}/{total}</span>
                  </div>

                  {total === 0 ? (
                    <div className="h-4 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center px-3">
                      <span className="text-[9px] text-slate-400">Chưa có công việc</span>
                    </div>
                  ) : (
                    <div className="h-4 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden flex">
                      {done       > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pct(done, total)}%` }} title={`Đã xong: ${done}`} />}
                      {review     > 0 && <div className="h-full bg-amber-400"   style={{ width: `${pct(review, total)}%` }} title={`Chờ duyệt: ${review}`} />}
                      {inProgress > 0 && <div className="h-full bg-indigo-400"  style={{ width: `${pct(inProgress, total)}%` }} title={`Đang làm: ${inProgress}`} />}
                      {todo       > 0 && <div className="h-full bg-slate-300 dark:bg-slate-700" style={{ width: `${pct(todo, total)}%` }} title={`Cần làm: ${todo}`} />}
                    </div>
                  )}

                  {total > 0 && (
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {[
                        { label: 'Xong',     val: done,       cls: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Duyệt',    val: review,     cls: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Đang làm', val: inProgress, cls: 'text-indigo-600 dark:text-indigo-400' },
                        { label: 'Chờ',      val: todo,       cls: 'text-slate-500 dark:text-slate-400' },
                      ].filter(x => x.val > 0).map(({ label, val, cls }) => (
                        <span key={label} className={`text-[10px] font-medium ${cls}`}>{val} {label}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Performance ranking ── */}
        <div className="bg-white dark:bg-gray-950/60 border border-slate-200 dark:border-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Xếp hạng hiệu suất
            </h3>
            <div className="text-[10px] text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1">
              Hoàn thành(50đ) + Đúng hạn(30đ) + Gia hạn(−4đ/lần)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40">
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5 py-2.5 w-10">#</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2.5">Thành viên</th>
                  <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2.5">Tổng</th>
                  <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2.5">Hoàn thành</th>
                  <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2.5">Quá hạn</th>
                  <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2.5">Gia hạn</th>
                  <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2.5">Điểm</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5 py-2.5">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {memberStats.map(({ member, total, done, inProgress, review, todo, overdue, extensions: ext, score }, idx) => {
                  const badge = scoreBadge(score);
                  const rankEl = idx === 0 ? <Trophy className="h-4 w-4 text-amber-500" />
                               : idx === 1 ? <Medal  className="h-4 w-4 text-slate-400" />
                               : idx === 2 ? <Award  className="h-4 w-4 text-amber-700 dark:text-amber-600" />
                               : <span className="text-xs font-bold text-slate-400 dark:text-slate-600">{idx + 1}</span>;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => { setMemberDetailModal({ member, total, done, inProgress, review, todo, overdue, extensions: ext, score }); setMemberDetailTab('done'); }}
                      className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/10 transition-colors cursor-pointer ${idx === 0 ? 'bg-amber-50/30 dark:bg-amber-950/5' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center">{rankEl}</div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                            {member.full_name.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-white whitespace-nowrap">{member.full_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center text-xs text-slate-600 dark:text-slate-400">{total}</td>
                      <td className="px-3 py-3.5 text-center">
                        {done > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const doneTasks = tasks.filter(t => t.assigned_to === member.id && t.status === 'done');
                              setTaskListModal({ title: `Đã hoàn thành — ${member.full_name}`, accentColor: 'emerald', tasks: doneTasks });
                              setDetailTask(null);
                            }}
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            {done}
                            {total > 0 && <span className="text-[10px] text-slate-400 dark:text-slate-600 ml-1 font-normal">({pct(done, total)}%)</span>}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {overdue > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const memberOverdue = tasks.filter(t => t.assigned_to === member.id && t.status !== 'done' && t.due_date && new Date(t.due_date) < today);
                              setTaskListModal({ title: `Quá hạn — ${member.full_name}`, accentColor: 'rose', tasks: memberOverdue });
                              setDetailTask(null);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                          >
                            <AlertCircle className="h-3 w-3" />{overdue}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {ext > 0
                          ? <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{ext} lần</span>
                          : <span className="text-[10px] text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="px-3 py-3.5">
                        {score !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                              <div className={`h-full rounded-full ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
                            </div>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-white">{score}</span>
                          </div>
                        ) : <span className="text-[10px] text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {memberStats.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-xs text-slate-400">Chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Deadline extension log ── */}
        <div className="bg-white dark:bg-gray-950/60 border border-slate-200 dark:border-gray-900 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            Lịch sử thay đổi hạn hoàn thành
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
              {extensions.length}
            </span>
          </h3>

          {extensions.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              Chưa ghi nhận lần thay đổi hạn hoàn thành nào.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {extensions.slice(0, 30).map((h, i) => {
                const dates       = extractDates(h.changes);
                const isExtension = dates && dates.to > dates.from;
                const task        = tasks.find(t => t.id === h.task_id);
                const member      = task ? members.find(m => m.id === task.assigned_to) : null;

                return (
                  <div key={h.id ?? i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900">
                    <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${isExtension ? 'bg-amber-500/10' : 'bg-sky-500/10'}`}>
                      <Calendar className={`h-3.5 w-3.5 ${isExtension ? 'text-amber-500' : 'text-sky-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                        {isExtension ? <span className="font-bold text-amber-600 dark:text-amber-400">Gia hạn </span>
                                     : <span className="font-bold text-sky-600 dark:text-sky-400">Điều chỉnh </span>}
                        {dates
                          ? <><span className="text-slate-500 dark:text-slate-500">{dates.from}</span>{' → '}<span className="font-semibold text-slate-700 dark:text-slate-300">{dates.to}</span></>
                          : <span className="text-slate-500">{h.changes}</span>}
                        {member && <span className="text-slate-400 dark:text-slate-600"> · {member.full_name}</span>}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 shrink-0 whitespace-nowrap">
                      {h.changed_at ? new Date(h.changed_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Member performance detail popup ── */}
      {memberDetailModal && (() => {
        const { member, total, done, overdue, extensions: ext, score } = memberDetailModal;
        const rank   = memberStats.findIndex(s => s.member.id === member.id);
        const badge  = scoreBadge(score);
        const detail = computeScoreDetail({ total, done, overdue, extensions: ext });

        const memberTasks  = tasks.filter(t => t.assigned_to === member.id);
        const doneTasks    = memberTasks.filter(t => t.status === 'done');
        const overdueTasks = memberTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < today);
        const extTaskIds   = new Set(extensions.filter(h => memberTasks.some(t => t.id === h.task_id)).map(h => h.task_id));
        const extTasks     = memberTasks.filter(t => extTaskIds.has(t.id));

        const tabs = [
          { key: 'done',     label: 'Hoàn thành', count: doneTasks.length,    activeCls: 'bg-emerald-500 text-white' },
          { key: 'overdue',  label: 'Quá hạn',    count: overdueTasks.length, activeCls: 'bg-rose-500 text-white' },
          { key: 'extended', label: 'Gia hạn',     count: extTasks.length,     activeCls: 'bg-amber-500 text-white' },
        ];
        const currentList = memberDetailTab === 'done' ? doneTasks : memberDetailTab === 'overdue' ? overdueTasks : extTasks;

        const rankEl = rank === 0 ? <Trophy className="h-4 w-4 text-amber-500" />
                     : rank === 1 ? <Medal  className="h-4 w-4 text-slate-400" />
                     : rank === 2 ? <Award  className="h-4 w-4 text-amber-700 dark:text-amber-600" />
                     : <span className="text-[10px] font-bold text-slate-500">#{rank + 1}</span>;

        const scoreRows = [
          {
            label: 'Hoàn thành công việc',
            formula: `(${done}/${total}) × 50`,
            pts: detail?.completionPts ?? 0,
            max: 50,
            barCls: 'bg-emerald-500',
            valCls: 'text-emerald-600 dark:text-emerald-400',
            tooltip: 'Tối đa 50 điểm. Tính theo tỷ lệ số task đã hoàn thành (trạng thái "Đã xong") trên tổng số task được giao cho thành viên.',
          },
          {
            label: 'Không có task quá hạn',
            formula: `max(0, 30 − ${overdue}×10)`,
            pts: detail?.timelinessPts ?? 0,
            max: 30,
            barCls: 'bg-indigo-500',
            valCls: 'text-indigo-600 dark:text-indigo-400',
            tooltip: 'Tối đa 30 điểm. Trừ 10 điểm cho mỗi task đang quá hạn chưa hoàn thành (hạn đã qua nhưng chưa "Đã xong").',
          },
          {
            label: 'Không gia hạn task',
            formula: `max(0, 20 − ${ext}×4)`,
            pts: detail?.extensionPts ?? 0,
            max: 20,
            barCls: 'bg-amber-500',
            valCls: 'text-amber-600 dark:text-amber-400',
            tooltip: 'Tối đa 20 điểm. Trừ 4 điểm cho mỗi lần thay đổi hạn hoàn thành của task (mỗi lần gia hạn trong lịch sử task_history).',
          },
        ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setMemberDetailModal(null)} />
            <div className="relative z-10 w-full max-w-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] animate-scale-up">

              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-base font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {member.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white truncate">{member.full_name}</h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <div className="flex items-center gap-1">{rankEl}<span className="text-[10px] text-slate-400">Hạng {rank + 1}</span></div>
                      <span className={`inline-flex px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setMemberDetailModal(null)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-5">

                {/* Score breakdown */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" /> Phân tích điểm hiệu suất
                  </p>
                  {detail ? (
                    <div className="space-y-3">
                      {scoreRows.map(({ label, formula, pts, max, barCls, valCls, tooltip }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <Tooltip text={tooltip}>
                              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug">{label}</span>
                              <Info className="h-3 w-3 text-slate-400 shrink-0" />
                            </Tooltip>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-slate-400 font-mono">{formula} =</span>
                              <span className={`text-xs font-bold ${valCls}`}>{pts}</span>
                              <span className="text-[10px] text-slate-400">/{max}</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${barCls}`} style={{ width: `${(pts / max) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <Tooltip text="Tổng của 3 thành phần: Hoàn thành (50đ) + Đúng hạn (30đ) + Không gia hạn (20đ). Tối đa 100 điểm.">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Tổng điểm hiệu suất</span>
                          <Info className="h-3 w-3 text-slate-400 shrink-0" />
                        </Tooltip>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-lg font-extrabold text-slate-800 dark:text-white">{score}</span>
                          <span className="text-xs text-slate-400">/100</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Chưa có task nào để tính điểm.</p>
                  )}
                </div>

                {/* Task tabs */}
                <div>
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {tabs.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setMemberDetailTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          memberDetailTab === tab.key ? tab.activeCls + ' shadow-sm' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          memberDetailTab === tab.key ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>{tab.count}</span>
                      </button>
                    ))}
                  </div>

                  {currentList.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <FileText className="h-7 w-7 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Không có công việc nào.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentList.map(task => {
                        const sm = STATUS_META[task.status] || STATUS_META.todo;
                        const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
                        const isOverdue = task.status !== 'done' && task.due_date && new Date(task.due_date) < today;
                        const taskExtCount = extensions.filter(h => h.task_id === task.id).length;
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => { setMemberDetailModal(null); openDetail(task); }}
                            className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-900 transition-all group cursor-pointer"
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  {task.code && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                      {task.code}
                                    </span>
                                  )}
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${sm.cls} shrink-0`}>{sm.label}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${pm.cls} shrink-0`}>{pm.label}</span>
                                  {taskExtCount > 0 && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shrink-0">
                                      +{taskExtCount} gia hạn
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">{task.title || '(Chưa đặt tên)'}</p>
                                {task.due_date && (
                                  <span className={`mt-1 text-[10px] flex items-center gap-1 ${isOverdue ? 'text-rose-500 dark:text-rose-400 font-semibold' : 'text-slate-400'}`}>
                                    <CalendarDays className="h-3 w-3 shrink-0" />
                                    {new Date(task.due_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    {isOverdue && ' (Quá hạn)'}
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Task list popup ── */}
      {taskListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={closeListModal} />
          <div className="relative z-10 w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] animate-scale-up">

            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                  taskListModal.accentColor === 'emerald' ? 'bg-emerald-500/10' :
                  taskListModal.accentColor === 'indigo'  ? 'bg-indigo-500/10' :
                  taskListModal.accentColor === 'slate'   ? 'bg-slate-500/10' :
                  'bg-rose-500/10'
                }`}>
                  {taskListModal.accentColor === 'emerald' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> :
                   taskListModal.accentColor === 'indigo'  ? <Clock className="h-4 w-4 text-indigo-500" /> :
                   taskListModal.accentColor === 'slate'   ? <Target className="h-4 w-4 text-slate-500" /> :
                   <AlertCircle className="h-4 w-4 text-rose-500" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white truncate">{taskListModal.title}</h2>
                  <p className="text-[10px] text-slate-400">{taskListModal.tasks.length} công việc</p>
                </div>
              </div>
              <button onClick={closeListModal} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {taskListModal.tasks.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Không có công việc nào.</p>
                </div>
              ) : (
                taskListModal.tasks.map(task => {
                  const sm = STATUS_META[task.status] || STATUS_META.todo;
                  const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
                  const isOverdue = task.status !== 'done' && task.due_date && new Date(task.due_date) < today;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => openDetail(task)}
                      className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-900 transition-all group cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            {task.code && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                {task.code}
                              </span>
                            )}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${sm.cls} shrink-0`}>{sm.label}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${pm.cls} shrink-0`}>{pm.label}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                            {task.title || '(Chưa đặt tên)'}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <User className="h-3 w-3 shrink-0" />
                              {getMemberName(task.assigned_to)}
                            </span>
                            {task.due_date && (
                              <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-rose-500 dark:text-rose-400 font-semibold' : 'text-slate-400'}`}>
                                <CalendarDays className="h-3 w-3 shrink-0" />
                                {new Date(task.due_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                {isOverdue && ' (Quá hạn)'}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Task detail popup (stacks over list) ── */}
      {detailTask && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-500/20 backdrop-blur-sm" onClick={() => setDetailTask(null)} />
          <div className="relative z-10 w-full max-w-2xl bg-white/97 dark:bg-slate-900/97 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">

            {/* Header */}
            <div className="flex items-start gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {detailTask.code && (
                    <span className="text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {detailTask.code}
                    </span>
                  )}
                  {(() => { const sm = STATUS_META[detailTask.status] || STATUS_META.todo; return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${sm.cls}`}>{sm.label}</span>; })()}
                  {(() => { const pm = PRIORITY_META[detailTask.priority] || PRIORITY_META.medium; return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${pm.cls}`}>{pm.label}</span>; })()}
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  {detailTask.title || '(Chưa đặt tên)'}
                </h3>
              </div>
              <button onClick={() => setDetailTask(null)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Description */}
              {detailTask.description && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mô tả</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{detailTask.description}</p>
                </div>
              )}

              {/* Meta */}
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <User className="h-3 w-3" /> Người thực hiện
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 shrink-0">
                      {getMemberName(detailTask.assigned_to)?.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{getMemberName(detailTask.assigned_to)}</span>
                  </div>
                </div>
                {detailTask.due_date && (() => {
                  const isOverdue = detailTask.status !== 'done' && new Date(detailTask.due_date) < today;
                  return (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Hạn hoàn thành
                      </p>
                      <span className={`text-xs font-semibold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {new Date(detailTask.due_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        {isOverdue && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 font-bold">Quá hạn</span>}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Deadline change history */}
              <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-500/15 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" /> Lịch sử sửa đổi hạn hoàn thành
                  {!detailHistoryLoading && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-[9px] font-bold">
                      {detailHistory.filter(h => h.changes?.includes('Hạn hoàn thành')).length}
                    </span>
                  )}
                </p>
                {detailHistoryLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải...</div>
                ) : (() => {
                  const deadlineHistory = detailHistory.filter(h => h.changes?.includes('Hạn hoàn thành'));
                  return deadlineHistory.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Chưa ghi nhận thay đổi hạn hoàn thành.</p>
                  ) : (
                    <div className="space-y-2">
                      {deadlineHistory.map((h, i) => {
                        const m = h.changes?.match(/Hạn hoàn thành:\s*(.+?)\s*[→>]\s*(.+)/);
                        return (
                          <div key={h.id ?? i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-amber-200/50 dark:border-amber-800/20">
                            <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              {m ? (
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                  <span className="line-through text-slate-400 dark:text-slate-500">{m[1]}</span>
                                  {' → '}
                                  <span className="font-bold text-slate-800 dark:text-slate-100">{m[2]}</span>
                                </p>
                              ) : (
                                <p className="text-xs text-slate-600 dark:text-slate-300">{h.changes}</p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {h.changed_by && <span className="font-medium">{h.changed_by} · </span>}
                                {new Date(h.changed_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* History */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Lịch sử thay đổi
                </p>
                {detailHistoryLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-3"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải...</div>
                ) : detailHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">Chưa có lịch sử thay đổi.</p>
                ) : (
                  <div className="relative pl-4 space-y-0">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />
                    {detailHistory.map((h, i) => (
                      <div key={h.id ?? i} className="relative flex gap-3 pb-3 last:pb-0">
                        <div className={`absolute -left-4 top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 shrink-0 ${h.action === 'create' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                        <div className="flex-1 min-w-0 pl-2">
                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{h.changes}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {h.changed_by && <span className="font-medium">{h.changed_by} · </span>}
                            {new Date(h.changed_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Related daily logs */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Nhật ký liên quan
                </p>
                {detailLogsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-3"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải...</div>
                ) : detailLogs.length === 0 ? (
                  <div className="py-5 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <FileText className="h-7 w-7 text-slate-300 dark:text-slate-700 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-400">Chưa có nhật ký nào gắn với công việc này.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailLogs.map(log => (
                      <div key={log.id} className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <div className="shrink-0 text-center">
                          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                            {new Date(log.log_date + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {new Date(log.log_date + 'T00:00:00').getFullYear()}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{log.title || '(Chưa có tiêu đề)'}</p>
                          {log.author_name && <p className="text-[10px] text-slate-400 mt-0.5">{log.author_name}</p>}
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold shrink-0 ${log.is_approved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'}`}>
                          {log.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setDetailTask(null)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
              >
                ← Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

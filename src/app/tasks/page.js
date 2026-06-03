'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import DatePickerInput from '@/components/DatePickerInput';
import { supabase, withTimeout } from '@/lib/supabase';
import { MOCK_PROJECTS, MOCK_SPRINTS } from '@/lib/mockData';
import {
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  FolderPlus,
  Loader2,
  X,
  SlidersHorizontal,
  Inbox,
  Clock,
  FolderKanban,
  Eye,
  FileText,
  User,
  Shield,
  CalendarDays,
  ChevronRight,
  RotateCcw,
  CheckCheck,
  LayoutDashboard,
  List,
  History,
} from 'lucide-react';

// Dữ liệu mock ban đầu cho công việc khi chưa kết nối Supabase
const MOCK_TASKS = [
  { id: '1', code: 'DEMO-001', title: 'Thiết kế giao diện Dashboard PROJEXA', description: 'Tạo mockup và style CSS hoàn chỉnh cho trang Dashboard của hệ thống.', status: 'in_progress', priority: 'high', assigned_to: '3', reported_to: '2', due_date: '2026-06-05', created_by: '1' },
  { id: '2', code: 'DEMO-002', title: 'Cấu hình cơ sở dữ liệu Supabase', description: 'Thiết lập các bảng, cấu hình RLS và seed dữ liệu phân quyền ban đầu.', status: 'done', priority: 'high', assigned_to: '1', reported_to: '2', due_date: '2026-06-01', created_by: '1' },
  { id: '3', code: 'DEMO-003', title: 'Tạo API Route cấp tài khoản an toàn', description: 'Viết API POST /api/admin/create-user để admin tạo tài khoản qua service role key.', status: 'review', priority: 'medium', assigned_to: '3', reported_to: '1', due_date: '2026-06-03', created_by: '2' },
  { id: '4', code: 'DEMO-004', title: 'Viết tài liệu hướng dẫn chuyển giao dự án', description: 'Tạo file README chi tiết hướng dẫn chạy và cấu hình các biến môi trường.', status: 'todo', priority: 'low', assigned_to: '4', reported_to: '2', due_date: '2026-06-10', created_by: '1' },
  { id: '5', code: 'DEMO-005', title: 'Tích hợp phân quyền vào Kanban Board', description: 'Kiểm tra quyền can_create, can_update, can_delete để ẩn/hiển thị các nút tương ứng.', status: 'todo', priority: 'high', assigned_to: '3', reported_to: '1', due_date: '2026-06-07', created_by: '2' },
];

const MOCK_PROFILES = [
  { id: '1', full_name: 'Nguyễn Văn Admin' },
  { id: '2', full_name: 'Trần Thị Manager' },
  { id: '3', full_name: 'Phạm Minh Developer' },
  { id: '4', full_name: 'Lê Hoàng Coder' },
];

const MOCK_HISTORY = [
  { id: 'h1', task_id: '1', changed_by: 'Nguyễn Văn Admin', changed_at: '2026-05-28T08:00:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h2', task_id: '1', changed_by: 'Trần Thị Manager', changed_at: '2026-06-01T09:30:00Z', action: 'update', changes: 'Trạng thái: Cần làm → Đang làm; Độ ưu tiên: Vừa → Cao' },
  { id: 'h3', task_id: '2', changed_by: 'Nguyễn Văn Admin', changed_at: '2026-05-29T14:00:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h4', task_id: '2', changed_by: 'Phạm Minh Developer', changed_at: '2026-05-31T16:45:00Z', action: 'update', changes: 'Trạng thái: Đang làm → Đã xong' },
  { id: 'h5', task_id: '3', changed_by: 'Trần Thị Manager', changed_at: '2026-05-30T10:00:00Z', action: 'create', changes: 'Tạo công việc mới' },
  { id: 'h6', task_id: '3', changed_by: 'Phạm Minh Developer', changed_at: '2026-06-02T11:15:00Z', action: 'update', changes: 'Trạng thái: Cần làm → Chờ duyệt' },
  { id: 'h7', task_id: '1', changed_by: 'Trần Thị Manager', changed_at: '2026-06-03T14:00:00Z', action: 'update', changes: 'Hạn hoàn thành: 2026-06-03 → 2026-06-05' },
  { id: 'h8', task_id: '3', changed_by: 'Nguyễn Văn Admin', changed_at: '2026-06-01T09:00:00Z', action: 'update', changes: 'Hạn hoàn thành: 2026-05-30 → 2026-06-03' },
];

const COLUMNS = [
  { id: 'todo', name: 'Cần làm', color: 'border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/10 text-slate-500 dark:text-slate-400' },
  { id: 'in_progress', name: 'Đang làm', color: 'border-indigo-150 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/5 text-indigo-600 dark:text-indigo-400' },
  { id: 'review', name: 'Chờ duyệt', color: 'border-amber-150 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/5 text-amber-600 dark:text-amber-400' },
  { id: 'done', name: 'Đã xong', color: 'border-emerald-150 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/5 text-emerald-600 dark:text-emerald-400' },
];

export default function TasksPage() {
  const router = useRouter();
  const { user, profile, hasPermission, role } = useAuth();
  
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [members, setMembers] = useState(MOCK_PROFILES);
  const [projects, setProjects] = useState([]);
  const [allSprints, setAllSprints] = useState([]);

  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quyền thao tác lấy từ context phân quyền động
  const canCreate = hasPermission('tasks', 'create') || !isSupabaseConfigured; // cho phép ở preview
  const canUpdate = hasPermission('tasks', 'update') || !isSupabaseConfigured;
  const canDelete = hasPermission('tasks', 'delete') || !isSupabaseConfigured;

  // Trạng thái modal Thêm/Sửa Task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null nếu thêm mới
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskSprintId, setTaskSprintId] = useState('');
  const [taskCode, setTaskCode] = useState('');
  const [taskReportedTo, setTaskReportedTo] = useState('');

  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Chế độ xem: 'kanban' hoặc 'table'
  const [viewMode, setViewMode] = useState('kanban');
  useEffect(() => {
    try { setViewMode(localStorage.getItem('aerotask_tasks_view') || 'kanban'); } catch {}
  }, []);
  const switchViewMode = (mode) => {
    setViewMode(mode);
    try { localStorage.setItem('aerotask_tasks_view', mode); } catch {}
  };

  // Trạng thái modal Lịch sử
  const [allMockHistory, setAllMockHistory] = useState(MOCK_HISTORY);
  const [taskHistory, setTaskHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTask, setHistoryTask] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Trạng thái modal Xem chi tiết công việc
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [taskRelatedLogs, setTaskRelatedLogs] = useState([]);
  const [taskRelatedLogsLoading, setTaskRelatedLogsLoading] = useState(false);
  const [taskDueDateHistory, setTaskDueDateHistory] = useState([]);
  const [taskDueDateHistoryLoading, setTaskDueDateHistoryLoading] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [taskFullHistory, setTaskFullHistory] = useState([]);
  const [taskFullHistoryLoading, setTaskFullHistoryLoading] = useState(false);

  // Modal tóm tắt nhật ký
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [viewLog, setViewLog] = useState(null);
  const [logApproving, setLogApproving] = useState(false);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url')) {
      setIsSupabaseConfigured(false);
      // Load projects/sprints from localStorage (preview mode)
      try {
        const savedProjects = localStorage.getItem('aerotask_projects');
        const savedSprints = localStorage.getItem('aerotask_sprints');
        setProjects(savedProjects ? JSON.parse(savedProjects) : MOCK_PROJECTS);
        setAllSprints(savedSprints ? JSON.parse(savedSprints) : MOCK_SPRINTS);
      } catch { setProjects(MOCK_PROJECTS); setAllSprints(MOCK_SPRINTS); }
      setLoading(false);
      return;
    }

    fetchTasksAndMembers();
  }, []);

  const fetchTasksAndMembers = async () => {
    try {
      setLoading(true);
      setError('');

      const [profilesRes, tasksRes, projectsRes, sprintsRes] = await Promise.all([
        withTimeout(supabase.from('profiles').select('id, full_name')),
        withTimeout(supabase.from('tasks').select('*').order('created_at', { ascending: false })),
        withTimeout(supabase.from('projects').select('id, code, name').order('created_at', { ascending: true })),
        withTimeout(supabase.from('sprints').select('id, project_id, code, name').order('start_date', { ascending: true })),
      ]);

      if (!profilesRes.error && profilesRes.data) setMembers(profilesRes.data);
      if (!tasksRes.error && tasksRes.data) setTasks(tasksRes.data);
      if (!projectsRes.error && projectsRes.data) setProjects(projectsRes.data);
      if (!sprintsRes.error && sprintsRes.data) setAllSprints(sprintsRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Kanban:', err);
      setError(err.message || 'Không thể kết nối với cơ sở dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockTaskCode = (projectId) => {
    if (!projectId) return '';
    const project = projects.find(p => p.id === projectId);
    if (!project) return '';
    const count = tasks.filter(t => t.project_id === projectId).length;
    return `${project.code}-${String(count + 1).padStart(3, '0')}`;
  };

  const handleProjectChangeInModal = async (newProjId) => {
    setTaskProjectId(newProjId);
    setTaskSprintId('');
    if (!editingTask && newProjId) {
      if (!isSupabaseConfigured) {
        setTaskCode(generateMockTaskCode(newProjId));
      } else {
        try {
          const { count } = await withTimeout(
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', newProjId)
          );
          const project = projects.find(p => p.id === newProjId);
          if (project) setTaskCode(`${project.code}-${String((count || 0) + 1).padStart(3, '0')}`);
        } catch { setTaskCode(''); }
      }
    } else if (!editingTask) {
      setTaskCode('');
    }
  };

  // Mở modal thêm mới
  const handleOpenAddModal = (initialStatus = 'todo') => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskStatus(initialStatus);
    setTaskPriority('medium');
    setTaskAssignee(user?.id || members[0]?.id || '');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
    setTaskProjectId('');
    setTaskSprintId('');
    setTaskCode('');
    setTaskReportedTo(user?.id || '');
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (task) => {
    if (!canUpdate) return;
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskAssignee(task.assigned_to || '');
    setTaskDueDate(task.due_date || '');
    setTaskProjectId(task.project_id || '');
    setTaskSprintId(task.sprint_id || '');
    setTaskCode(task.code || '');
    setTaskReportedTo(task.reported_to || '');
    setIsModalOpen(true);
  };

  // Xử lý Gửi Form (Thêm hoặc Cập nhật)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskProjectId) return;

    setModalSubmitting(true);

    try {
      const statusNames = { todo: 'Cần làm', in_progress: 'Đang làm', review: 'Chờ duyệt', done: 'Đã xong' };
      const priorityNames = { high: 'Cao', medium: 'Vừa', low: 'Thấp' };

      const buildChangeLog = (oldTask) => {
        const changes = [];
        if (oldTask.title !== taskTitle) changes.push(`Tên: "${oldTask.title}" → "${taskTitle}"`);
        if ((oldTask.description || '') !== taskDesc) changes.push('Mô tả đã được cập nhật');
        if (oldTask.status !== taskStatus) changes.push(`Trạng thái: ${statusNames[oldTask.status] || oldTask.status} → ${statusNames[taskStatus] || taskStatus}`);
        if (oldTask.priority !== taskPriority) changes.push(`Độ ưu tiên: ${priorityNames[oldTask.priority] || oldTask.priority} → ${priorityNames[taskPriority] || taskPriority}`);
        const oldMember = members.find(m => m.id === oldTask.assigned_to)?.full_name || 'Chưa phân công';
        const newMember = members.find(m => m.id === taskAssignee)?.full_name || 'Chưa phân công';
        if ((oldTask.assigned_to || '') !== taskAssignee) changes.push(`Người thực hiện: ${oldMember} → ${newMember}`);
        const oldReporter = members.find(m => m.id === oldTask.reported_to)?.full_name || 'Chưa chọn';
        const newReporter = members.find(m => m.id === taskReportedTo)?.full_name || 'Chưa chọn';
        if ((oldTask.reported_to || '') !== taskReportedTo) changes.push(`Người được báo cáo: ${oldReporter} → ${newReporter}`);
        if ((oldTask.due_date || '') !== taskDueDate) changes.push(`Hạn hoàn thành: ${oldTask.due_date || 'Chưa đặt'} → ${taskDueDate || 'Chưa đặt'}`);
        const oldProject = projects.find(p => p.id === oldTask.project_id)?.name || 'Chưa chọn';
        const newProject = projects.find(p => p.id === taskProjectId)?.name || 'Chưa chọn';
        if ((oldTask.project_id || '') !== taskProjectId) changes.push(`Dự án: ${oldProject} → ${newProject}`);
        const oldSprint = allSprints.find(s => s.id === oldTask.sprint_id)?.name || 'Chưa chọn';
        const newSprint = allSprints.find(s => s.id === taskSprintId)?.name || 'Chưa chọn';
        if ((oldTask.sprint_id || '') !== taskSprintId) changes.push(`Sprint: ${oldSprint} → ${newSprint}`);
        return changes.length > 0 ? changes.join('; ') : 'Không có thay đổi nào';
      };

      if (!isSupabaseConfigured) {
        // Chế độ Xem trước: cập nhật local state
        let taskId;
        if (editingTask) {
          taskId = editingTask.id;
          setTasks(tasks.map(t => t.id === taskId ? {
            ...t,
            title: taskTitle,
            description: taskDesc,
            status: taskStatus,
            priority: taskPriority,
            assigned_to: taskAssignee,
            reported_to: taskReportedTo || null,
            due_date: taskDueDate,
            project_id: taskProjectId || null,
            sprint_id: taskSprintId || null,
          } : t));
        } else {
          taskId = 'mock-' + Math.random().toString(36).substr(2, 9);
          const generatedCode = taskCode || (taskProjectId ? generateMockTaskCode(taskProjectId) : `TASK-${Date.now()}`);
          const newTask = {
            id: taskId,
            code: generatedCode,
            title: taskTitle,
            description: taskDesc,
            status: taskStatus,
            priority: taskPriority,
            assigned_to: taskAssignee,
            reported_to: taskReportedTo || null,
            due_date: taskDueDate,
            project_id: taskProjectId || null,
            sprint_id: taskSprintId || null,
            created_at: new Date().toISOString(),
          };
          setTasks([newTask, ...tasks]);
        }

        // Ghi lịch sử thay đổi
        const historyEntry = {
          id: 'h-' + Math.random().toString(36).substr(2, 9),
          task_id: taskId,
          changed_by: profile?.full_name || 'Người dùng',
          changed_at: new Date().toISOString(),
          action: editingTask ? 'update' : 'create',
          changes: editingTask ? buildChangeLog(editingTask) : 'Tạo công việc mới',
        };
        setAllMockHistory(prev => [historyEntry, ...prev]);

        setIsModalOpen(false);
        return;
      }

      // Giao tiếp với cơ sở dữ liệu thực tế Supabase
      if (editingTask) {
        // Cập nhật công việc đã có
        const { error } = await supabase
          .from('tasks')
          .update({
            title: taskTitle,
            description: taskDesc,
            status: taskStatus,
            priority: taskPriority,
            assigned_to: taskAssignee || null,
            reported_to: taskReportedTo || null,
            due_date: taskDueDate || null,
            project_id: taskProjectId || null,
            sprint_id: taskSprintId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTask.id);

        if (error) throw error;

        // Ghi lịch sử thay đổi vào DB
        await withTimeout(supabase.from('task_history').insert({
          task_id: editingTask.id,
          changed_by_id: profile?.id || null,
          action: 'update',
          changes: buildChangeLog(editingTask),
        })).catch(() => {});
      } else {
        // Tạo công việc mới
        const { data: newTask, error } = await supabase
          .from('tasks')
          .insert({
            code: taskCode || undefined,
            title: taskTitle,
            description: taskDesc,
            status: taskStatus,
            priority: taskPriority,
            assigned_to: taskAssignee || null,
            reported_to: taskReportedTo || null,
            due_date: taskDueDate || null,
            project_id: taskProjectId || null,
            sprint_id: taskSprintId || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Ghi lịch sử tạo mới vào DB
        if (newTask?.id) {
          await withTimeout(supabase.from('task_history').insert({
            task_id: newTask.id,
            changed_by_id: profile?.id || null,
            action: 'create',
            changes: 'Tạo công việc mới',
          })).catch(() => {});
        }
      }

      // Load lại DB và đóng modal
      await fetchTasksAndMembers();
      setIsModalOpen(false);

    } catch (err) {
      alert('Lỗi thao tác trên công việc: ' + err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Xóa công việc
  const handleDeleteTask = async (id, title, e) => {
    e.stopPropagation(); // ngăn không kích hoạt click mở modal sửa
    if (!canDelete) return;

    if (!confirm(`Bạn có chắc muốn xóa công việc "${title}" không?`)) {
      return;
    }

    try {
      if (!isSupabaseConfigured) {
        setTasks(tasks.filter(t => t.id !== id));
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTasksAndMembers();
    } catch (err) {
      alert('Không thể xóa công việc: ' + err.message);
    }
  };

  // Mở modal lịch sử thay đổi
  const handleOpenHistoryModal = async (task, e) => {
    e.stopPropagation();
    setHistoryTask(task);
    setTaskHistory([]);
    setIsHistoryModalOpen(true);

    if (!isSupabaseConfigured) {
      setTaskHistory(allMockHistory.filter(h => h.task_id === task.id));
      return;
    }

    setHistoryLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('task_history')
          .select('*, profiles!changed_by_id(full_name)')
          .eq('task_id', task.id)
          .order('changed_at', { ascending: false })
      );
      if (!error && data) {
        setTaskHistory(data.map(h => ({ ...h, changed_by: h.profiles?.full_name || 'Ẩn danh' })));
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenViewModal = async (task, e) => {
    e.stopPropagation();
    setViewTask(task);
    setTaskRelatedLogs([]);
    setTaskDueDateHistory([]);
    setTaskFullHistory([]);
    setShowFullHistory(false);
    setIsViewModalOpen(true);

    if (!isSupabaseConfigured) {
      setTaskDueDateHistory(allMockHistory.filter(h => h.task_id === task.id && h.changes?.includes('Hạn hoàn thành')));
      return;
    }
    if (!user) return;

    setTaskRelatedLogsLoading(true);
    setTaskDueDateHistoryLoading(true);
    try {
      const [logsRes, histRes] = await Promise.all([
        withTimeout(
          supabase
            .from('daily_logs')
            .select('id, log_date, title, content, is_approved, approved_at, created_at, profiles:approved_by(full_name)')
            .eq('task_id', task.id)
            .eq('user_id', user.id)
            .order('log_date', { ascending: false })
        ),
        withTimeout(
          supabase
            .from('task_history')
            .select('id, changed_at, changes, profiles:changed_by_id(full_name)')
            .eq('task_id', task.id)
            .ilike('changes', '%Hạn hoàn thành%')
            .order('changed_at', { ascending: false })
        ),
      ]);
      if (!logsRes.error && logsRes.data)
        setTaskRelatedLogs(logsRes.data.map(d => ({ ...d, approved_by_name: d.profiles?.full_name || null })));
      if (!histRes.error && histRes.data)
        setTaskDueDateHistory(histRes.data.map(h => ({ ...h, changed_by: h.profiles?.full_name || 'Ẩn danh' })));
    } catch (err) {
      console.error('Lỗi tải dữ liệu chi tiết task:', err);
    } finally {
      setTaskRelatedLogsLoading(false);
      setTaskDueDateHistoryLoading(false);
    }
  };

  const handleToggleFullHistory = async () => {
    if (showFullHistory) { setShowFullHistory(false); return; }
    setShowFullHistory(true);
    if (taskFullHistory.length > 0) return; // already loaded
    if (!isSupabaseConfigured) {
      setTaskFullHistory(allMockHistory.filter(h => h.task_id === viewTask?.id));
      return;
    }
    if (!viewTask) return;
    setTaskFullHistoryLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.from('task_history')
          .select('id, changed_at, action, changes, profiles:changed_by_id(full_name)')
          .eq('task_id', viewTask.id)
          .order('changed_at', { ascending: false })
      );
      if (!error && data)
        setTaskFullHistory(data.map(h => ({ ...h, changed_by: h.profiles?.full_name || 'Ẩn danh' })));
    } catch (err) {
      console.error('Lỗi tải lịch sử:', err);
    } finally {
      setTaskFullHistoryLoading(false);
    }
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

  const getMemberName = (id) => {
    const m = members.find(item => item.id === id);
    return m ? m.full_name : 'Chưa phân công';
  };

  const getPriorityBadgeStyle = (prio) => {
    switch (prio) {
      case 'high': return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/10';
      case 'medium': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/10';
      case 'low': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10';
      default: return 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/10';
    }
  };

  const STATUS_NAMES = { todo: 'Cần làm', in_progress: 'Đang làm', review: 'Chờ duyệt', done: 'Đã xong' };

  // Các nút chuyển trạng thái theo từng cột
  const STATUS_TRANSITIONS = {
    todo:        [{ to: 'in_progress', label: 'Bắt đầu',   icon: ChevronRight, cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20' }],
    in_progress: [{ to: 'todo',        label: 'Hoàn tác',  icon: RotateCcw,    cls: 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800' },
                  { to: 'review',      label: 'Gửi duyệt', icon: ChevronRight, cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20' }],
    review:      [{ to: 'in_progress', label: 'Trả lại',   icon: RotateCcw,    cls: 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800' },
                  { to: 'done',        label: 'Hoàn thành',icon: CheckCheck,   cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20', requiresReporter: true }],
    done:        [{ to: 'in_progress', label: 'Mở lại',    icon: RotateCcw,    cls: 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800', requiresReporter: true }],
  };

  const canMoveToDone = (task) => isAdmin || !isSupabaseConfigured || task.reported_to === user?.id;

  const handleChangeTaskStatus = async (task, newStatus, e) => {
    e.stopPropagation();
    if (!canUpdate) return;
    if (newStatus === 'done' && !canMoveToDone(task)) return;

    const changeLog = `Trạng thái: ${STATUS_NAMES[task.status]} → ${STATUS_NAMES[newStatus]}`;

    if (!isSupabaseConfigured) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      setAllMockHistory(prev => [{
        id: 'h-' + Math.random().toString(36).substr(2, 9),
        task_id: task.id,
        changed_by: profile?.full_name || 'Người dùng',
        changed_at: new Date().toISOString(),
        action: 'update',
        changes: changeLog,
      }, ...prev]);
      return;
    }

    try {
      const { error } = await withTimeout(
        supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', task.id)
      );
      if (error) throw error;
      await withTimeout(supabase.from('task_history').insert({
        task_id: task.id, changed_by_id: user?.id || null, action: 'update', changes: changeLog,
      })).catch(() => {});
      await fetchTasksAndMembers();
    } catch (err) {
      alert('Không thể cập nhật trạng thái: ' + err.message);
    }
  };

  // Admin thấy tất cả; các role khác chỉ thấy task được giao hoặc báo cáo cho mình
  const isAdmin = role?.name === 'Admin';
  const isManagerOrAdmin = isAdmin || role?.name === 'Manager';
  const visibleTasks = (isSupabaseConfigured && user && !isAdmin)
    ? tasks.filter(t => t.assigned_to === user.id || t.reported_to === user.id)
    : tasks;

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Quản lý công việc
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Quản lý tiến độ dự án theo dạng Kanban hoặc bảng danh sách.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* View mode toggle */}
            <div className="flex items-center gap-0.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => switchViewMode('kanban')}
                title="Kanban"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Kanban
              </button>
              <button
                onClick={() => switchViewMode('table')}
                title="Bảng danh sách"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <List className="h-3.5 w-3.5" /> Bảng
              </button>
            </div>

            {canCreate && (
              <button
                onClick={() => handleOpenAddModal('todo')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <FolderPlus className="h-4.5 w-4.5" />
                Tạo công việc
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Preview Notice / Permissions Info */}
        {!canCreate && (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 text-slate-600 dark:text-slate-400 text-xs shadow-sm">
            <AlertCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Tài khoản của bạn chỉ có quyền **Xem** và **Cập nhật** (Đổi trạng thái) công việc. Nút tạo mới và nút xóa đã được ẩn theo chính sách phân quyền của quản trị viên.
            </span>
          </div>
        )}

        {/* Error alert with retry option */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-xs p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in select-none">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
            <button
              onClick={fetchTasksAndMembers}
              className="px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              Thử tải lại ngay
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-500">Đang tải bảng công việc nhóm...</span>
          </div>
        )}

        {/* Kanban Board Grid */}
        {!loading && viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {COLUMNS.map(col => {
              // Lọc các công việc thuộc cột này (chỉ hiển thị task của người dùng)
              const colTasks = visibleTasks.filter(t => t.status === col.id);

              return (
                <div key={col.id} className="flex flex-col h-full min-h-[500px] bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 p-4 rounded-2xl">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-900">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${col.id === 'done' ? 'bg-emerald-500' : col.id === 'in_progress' ? 'bg-indigo-500' : col.id === 'review' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">{col.name}</h3>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-500 px-2 py-0.5 rounded-full font-black">
                        {colTasks.length}
                      </span>
                    </div>
                    {canCreate && (
                      <button 
                        onClick={() => handleOpenAddModal(col.id)}
                        className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-950 transition-colors cursor-pointer"
                        title="Thêm công việc vào cột này"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {colTasks.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-900 rounded-xl flex flex-col items-center justify-center gap-2">
                        <Inbox className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                        Trống
                      </div>
                    ) : (
                      colTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleOpenViewModal(task, { stopPropagation: () => {} })}
                          className="glass-panel p-4.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between gap-4.5 transition-all duration-200 group hover:border-slate-350 dark:hover:border-slate-700 cursor-pointer hover:bg-white dark:hover:bg-slate-900/35 hover:-translate-y-0.5"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getPriorityBadgeStyle(task.priority)}`}>
                                  {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Vừa' : 'Thấp'}
                                </span>
                                {task.code && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                                    {task.code}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-0.5">
                                {canUpdate && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenEditModal(task); }}
                                    className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                    title="Chỉnh sửa công việc"
                                  >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleOpenHistoryModal(task, e)}
                                  className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Xem lịch sử thay đổi"
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                </button>
                                {canDelete && (
                                  <button
                                    onClick={(e) => handleDeleteTask(task.id, task.title, e)}
                                    className="p-1 rounded text-slate-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                    title="Xóa công việc"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors leading-relaxed">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                            {task.project_id && (() => {
                              const proj = projects.find(p => p.id === task.project_id);
                              const sprint = task.sprint_id ? allSprints.find(s => s.id === task.sprint_id) : null;
                              return proj ? (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/15">
                                    <FolderKanban className="h-2.5 w-2.5" />{proj.code}
                                  </span>
                                  {sprint && (
                                    <span className="inline-flex text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold border border-violet-500/15">
                                      {sprint.code}
                                    </span>
                                  )}
                                </div>
                              ) : null;
                            })()}
                          </div>

                          {/* Status transition buttons */}
                          {canUpdate && (
                            <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
                              {(STATUS_TRANSITIONS[task.status] || []).map(btn => {
                                const Icon = btn.icon;
                                const allowed = !btn.requiresReporter || canMoveToDone(task);
                                if (!allowed) return (
                                  <span
                                    key={btn.to}
                                    title="Chỉ người được báo cáo mới có thể thực hiện"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border bg-slate-100/50 dark:bg-slate-900/30 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none"
                                  >
                                    <Icon className="h-3 w-3" />{btn.label}
                                  </span>
                                );
                                return (
                                  <button
                                    key={btn.to}
                                    onClick={(e) => handleChangeTaskStatus(task, btn.to, e)}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${btn.cls}`}
                                  >
                                    <Icon className="h-3 w-3" />{btn.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Footer details */}
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-900/60 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="h-5 w-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[9px] font-bold uppercase shrink-0 text-indigo-600 dark:text-indigo-400">
                                  {getMemberName(task.assigned_to)?.charAt(0)}
                                </div>
                                <span className="text-slate-400 dark:text-slate-500 shrink-0">Giao:</span>
                                <span className="truncate text-slate-600 dark:text-slate-300">{getMemberName(task.assigned_to)}</span>
                              </div>
                              {task.due_date && (
                                <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium shrink-0">
                                  <Calendar className="h-3 w-3" />
                                  <span>{task.due_date.substring(5)}</span>
                                </div>
                              )}
                            </div>
                            {task.reported_to && (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="h-5 w-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[9px] font-bold uppercase shrink-0 text-amber-600 dark:text-amber-400">
                                  {getMemberName(task.reported_to)?.charAt(0)}
                                </div>
                                <span className="text-slate-400 dark:text-slate-500 shrink-0">Báo cáo:</span>
                                <span className="truncate text-slate-600 dark:text-slate-300">{getMemberName(task.reported_to)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table View */}
        {!loading && viewMode === 'table' && (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Mã / Ưu tiên</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên công việc</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Người giao / Báo cáo</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Hạn hoàn thành</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dự án</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {visibleTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="text-sm text-slate-400">Không có công việc nào</p>
                      </td>
                    </tr>
                  ) : visibleTasks.map(task => {
                    const proj = task.project_id ? projects.find(p => p.id === task.project_id) : null;
                    const sprint = task.sprint_id ? allSprints.find(s => s.id === task.sprint_id) : null;
                    const statusCol = {
                      todo:        ['Cần làm',   'bg-slate-500/10 text-slate-500 border-slate-500/20'],
                      in_progress: ['Đang làm',  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'],
                      review:      ['Chờ duyệt', 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'],
                      done:        ['Đã xong',   'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'],
                    }[task.status] || ['—', ''];
                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleOpenViewModal(task, { stopPropagation: () => {} })}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                      >
                        {/* Mã + Ưu tiên */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {task.code && (
                              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">{task.code}</span>
                            )}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase inline-flex w-fit ${getPriorityBadgeStyle(task.priority)}`}>
                              {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Vừa' : 'Thấp'}
                            </span>
                          </div>
                        </td>

                        {/* Tên + Mô tả */}
                        <td className="px-4 py-3 min-w-[200px] max-w-[300px]">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</p>
                          {task.description && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{task.description}</p>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusCol[1]}`}>{statusCol[0]}</span>
                        </td>

                        {/* Người giao + Báo cáo */}
                        <td className="px-4 py-3 min-w-[150px]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="h-4 w-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-600 shrink-0">
                                {getMemberName(task.assigned_to)?.charAt(0)}
                              </div>
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{getMemberName(task.assigned_to)}</span>
                            </div>
                            {task.reported_to && (
                              <div className="flex items-center gap-1.5">
                                <div className="h-4 w-4 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[8px] font-bold text-amber-600 shrink-0">
                                  {getMemberName(task.reported_to)?.charAt(0)}
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{getMemberName(task.reported_to)}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Hạn hoàn thành */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {task.due_date ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <Calendar className="h-3 w-3 shrink-0" />
                              {task.due_date}
                            </div>
                          ) : <span className="text-slate-300 dark:text-slate-700 text-[11px]">—</span>}
                        </td>

                        {/* Dự án */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {proj ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/15">{proj.code}</span>
                              {sprint && <span className="text-[10px] text-slate-400 dark:text-slate-500">{sprint.code}</span>}
                            </div>
                          ) : <span className="text-slate-300 dark:text-slate-700 text-[11px]">—</span>}
                        </td>

                        {/* Thao tác */}
                        <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5 justify-end">
                            {/* Nút chuyển trạng thái */}
                            {canUpdate && (STATUS_TRANSITIONS[task.status] || []).map(btn => {
                              const Icon = btn.icon;
                              const allowed = !btn.requiresReporter || canMoveToDone(task);
                              return (
                                <button
                                  key={btn.to}
                                  onClick={(e) => { e.stopPropagation(); if (allowed) handleChangeTaskStatus(task, btn.to, e); }}
                                  title={allowed ? btn.label : 'Chỉ người được báo cáo'}
                                  className={`p-1.5 rounded-lg transition-colors ${allowed ? 'cursor-pointer ' + btn.cls : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'}`}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </button>
                              );
                            })}

                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                            {canUpdate && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenEditModal(task); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenHistoryModal(task, e); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 transition-colors cursor-pointer"
                              title="Lịch sử"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id, task.title, e); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create or Edit Task */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

            {/* Box */}
            <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 animate-scale-up">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {editingTask ? 'Cập nhật công việc' : 'Tạo công việc mới'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {editingTask ? 'Chỉnh sửa và đồng bộ tiến độ công việc' : 'Thêm nhiệm vụ mới vào bảng Kanban'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Code field — read-only, auto-generated */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Mã công việc
                    {!editingTask && !taskCode && <span className="ml-1 text-slate-400 normal-case font-normal">(tự sinh khi chọn dự án)</span>}
                  </label>
                  <div className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono border ${taskCode ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold' : 'bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 italic'}`}>
                    {taskCode || '—'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tên công việc <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Ví dụ: Thiết kế cơ sở dữ liệu..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950/80"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mô tả công việc</label>
                  <textarea
                    rows={3}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Chi tiết yêu cầu, mục tiêu cần đạt được..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950/80 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Độ ưu tiên</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="high" className="bg-white dark:bg-slate-900 text-rose-500">Cao (High)</option>
                      <option value="medium" className="bg-white dark:bg-slate-900 text-amber-500">Vừa (Medium)</option>
                      <option value="low" className="bg-white dark:bg-slate-900 text-emerald-500">Thấp (Low)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Trạng thái cột</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="todo" className="bg-white dark:bg-slate-900 text-slate-500">Cần làm</option>
                      <option value="in_progress" className="bg-white dark:bg-slate-900 text-indigo-500">Đang làm</option>
                      <option value="review" className="bg-white dark:bg-slate-900 text-amber-500">Chờ duyệt</option>
                      <option value="done" className="bg-white dark:bg-slate-900 text-emerald-500">Đã xong</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Người được giao (Assignee)</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-400">Chưa phân công</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300">
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Người được báo cáo (Reporter)</label>
                  <select
                    value={taskReportedTo}
                    onChange={(e) => setTaskReportedTo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-400">Chưa chọn</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300">
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hạn hoàn thành</label>
                  <DatePickerInput
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> Dự án <span className="text-rose-500">*</span></span>
                    </label>
                    <select
                      required
                      value={taskProjectId}
                      onChange={(e) => handleProjectChangeInModal(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer ${!taskProjectId ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <option value="">-- Chọn dự án --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sprint</label>
                    <select
                      value={taskSprintId}
                      onChange={(e) => setTaskSprintId(e.target.value)}
                      disabled={!taskProjectId}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Chưa chọn sprint --</option>
                      {allSprints.filter(s => s.project_id === taskProjectId).map(s => (
                        <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 text-sm font-semibold border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {modalSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Đang lưu...
                      </>
                    ) : (
                      'Xác nhận lưu'
                    )}
                  </button>
                </div>
              </form>
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
                  {viewLog.title && (
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{viewLog.title}</h3>
                  )}
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

              {/* Footer actions */}
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
                  onClick={() => {
                    setIsLogModalOpen(false);
                    localStorage.setItem('aerotask_goto_log_date', viewLog.log_date);
                    router.push('/daily-logs');
                  }}
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

        {/* Modal: Task History */}
        {isHistoryModalOpen && historyTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-500/15 backdrop-blur-md" onClick={() => setIsHistoryModalOpen(false)} />

            <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative z-10 animate-scale-up">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lịch sử thay đổi</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[280px]">{historyTask.title}</p>
                </div>
              </div>

              {historyLoading ? (
                <div className="py-12 flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Đang tải lịch sử...</span>
                </div>
              ) : taskHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center gap-2">
                  <Clock className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                  Chưa có lịch sử thay đổi nào
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto pr-1">
                  {taskHistory.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          entry.action === 'create'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                        }`}>
                          {entry.action === 'create'
                            ? <Plus className="h-3.5 w-3.5" />
                            : <SlidersHorizontal className="h-3.5 w-3.5" />
                          }
                        </div>
                        {idx < taskHistory.length - 1 && (
                          <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
                        )}
                      </div>

                      <div className="pb-5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                            entry.action === 'create'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          }`}>
                            {entry.action === 'create' ? 'Tạo mới' : 'Cập nhật'}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{entry.changed_by}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto shrink-0">
                            {new Date(entry.changed_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{entry.changes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Xem chi tiết công việc */}
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
                    {/* Status */}
                    {(() => {
                      const col = { todo: ['Cần làm', 'bg-slate-500/10 text-slate-500 border-slate-500/20'], in_progress: ['Đang làm', 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'], review: ['Chờ duyệt', 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'], done: ['Đã xong', 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'] }[viewTask.status] || ['—', ''];
                      return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${col[1]}`}>{col[0]}</span>;
                    })()}
                    {/* Priority */}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getPriorityBadgeStyle(viewTask.priority)}`}>
                      {viewTask.priority === 'high' ? 'Ưu tiên Cao' : viewTask.priority === 'medium' ? 'Ưu tiên Vừa' : 'Ưu tiên Thấp'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleToggleFullHistory}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${showFullHistory ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'}`}
                    title="Lịch sử thay đổi"
                  >
                    <History className="h-3.5 w-3.5" />
                    Lịch sử
                  </button>
                  {canUpdate && (
                    <button
                      onClick={() => { setIsViewModalOpen(false); handleOpenEditModal(viewTask); }}
                      className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                      title="Chỉnh sửa công việc"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => setIsViewModalOpen(false)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-5">

                {/* Full history panel (toggled) */}
                {showFullHistory && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" /> Lịch sử thay đổi
                    </p>
                    {taskFullHistoryLoading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                      </div>
                    ) : taskFullHistory.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 text-center">Chưa có lịch sử thay đổi.</p>
                    ) : (
                      <div className="relative pl-4 space-y-0 max-h-60 overflow-y-auto">
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
                        {taskFullHistory.map((h, i) => (
                          <div key={h.id ?? i} className="relative flex gap-3 pb-3 last:pb-0">
                            <div className={`absolute -left-4 top-1 h-3 w-3 rounded-full border-2 border-slate-50 dark:border-slate-900 shrink-0 ${h.action === 'create' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                            <div className="flex-1 min-w-0 pl-1">
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
                )}

                {/* Description */}
                {viewTask.description && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mô tả</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{viewTask.description}</p>
                  </div>
                )}

                {/* Meta info */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Người được giao */}
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

                  {/* Người được báo cáo */}
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

                  {/* Hạn hoàn thành */}
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

                  {/* Dự án + Sprint */}
                  {viewTask.project_id && (() => {
                    const proj = projects.find(p => p.id === viewTask.project_id);
                    const sprint = viewTask.sprint_id ? allSprints.find(s => s.id === viewTask.sprint_id) : null;
                    return proj ? (
                      <>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <FolderKanban className="h-3 w-3" /> Dự án
                          </p>
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/15">{proj.code}</span>
                            {proj.name}
                          </span>
                        </div>
                        {sprint && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sprint</p>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{sprint.name}</span>
                          </div>
                        )}
                      </>
                    ) : null;
                  })()}
                </div>

                {/* Due date change history */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Lịch sử thay đổi hạn hoàn thành
                  </p>
                  {taskDueDateHistoryLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                    </div>
                  ) : taskDueDateHistory.length === 0 ? (
                    <div className="py-4 px-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-400 italic">Chưa có thay đổi hạn hoàn thành nào được ghi nhận.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {taskDueDateHistory.map((h, idx) => {
                        const parts = h.changes?.match(/Hạn hoàn thành:\s*(.+?)\s*[→>]\s*(.+)/);
                        return (
                          <div key={h.id || idx} className="flex items-start gap-3 px-3.5 py-3 bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-800/30 rounded-xl">
                            <CalendarDays className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              {parts ? (
                                <p className="text-xs text-slate-700 dark:text-slate-200">
                                  <span className="line-through text-slate-400 dark:text-slate-500 mr-1">
                                    {(() => { try { return new Date(parts[1].trim() + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return parts[1].trim(); } })()}
                                  </span>
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold mx-1">→</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    {(() => { try { return new Date(parts[2].trim() + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return parts[2].trim(); } })()}
                                  </span>
                                </p>
                              ) : (
                                <p className="text-xs text-slate-600 dark:text-slate-300">{h.changes}</p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {h.changed_by && <span className="font-medium text-slate-500 dark:text-slate-400">{h.changed_by} · </span>}
                                {new Date(h.changed_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

      </div>
    </DashboardLayout>
  );
}
